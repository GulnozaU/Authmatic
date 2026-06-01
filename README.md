# Authmatic

> Applied Intelligence Hackathon · 31 May 2026 · Frontier Tower SF
>
> An autonomous agent that files real prior authorizations on real payer
> portals in 90 seconds, with a HIPAA-grade audit trail. Built around
> five sponsors: **Opsera · Daytona · Insforge · Rtrvr.ai · Tigris**.
>
> **Live demo:** https://z739c3mi.insforge.site/

## What's in this repo

```
.
├── README.md                  ← you are here (setup + run)
├── SUBMISSION.md              ← the text to paste into the submission form
├── LICENSE                    ← MIT
├── AGENTS.md                  ← coordination rules for multi-agent work
├── .env.example               ← required secrets (copy to .env)
├── Makefile                   ← one-liners: `make smoke`, `make dev`, `make seed`
├── docker-compose.local.yml   ← local Postgres + pgvector fallback
├── package.json               ← workspace root (pnpm)
├── apps/
│   ├── web/                   ← Next.js 14 UI
│   │   └── src/app/
│   │       ├── login/         ← clinic sign-in (demo accounts printed on page)
│   │       ├── dashboard/     ← KPIs, recent runs, PA submissions list
│   │       ├── page.tsx       ← New PA — 4 patient cases + "Run 4 in parallel" + Maria Santos safety
│   │       ├── run/[id]/      ← live agent typing into HealthFirst form
│   │       ├── batch/[id]/    ← parallel-run watcher (4 forms filling at once)
│   │       ├── security/      ← HIPAA compliance log (Opsera + sign-ins)
│   │       ├── receipt/[id]/  ← payer-portal-style confirmation page
│   │       ├── portal/healthfirst/  ← HealthFirst provider portal Rtrvr drives
│   │       └── api/           ← run, sample, stream, pa, portal, dashboard, batch, security-log handlers
│   └── agent/                 ← FastAPI agent service (4-verb ReAct loop)
│       ├── main.py            ← endpoints + SSE
│       ├── src/loop.py        ← the loop itself
│       ├── src/tools/         ← READ-WEB, EXECUTE, VERIFY, PERSIST
│       └── render.yaml        ← Render deploy manifest
├── db/
│   └── schema.sql             ← Postgres + pgvector schema
├── assets/
│   ├── demo/                  ← richer letterhead PDFs + charts
│   └── fixtures/              ← canonical demo PDFs + sponsor fixtures
├── mock/                      ← HealthFirst portal fixture state (JSON)
├── docs/
│   ├── architecture.md        ← Full system architecture
│   ├── healthfirst-portal-handoff.md
│   ├── team-split-report.md
│   └── insforge.md / tigris.md
├── scripts/
│   ├── smoke.sh               ← Hello-world each sponsor (preflight)
│   ├── seed.py / seed.sh      ← Populate demo patients + prior approvals
│   ├── reset.sh               ← Wipe + re-seed for a clean demo run
│   ├── gen_demo_pdfs.py       ← Generate Lisinopril/Metformin PDFs
│   ├── gen_mock_pdfs.py       ← Generate letterhead PDFs + insurance cards
│   └── generate_handoff_pdf.py
└── demo/
    ├── pitch-script.md        ← 3-minute pitch
    ├── presentation.html      ← Slide deck (browser-rendered)
    └── recordings/            ← Fallback screencast goes here
```

## Setup (one-time, ~15 minutes)

### 0. Prereqs
- Node 20+, pnpm 9+, Python 3.12+, Docker (for local Postgres fallback)
- Accounts on: [Opsera](https://opsera.io), [Daytona](https://daytona.io),
  [Insforge](https://insforge.dev), [Rtrvr.ai](https://rtrvr.ai)

### 1. Clone and install
```bash
git clone https://github.com/r2st/Authmatic.git
cd Authmatic
cp .env.example .env             # fill in the 7 secrets — see comments
pnpm install                     # web deps
pip install -r apps/agent/requirements.txt
```

### 2. Provision the backend (Insforge)
```bash
# Either: spin up Insforge cloud (recommended)
insforge init --project authmatic
psql "$INSFORGE_DB_URL" -f db/schema.sql

# Or: self-host (Docker Compose fallback)
docker compose -f docker-compose.local.yml up -d
```

### 3. Pre-bake the Daytona snapshot (saves 30s per cold start)
```bash
daytona snapshot create authmatic-v1 \
  --image python:3.12-slim \
  --setup "pip install pdfplumber pydantic icd10-cm"
# copy the snapshot ID into DAYTONA_SNAPSHOT_ID in .env
```

### 4. Smoke test everything
```bash
make smoke
# expects: ✓ Insforge  ✓ Daytona  ✓ Rtrvr  ✓ Agent  ✓ Parser
```

### 5. Seed demo data + run
```bash
make seed
make dev                         # runs web (3000) + agent (8000) concurrently
open http://localhost:3000       # sign in with a demo account, then file a PA
```

## Demo flow

The live deploy is a **clinic console** — one screen, one job: file a
new prior authorization. The judged path top to bottom:

1. **Login** (`/login`) — clinic accounts (medical assistant or provider).
   Demo accounts are printed on the page so judges can sign in:
   `ma@bayarea-care.com / demo123` and `emily.chen@bayarea-care.com / demo123`.
2. **Dashboard** (`/dashboard`) — KPIs, recent submissions, today's
   queue across 4 patient cases.
3. **New PA** (`/`) — four patient cards. Click **Try the demo** on
   Sarah Martinez (Ozempic → HealthFirst) for the single happy path, or
   **Run 4 patients in parallel** to watch the whole Friday queue
   fan out at once.
4. **Run page** (`/run/<id>`) — live SSE stream of the 5-step agent
   lifecycle, with each card lighting up as the step completes:
   - **EXTRACT** (Daytona) — sandbox parses the chart + prescription PDFs
   - **VERIFY** (Opsera) — PHI / policy scan before anything leaves
   - **SUBMIT** (Rtrvr) — real browser session drives the HealthFirst
     portal at `/portal/healthfirst/prior-auth?autofill=1` and types
     into the form field-by-field
   - **ADJUDICATE** — the portal's rule engine returns a decision
   - **PERSIST** (Insforge + Tigris) — chain into Postgres, artifacts
     (chart, prescription, signed receipt) into Tigris
5. **Receipt** (`/receipt/<id>`) — payer-style confirmation with
   reference number `PA-2026-<id>`. Every field is citable back to a
   source PDF in Tigris.
6. **Security log** (`/security`) — HIPAA compliance trail: sign-ins,
   Opsera halts, every action attributable to an operator.

**Safety beat:** the Maria Santos card embeds an extra SSN line. Opsera
VERIFY catches it, the agent halts before submit, and the halt reason
is written to `/security`. The agent demonstrates *not acting* when
acting would be wrong.

Full walkthrough: [demo/pitch-script.md](demo/pitch-script.md).

## Optional payer portal surface

The web app also includes a standalone HealthFirst mock payer portal adapted
from the GulnozaU/Authmatic repo:

- `/portal/healthfirst/prior-auth` — Rtrvr-friendly PA form with stable field ids.
- `/portal/healthfirst/submission/:ref` — status page that polls local portal state.
- `/api/portal/healthfirst/pa/submit` — local submit endpoint, no Insforge key required.
- `/api/portal/healthfirst/pa/:ref/adjudicate` — deterministic review simulation.

This is an optional demo artifact; the primary judged flow remains the PDF
dropzone → `/run/:id` audit page → receipt URL.

## Architecture in one diagram

```
[PDF drop] → [Insforge state] → [ReAct loop ≤5 iter]
                                      │
        ┌─────────────┬───────────────┼─────────────────┐
        ▼             ▼               ▼                 ▼
   READ-WEB       EXECUTE          VERIFY            PERSIST
   (Rtrvr.ai)    (Daytona)       (Opsera MCP)      (Insforge)
        │             │               │                 │
        └─────────────┴───────────────┴─────────────────┘
                                      │
                                      ▼
                              [ACTION: Rtrvr files form]
                                      │
                                      ▼
                              [/run/:id auditor page]
```

Full detail: [`docs/architecture.md`](docs/architecture.md).

## Sponsor APIs used

| Sponsor | Role | Where in the code |
|---------|------|-------------------|
| **Daytona** | **EXTRACT** — sandboxed parser for chart + prescription PDFs | `apps/agent/src/tools/execute.py` |
| **Opsera** | **VERIFY** — PHI / policy exposure scan via MCP, halts before submit | `apps/agent/src/tools/verify.py` |
| **Rtrvr.ai** | **SUBMIT** — real browser session drives the HealthFirst provider portal | `apps/agent/src/tools/read_web.py` |
| **Insforge** | **PERSIST** — Postgres + pgvector + edge fn + model gateway + auth | `apps/web/src/lib/insforge/admin.ts`, `apps/agent/src/{insforge_client,persist}.py` |
| **Tigris** | **PERSIST** — S3-compatible storage for charts, prescriptions, signed receipts | `apps/web/src/lib/tigris/{client,persist-run}.ts` |

Stretch (if time): NEAR AI (TEE attestation), Brain2 (voice trigger).

## Fallback mode

Set `DEMO_FIXTURE_MODE=true` in `.env` to short-circuit live sponsor
calls and replay from `assets/fixtures/`. The audit page renders
identically — useful for offline practice and as conference-WiFi
insurance.

## Submitting

When ready, see [SUBMISSION.md](SUBMISSION.md) — the text to paste into
the Legion Events submission form. Submit by 15:00 PT (2h before
deadline, per playbook).

## License

MIT for hackathon purposes. Sponsor APIs are governed by their
respective terms.
