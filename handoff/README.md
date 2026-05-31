# Teammate handoff — start here

Everything your backend teammate needs to build `apps/agent/` on top of the mock portal.

**Live demo:** https://fj245m46.insforge.site

---

## Read in this order

| # | File | What it is |
|---|------|------------|
| 1 | [team-split-report.md](./team-split-report.md) | **Main report** — what's done vs what you build |
| 2 | [healthfirst-portal-handoff.md](./healthfirst-portal-handoff.md) | Portal URLs, form IDs, API contract, Rtrvr prompt |
| 3 | [../insurance/healthfirst/portal-spec.json](../insurance/healthfirst/portal-spec.json) | Machine-readable selectors + API (for code) |
| 4 | [../demo/sarah-martinez.json](../demo/sarah-martinez.json) | Demo patient + expected form fields |
| 5 | [../apps/agent/README.md](../apps/agent/README.md) | FastAPI checklist |

---

## Planning docs (from original spec)

| File | Purpose |
|------|---------|
| [spec.md](./spec.md) | Features + acceptance criteria |
| [architecture.md](./architecture.md) | System design |
| [implementation.md](./implementation.md) | Build plan + sponsor wiring |
| [demo.md](./demo.md) | 3-min pitch script |
| [risks.md](./risks.md) | Demo-day gotchas |
| [authmatic-team-handoff.pdf](./authmatic-team-handoff.pdf) | PDF summary |

---

## Sponsor / infra setup

| File | Purpose |
|------|---------|
| [../docs/insforge.md](../docs/insforge.md) | Database + InsForge project |
| [../docs/tigris.md](../docs/tigris.md) | PDF file storage |
| [../db/001_authmatic_schema.sql](../db/001_authmatic_schema.sql) | SQL schema |

---

## Your job (short)

1. Build FastAPI in `apps/agent/`
2. **EXTRACT** — Daytona PDF parse → 8 fields from `demo/pdfs/`
3. **VERIFY** — Opsera compliance
4. **SUBMIT** — Rtrvr fills `insurance/healthfirst` portal (UI in `apps/web`)
5. **ADJUDICATE** — call `POST /api/pa/{ref}/adjudicate` (already built)
6. **PERSIST** — InsForge `agent_events` + Tigris uploads

Do **not** rebuild the portal, form, or `/api/pa/*` endpoints.
