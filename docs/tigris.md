# InsForge — Postgres + workflow

See [insforge.md](./insforge.md). Tables: `pa_submissions`, `prior_auths`, `agent_events`, `demo_cases`.

# Tigris — file storage

PDFs and submission receipts live in **Tigris** (S3-compatible). InsForge stores metadata + URLs.

## Env vars

```
TIGRIS_ACCESS_KEY_ID=
TIGRIS_SECRET_ACCESS_KEY=
TIGRIS_ENDPOINT=https://t3.storage.dev
TIGRIS_BUCKET=authmatic-demo
```

## Upload demo PDFs

```bash
cd apps/web
npm run upload:tigris
```

Creates bucket if needed, uploads Sarah's PDFs, updates `demo_cases` in InsForge with Tigris URLs.

## Code

- `apps/web/src/lib/tigris/client.ts` — `uploadToTigris()` for agent/web
- Teammate uses same env vars in `apps/agent` on PERSIST step

## Pitch line

> Stored in **Tigris**, workflow tracked in **InsForge**.
