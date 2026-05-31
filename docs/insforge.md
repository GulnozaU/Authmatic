# InsForge — Authmatic data layer

All persistent data lives in **InsForge** (no Tigris, no local JSON files).

## What's in InsForge

| InsForge | Table / bucket | Holds |
|----------|----------------|-------|
| Postgres | `pa_submissions` | Mock HealthFirst form submissions + PA status |
| Postgres | `prior_auths` | Agent runs (teammate wires this) |
| Postgres | `agent_events` | Agent step audit log |
| Postgres | `demo_cases` | Sarah Martinez demo case + storage URLs |
| Storage | `authmatic-demo` | Patient chart + prescription PDFs |

**Project URL:** `https://fj245m46.us-east.insforge.app`

## Setup (already done once)

```bash
npx @insforge/cli db import db/001_authmatic_schema.sql -y
npx @insforge/cli storage create-bucket authmatic-demo --public -y
npx @insforge/cli storage upload assets/demo/patient_chart_sarah_martinez.pdf --bucket authmatic-demo --key demo/patient_chart_sarah_martinez.pdf
npx @insforge/cli storage upload assets/demo/prescription_ozempic_martinez.pdf --bucket authmatic-demo --key demo/prescription_ozempic_martinez.pdf
# seed demo_cases row — see apps/web/scripts or db query in docs
```

## App config

Copy API key from `.insforge/project.json` → `apps/web/.env.local`:

```
INSFORGE_API_KEY=ik_...
INSFORGE_PROJECT_URL=https://fj245m46.us-east.insforge.app
```

## Code

- Server client: `apps/web/src/lib/insforge/admin.ts`
- PA submissions: `apps/web/src/lib/submissions.ts` → `pa_submissions` table

## Teammate (FastAPI agent)

Use same InsForge project for `prior_auths` + `agent_events` + PDF uploads on `/api/run`.
