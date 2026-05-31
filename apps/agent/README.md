# Agent service (FastAPI)

**Owner:** Teammate (primary). You help wire Rtrvr → mock portal.

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/run` | Accept PDFs, return `run_id` |
| `GET` | `/api/run/{id}` | Full audit payload for `/run/[id]` |
| `GET` | `/api/stream/{id}` | SSE — agent reasoning steps |
| `GET` | `/health` | Smoke test |

## Agent loop (4 steps for demo)

1. **EXTRACT** — parse PDFs (LLM or pdfplumber + fixture fallback)
2. **PREPARE** — build form payload from `mock/healthfirst-case.json` fields
3. **SUBMIT** — Rtrvr opens `PORTAL_URL`, fills form, clicks Submit
4. **PERSIST** — Tigris receipt + InsForge workflow log

## Rtrvr task (mock portal)

Point Rtrvr at **your** portal, not a real payer:

```
Open {PORTAL_URL}. Fill: patient_name, dob, member_id, diagnosis,
medication, dosage, provider_name, justification. Click Submit.
Return the reference ID from the success page URL.
```

## Fixture fallback

When `DEMO_FIXTURE_MODE=true`, skip live Rtrvr and return canned receipt `PA-2026-00451`.
