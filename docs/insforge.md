# InsForge — Authmatic workflow database

**InsForge = Postgres + workflow.** Files (PDFs, receipts) go to **Tigris** — see [tigris.md](./tigris.md).

## What's in InsForge

| Table | Holds |
|-------|-------|
| `pa_submissions` | Mock HealthFirst form submissions + PA status |
| `prior_auths` | Agent runs |
| `agent_events` | Agent step audit log |
| `demo_cases` | Sarah demo metadata + **Tigris** storage URLs |

**Project URL:** `https://fj245m46.us-east.insforge.app`

## Setup

```bash
npx @insforge/cli db import db/001_authmatic_schema.sql -y
```

## App config

```
INSFORGE_API_KEY=   # from .insforge/project.json
INSFORGE_PROJECT_URL=https://fj245m46.us-east.insforge.app
```

## Code

- `apps/web/src/lib/insforge/admin.ts`
- `apps/web/src/lib/submissions.ts` → `pa_submissions`
