# Authmatic

> Applied Intelligence Hackathon · 31 May 2026 · Frontier Tower SF
>
> An autonomous agent that files real prior authorizations on real payer
> portals in 90 seconds, with a HIPAA-grade audit trail. Built around
> four sponsors: **Opsera · Daytona · Insforge · Rtrvr.ai**.
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
# expects: ✓ Rtrvr  ✓ Daytona  ✓ Opsera  ✓ Insforge
```

### 5. Seed demo data + run
```bash
make seed
make dev                         # runs web (3000) + agent (8000) concurrently
open http://localhost:3000       # then click any of the three scenario tiles
```

## Demo flow

The homepage ships **three one-click scenarios** plus a free-form
dropzone. Each scenario lands a distinct beat for the "Agents That Act"
rubric:

| Tile | What it proves | Sponsor highlight |
|---|---|---|
| **Happy path** — Lisinopril 10mg → UnitedHealthcare | The agent acts end-to-end: drops, parses, verifies, files, returns a receipt URL. | Daytona sandboxes the parse; Rtrvr files the form. |
| **Different payer** — Ozempic for Sarah Martinez → HealthFirst | Routing is driven by member ID, not hardcoded. The same loop adapts to a different portal (`/portal/healthfirst/`). | Rtrvr drives the mock HealthFirst portal in `apps/web/src/app/portal/healthfirst/`. |
| **Safety net** — Same Rx with an extra SSN | The agent *halts before submission* when Opsera flags PHI over-disclosure. No receipt is issued. The agent demonstrates not-acting when acting would be wrong. | Opsera MCP catches the SSN field; Insforge persists the halt reason for audit. |

Free-form: drag any prescription PDF onto the dropzone for a custom run.

After every run the page auto-redirects to **`/run/:id`** — the audit
chain. Each step is cited back to the source PDF and the sponsor tool
that produced it. The receipt URL on the happy-path / different-payer
tiles opens a payer-portal-style confirmation at **`/receipt/:id`**.

Full walkthrough in [demo/pitch-script.md](demo/pitch-script.md).

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
| **Rtrvr.ai** | READ-WEB + ACTION (drives payer portal) | `apps/agent/src/tools/read_web.py` |
| **Daytona** | EXECUTE (sandboxed PDF parsing + normalization) | `apps/agent/src/tools/execute.py` |
| **Opsera** | VERIFY (PHI exposure scan via MCP) | `apps/agent/src/tools/verify.py` |
| **Insforge** | PERSIST (Postgres + pgvector + edge fn + model gateway) + planner LLM | `apps/agent/src/{insforge_client,persist}.py` |

Stretch (if time): NEAR AI (TEE attestation), Tigris (chart storage),
Brain2 (voice trigger).

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
