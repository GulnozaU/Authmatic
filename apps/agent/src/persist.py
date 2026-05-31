"""Run management — used by the FastAPI layer (not the agent loop itself).

The agent's PERSIST *verb* lives in src/tools/persist.py and writes per-step
side effects. This module manages whole runs: create one, fetch its detail,
replay events from durable state.
"""

from __future__ import annotations

from datetime import date

import asyncpg


# A demo patient gets seeded on every fresh run if none exists — see
# scripts/seed.sh for the full set. This is the fallback so a clean DB
# doesn't blow up.
_FALLBACK_PATIENT = {
    "full_name": "Jane Doe",
    "dob": date(1968, 4, 12),
    "plan_id": "UHC-CHOICE-PLUS",
    "member_id": "UHC-000000-DEMO",
}


async def create_run(pool: asyncpg.Pool, pdf_bytes: bytes, filename: str) -> str:
    """Insert a fresh prior_auths row, return its UUID as str.

    For the demo, the PDF is stored to Insforge object storage and the key
    is written to trigger_pdf_key. For local dev we just keep it in-memory.
    """
    async with pool.acquire() as conn:
        async with conn.transaction():
            patient_id = await conn.fetchval(
                "SELECT id FROM patients ORDER BY created_at DESC LIMIT 1"
            )
            if patient_id is None:
                patient_id = await conn.fetchval(
                    """
                    INSERT INTO patients (full_name, dob, plan_id, member_id)
                    VALUES ($1, $2, $3, $4) RETURNING id
                    """,
                    _FALLBACK_PATIENT["full_name"],
                    _FALLBACK_PATIENT["dob"],
                    _FALLBACK_PATIENT["plan_id"],
                    _FALLBACK_PATIENT["member_id"],
                )

            # In production: upload pdf_bytes to Insforge storage, get a key.
            # For the demo path we just stash the filename.
            storage_key = f"charts/{filename}"

            run_id = await conn.fetchval(
                """
                INSERT INTO prior_auths
                  (patient_id, drug_name, trigger_pdf_key, status)
                VALUES ($1, '<pending>', $2, 'pending')
                RETURNING id
                """,
                patient_id,
                storage_key,
            )
    return str(run_id)


async def append_event(
    pool: asyncpg.Pool,
    pa_id: str,
    step_no: int,
    verb: str,
    plan: str,
    tool_input: dict | None,
    tool_output: dict | None,
    duration_ms: int,
) -> dict:
    """Insert one agent_events row, return it shaped for SSE."""
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO agent_events
              (pa_id, step_no, verb, plan, tool_input, tool_output, duration_ms)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            """,
            pa_id, step_no, verb, plan, tool_input, tool_output, duration_ms,
        )
    return {
        "step_no": step_no,
        "verb": verb,
        "plan": plan,
        "tool_input": tool_input,
        "tool_output": tool_output,
        "duration_ms": duration_ms,
    }


async def update_status(
    pool: asyncpg.Pool,
    pa_id: str,
    status: str,
    receipt_url: str | None = None,
    drug_name: str | None = None,
    dose: str | None = None,
    diagnosis_code: str | None = None,
    rationale: str | None = None,
) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            """
            UPDATE prior_auths SET
              status         = $2,
              receipt_url    = COALESCE($3, receipt_url),
              drug_name      = COALESCE($4, drug_name),
              dose           = COALESCE($5, dose),
              diagnosis_code = COALESCE($6, diagnosis_code),
              rationale      = COALESCE($7, rationale)
            WHERE id = $1
            """,
            pa_id, status, receipt_url, drug_name, dose, diagnosis_code, rationale,
        )


async def fetch_run_detail(pool: asyncpg.Pool, run_id: str) -> dict | None:
    """Hydrate everything the audit page needs in one trip."""
    async with pool.acquire() as conn:
        pa = await conn.fetchrow("SELECT * FROM prior_auths WHERE id = $1", run_id)
        if pa is None:
            return None
        patient = await conn.fetchrow(
            "SELECT full_name, dob, plan_id, member_id FROM patients WHERE id = $1",
            pa["patient_id"],
        )
        events = await conn.fetch(
            """
            SELECT step_no, verb, plan, tool_input, tool_output, duration_ms
            FROM agent_events WHERE pa_id = $1 ORDER BY step_no
            """,
            run_id,
        )
        scan = await conn.fetchrow(
            """
            SELECT passed, flagged_fields, scanned_at
            FROM compliance_scans WHERE pa_id = $1
            ORDER BY scanned_at DESC LIMIT 1
            """,
            run_id,
        )

    return {
        "id": str(pa["id"]),
        "patient": dict(patient) if patient else None,
        "drug": {
            "name": pa["drug_name"],
            "dose": pa["dose"],
            "diagnosis_code": pa["diagnosis_code"],
        },
        "status": pa["status"],
        "receipt_url": pa["receipt_url"],
        "rationale": pa["rationale"],
        "events": [dict(r) for r in events],
        "scan": dict(scan) if scan else None,
        "created_at": pa["created_at"].isoformat(),
    }


async def poll_events_since(
    pool: asyncpg.Pool, run_id: str, after_step: int
) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT step_no, verb, plan, tool_input, tool_output, duration_ms
            FROM agent_events
            WHERE pa_id = $1 AND step_no > $2
            ORDER BY step_no
            """,
            run_id, after_step,
        )
    return [dict(r) for r in rows]
