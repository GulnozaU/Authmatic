# Agent service (FastAPI) — teammate instructions

**Owner:** Teammate (backend + sponsor integrations)  
**Full work split:** [docs/team-split-report.md](../../docs/team-split-report.md)

---

## Important: agent already partially works

A **simulated 5-step agent** runs today in `apps/web`. The demo works end-to-end without your FastAPI service:

```bash
cd apps/web && npm run dev    # often port 3001
# http://localhost:3001 → Run demo → /run/{id}
```

Your job: **replace 3 fake steps** (EXTRACT, VERIFY, SUBMIT) with real sponsor calls. Steps 4–5 partially exist — adjudicate API is built; you add InsForge `agent_events` + Tigris uploads.

**Contract to match:** `apps/web/src/lib/agent-orchestrator.ts`

---

## Do these in order

### 1. Read (30 min)

- `apps/web/src/lib/agent-orchestrator.ts`
- `apps/web/src/lib/agent-runs.ts`
- [docs/healthfirst-portal-handoff.md](../../docs/healthfirst-portal-handoff.md)
- [mock/healthfirst-portal.json](../../mock/healthfirst-portal.json)

### 2. Scaffold FastAPI in `apps/agent/`

Endpoints:

| Method | Path |
|--------|------|
| `GET` | `/health` |
| `POST` | `/api/run` |
| `GET` | `/api/run/{id}` |
| `GET` | `/api/stream/{id}` (SSE) |

Env (match actual web port):

```bash
WEB_URL=http://localhost:3001
PORTAL_URL=http://localhost:3001/portal/healthfirst/prior-auth
AGENT_URL=http://localhost:8000
```

### 3. EXTRACT — Daytona

PDFs: `assets/demo/patient_chart_sarah_martinez.pdf`, `prescription_ozempic_martinez.pdf`  
Output: 8 fields (see `mock/healthfirst-case.json`). Fallback: fixture if `DEMO_FIXTURE_MODE=true`.

### 4. VERIFY — Opsera

Scan extracted fields before submit. Emit SSE step 2. Stop on failure.

### 5. SUBMIT — Rtrvr

```
Open {PORTAL_URL}.
Fill #patient_name #dob #member_id #diagnosis #medication #dosage #provider_name #justification.
Click #submit-prior-auth.
Return reference_id from /portal/healthfirst/submission/PA-* URL.
```

**Do not rebuild the portal** — use our form at `PORTAL_URL`.

### 6. ADJUDICATE — call our API

```bash
POST {WEB_URL}/api/pa/{reference_id}/adjudicate
Body: { "review_delay_ms": 8000 }
```

Then `GET {WEB_URL}/api/pa/{reference_id}` until approved/denied.

### 7. PERSIST — InsForge + Tigris

- Insert each step → `agent_events` table
- Insert/update `prior_auths` with receipt + Tigris storage keys
- Upload PDFs to Tigris bucket `authmatic-demo`

Schema: `db/001_authmatic_schema.sql` · Setup: [docs/insforge.md](../../docs/insforge.md), [docs/tigris.md](../../docs/tigris.md)

### 8. Wire to UI

Proxy web `/api/stream` → your FastAPI SSE, **or** point home page to `AGENT_URL`. Keep `/run/[id]` unchanged.

### 9. Deploy Render

Public `WEB_URL` + `AGENT_URL`. Update `PORTAL_URL`.

---

## Do NOT build

- HealthFirst portal / form
- `/api/pa/submit`, `/api/pa/{ref}`, `/api/pa/{ref}/adjudicate`
- `/run/[id]` audit UI
- Adjudication rules (`apps/web/src/lib/adjudication.ts`)

---

## Done when

- [ ] Rtrvr fills real portal → real `reference_id`
- [ ] Adjudicate API returns `approved` for Sarah demo
- [ ] SSE events match shape in `agent-runs.ts`
- [ ] `agent_events` + `prior_auths` in InsForge
- [ ] PDFs in Tigris
- [ ] `DEMO_FIXTURE_MODE` fallback works

---

## Docs

| File | Purpose |
|------|---------|
| [docs/team-split-report.md](../../docs/team-split-report.md) | Full split + acceptance checklist |
| [docs/healthfirst-portal-handoff.md](../../docs/healthfirst-portal-handoff.md) | Portal + API spec |
| [mock/healthfirst-portal.json](../../mock/healthfirst-portal.json) | Rtrvr selectors |
