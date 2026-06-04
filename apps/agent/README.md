# Agent service (FastAPI)

FastAPI service for the Authmatic prior-authorization agent. It exposes the
agent run API/SSE surface and coordinates the sponsor-backed tools used by the
web app demo.

**Integration surface:** the mock HealthFirst portal in `apps/web`.
**Machine-readable portal spec:** [`mock/healthfirst-portal.json`](../../mock/healthfirst-portal.json)

---

## What the service does

1. **EXTRACT** — parse chart and prescription PDFs with the Daytona-backed tool.
2. **VERIFY** — run the Opsera compliance scan before any submission.
3. **SUBMIT** — use Rtrvr to drive the HealthFirst prior-auth form.
4. **ADJUDICATE** — call the web app payer-review endpoint for the submitted ref.
5. **PERSIST** — write workflow events to InsForge and artifacts to Tigris.

---

## Local setup

```bash
cd apps/agent
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The web app proxies `/api/agent/*` to `AGENT_BASE_URL` when configured.
For local development, run the web app on port 3000 and the agent on port 8000.

```bash
WEB_URL=http://localhost:3000
PORTAL_URL=http://localhost:3000/portal/healthfirst/prior-auth
AGENT_BASE_URL=http://localhost:8000
```

---

## Portal URLs

| URL | Purpose |
|-----|---------|
| `{WEB_URL}/portal/healthfirst/prior-auth` | HealthFirst form driven by Rtrvr |
| `{WEB_URL}/portal/healthfirst/submission/{ref}` | Status page after submit |
| `{WEB_URL}/run/{run_id}` | Audit UI in the Next.js app |

---

## Form selectors

| Field | Selector | Demo value |
|-------|----------|------------|
| Patient Name | `#patient_name` | Sarah Martinez |
| DOB | `#dob` | 03/14/1986 |
| Member ID | `#member_id` | HF45821973 |
| Diagnosis | `#diagnosis` | Type 2 Diabetes (E11.9) |
| Medication | `#medication` | Ozempic |
| Dosage | `#dosage` | 0.25mg weekly |
| Provider | `#provider_name` | Emily Chen, MD |
| Justification | `#justification` | Poor glycemic control despite first-line therapy... |
| Submit | `#submit-prior-auth` | - |

Full selector data lives in [`mock/healthfirst-portal.json`](../../mock/healthfirst-portal.json).

---

## API surface

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/run` | Accept a case payload/PDF set and create an agent run |
| `GET` | `/api/run/{id}` | Return the full audit payload |
| `GET` | `/api/stream/{id}` | Stream agent lifecycle events over SSE |
| `GET` | `/health` | Smoke-test endpoint |

The Next.js app also provides local payer endpoints used by the run loop:

| Method | Path | When |
|--------|------|------|
| `POST` | `/api/pa/submit` | Optional direct submit path |
| `GET` | `/api/pa/{ref}` | Poll portal status |
| `POST` | `/api/pa/{ref}/adjudicate` | Run deterministic payer review |

---

## Fixture fallback

When `DEMO_FIXTURE_MODE=true`, the agent skips live sponsor calls and replays
fixture artifacts from `assets/fixtures/`. The audit page and SSE event shape
stay the same so the demo remains stable offline.

---

## Docs

| File | Purpose |
|------|---------|
| [mock/healthfirst-portal.json](../../mock/healthfirst-portal.json) | Machine-readable selectors + API notes |
| [mock/healthfirst-case.json](../../mock/healthfirst-case.json) | Sarah Martinez demo data |
| [docs/architecture.md](../../docs/architecture.md) | System design |
| [docs/insforge.md](../../docs/insforge.md) | Database/backend setup |
| [docs/tigris.md](../../docs/tigris.md) | PDF artifact storage |
