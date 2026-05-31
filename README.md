# Authmatic

> Applied Intelligence Hackathon · 31 May 2026 · Frontier Tower SF
>
> An autonomous agent that files real prior authorizations on real payer
> portals, with a HIPAA-grade audit trail. Built around four sponsors:
> **Opsera · Daytona · Insforge · Rtrvr.ai**.

## What's in this repo

```
.
├── README.md              ← you are here (setup + run)
├── SUBMISSION.md          ← the text to paste into the submission form
├── .env.example           ← required secrets (copy to .env)
├── Makefile               ← one-liners: `make smoke`, `make dev`, `make seed`
├── package.json           ← workspace root (pnpm)
├── apps/
│   ├── web/               ← Next.js 14 UI (dropzone + audit page)
│   └── agent/             ← FastAPI agent service (the 4-verb ReAct loop)
├── db/
│   └── schema.sql         ← Insforge Postgres + pgvector schema
├── assets/
│   └── fixtures/          ← Cached sponsor responses for the demo
├── docs/
│   └── architecture.md    ← Full system architecture
├── scripts/
│   ├── smoke.sh           ← Hello-world each sponsor (run at preflight)
│   ├── seed.sh            ← Populate demo patients + prior approvals
│   └── reset.sh           ← Wipe + re-seed for a clean demo run
└── demo/
    ├── pitch-script.md    ← 3-minute pitch
    └── recordings/        ← Fallback screencast goes here
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
open http://localhost:3000
```

## Demo flow

1. Drag `assets/fixtures/rx-lisinopril.pdf` onto the dropzone.
2. Watch four step cards appear — one per sponsor verb.
3. Click through to `/run/:id` — the audit page.
4. Click the receipt URL → opens the (sandbox) payer confirmation page.

Full walkthrough in [demo/pitch-script.md](demo/pitch-script.md).

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
| **Insforge** | PERSIST (Postgres + pgvector + edge fn + model gateway) | `apps/agent/src/{insforge_client,tools/persist}.py` |

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
