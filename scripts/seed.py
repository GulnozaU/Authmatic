"""Seed the Authmatic Postgres demo data.

Pulls patients + past approvals from assets/fixtures/mock_data.json and
adds the simple "Jane Doe / UHC" patient that the gen_demo_pdfs.py PDFs
reference. Idempotent — re-running is safe; ON CONFLICT (member_id) skips.

Run via:
    python scripts/seed.py
    # OR
    make seed

Env: reads INSFORGE_DB_URL from the environment (.env auto-loaded if present).
"""

from __future__ import annotations

import asyncio
import json
import os
import sys
from datetime import date
from pathlib import Path

import asyncpg

try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    pass


HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
MOCK_DATA = ROOT / "assets" / "fixtures" / "mock_data.json"


# Patient that the simple Rx PDFs (rx-lisinopril, rx-metformin) reference.
# Lives outside mock_data.json because mock_data is "realistic letterhead"
# scenarios; this one matches the simple gen_demo_pdfs.py output.
JANE_DOE = {
    "full_name": "Jane Doe",
    "dob": date(1968, 4, 12),
    "plan_id": "UHC-CHOICE-PLUS",
    "member_id": "UHC-000000-DEMO1",
}


def _patient_rows() -> list[dict]:
    rows = [JANE_DOE]
    data = json.loads(MOCK_DATA.read_text())
    for p in data["patients"]:
        ins = p["insurance"]
        rows.append({
            "full_name": p["full_name"],
            "dob": date.fromisoformat(p["dob"]),
            "plan_id": ins["plan_id"],
            "member_id": ins["member_id"],
        })
    return rows


def _past_approvals(data: dict, patient_by_member: dict[str, str]) -> list[dict]:
    """Map mock_data.past_approvals rows to prior_auths inserts.

    Skips any row whose patient isn't seeded.
    """
    out = []
    for a in data["past_approvals"]:
        # past_approvals reference patients by mock_data id (pat_xxx), not
        # by member_id. Cross-reference via patients[].id.
        member = next(
            (p["insurance"]["member_id"]
             for p in data["patients"] if p["id"] == a["patient_id"]),
            None,
        )
        pid = patient_by_member.get(member) if member else None
        if not pid:
            continue
        out.append({
            "patient_id": pid,
            "drug_name": a["drug"],
            "diagnosis_code": a["icd10"],
            "status": a["status"],
            "receipt_url": a.get("receipt_url"),
            "rationale": a.get("rationale_summary"),
        })
    return out


async def seed() -> None:
    db_url = os.environ.get("INSFORGE_DB_URL")
    if not db_url:
        sys.exit("INSFORGE_DB_URL not set — copy .env.example to .env and fill in")

    conn = await asyncpg.connect(db_url)
    try:
        # ─── Patients ────────────────────────────────────────────────
        rows = _patient_rows()
        inserted = 0
        for r in rows:
            n = await conn.fetchval(
                """
                INSERT INTO patients (full_name, dob, plan_id, member_id)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (member_id) DO NOTHING
                RETURNING 1
                """,
                r["full_name"], r["dob"], r["plan_id"], r["member_id"],
            )
            if n:
                inserted += 1
        print(f"patients: {inserted} inserted, {len(rows) - inserted} already present")

        # Build member_id → patient.id map for past-approvals linkage.
        member_rows = await conn.fetch("SELECT id::text, member_id FROM patients")
        patient_by_member = {r["member_id"]: r["id"] for r in member_rows}

        # ─── Past approvals ──────────────────────────────────────────
        data = json.loads(MOCK_DATA.read_text())
        approvals = _past_approvals(data, patient_by_member)
        if approvals:
            # Idempotency check: count existing approved rows per patient.
            existing = await conn.fetchval(
                "SELECT count(*) FROM prior_auths WHERE status = 'approved'"
            )
            if existing >= len(approvals):
                print(f"past approvals: {existing} already present, skipping")
            else:
                for a in approvals:
                    await conn.execute(
                        """
                        INSERT INTO prior_auths
                          (patient_id, drug_name, diagnosis_code, status,
                           receipt_url, rationale)
                        VALUES ($1, $2, $3, $4, $5, $6)
                        """,
                        a["patient_id"], a["drug_name"], a["diagnosis_code"],
                        a["status"], a["receipt_url"], a["rationale"],
                    )
                print(f"past approvals: {len(approvals)} inserted")
        else:
            print("past approvals: none to insert")

        # ─── Summary ─────────────────────────────────────────────────
        n_patients = await conn.fetchval("SELECT count(*) FROM patients")
        n_pa = await conn.fetchval("SELECT count(*) FROM prior_auths")
        print(f"\nTotals — patients: {n_patients}, prior_auths: {n_pa}")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(seed())
