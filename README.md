# Authmatic (Prior-Auth Killer)

> An agent that reads patient records, fills the insurer prior-auth form in a
> real browser, submits it, and returns a receipt — collapsing a 30-minute
> paperwork ritual into ~90 seconds.

**Track:** Healthcare · **Theme:** Agents That Act
**Demo patient:** Sarah Martinez · Ozempic · HealthFirst PPO
**Stack:** Opsera · Daytona · InsForge · Rtrvr · Render  
**InsForge:** linked — `https://fj245m46.us-east.insforge.app` (see `AGENTS.md`)  
**Repo:** [github.com/GulnozaU/Authmatic](https://github.com/GulnozaU/Authmatic) (`main`) · legacy branch `authmatic0`

---

## Team split

| Who | Owns | Paths |
|-----|------|-------|
| **You** | Mock insurer portal, UI (dropzone + audit), shared backend | `apps/web/`, `mock/`, portal routes |
| **Teammate** | Agent loop, sponsor wiring, API | `apps/agent/` |

Both touch backend — coordinate on `/api/run`, `/api/stream/:id`, and the Rtrvr → mock portal URL.

---

## TL;DR

| Question | Answer |
|----------|--------|
| **Problem** | Clinics manually re-type chart data into insurer portals for prior auth. |
| **Solution** | Agent extracts PDFs → Rtrvr fills **our mock HealthFirst form** → receipt stored. |
| **Money shot** | Judge watches fields fill on `/portal/healthfirst/prior-auth`, then sees receipt on `/run/:id`. |
| **Live URL** | Deploy `apps/web` + `apps/agent` to **Render** — say the URL in the pitch. |
| **One workflow** | Sarah Martinez only. No second patient until happy path works. |

---

## Repo map

```
authmatic/
├── apps/
│   ├── web/          ← UI + mock HealthFirst portal (you)
│   └── agent/        ← FastAPI agent + Rtrvr (teammate, you help)
├── assets/demo/      ← Sarah chart + Ozempic prescription PDFs
├── mock/
│   ├── healthfirst-case.json      ← demo patient + workflow fields
│   └── healthfirst-portal.json    ← URLs, selectors, API (teammate)
├── spec.md           ← what we ship (teammate)
├── architecture.md   ← system design (teammate)
├── implementation.md ← build plan (teammate)
├── demo.md           ← 3-min pitch script (teammate)
└── risks.md          ← demo-day gotchas (teammate)
```

---

## Demo flow (5 screens)

1. **Upload** — chart PDF + prescription PDF → "Patient Record Uploaded / Prescription Uploaded"
2. **Extract** — agent panel: diagnosis, medication, provider, insurance
3. **Fill** — Rtrvr opens mock portal; fields populate live
4. **Submit** — success page: `Authorization Submitted` · `PA-2026-00451`
5. **Receipt** — audit page: stored in Tigris, tracked in InsForge, live on Render

---

## Sponsor roles

| Sponsor | Does what in demo |
|---------|-------------------|
| **Rtrvr** | Browser automation — fills + submits mock portal |
| **Tigris** | PDF + receipt file storage |
| **InsForge** | Postgres workflow — submissions, runs, agent_events |
| **Render** | Public deploy — live demo URL |

---

## Mock vs real

| Mock | Real |
|------|------|
| HealthFirst insurer company + portal UI | Rtrvr driving a real browser |
| Sarah Martinez (synthetic PHI) | InsForge Postgres + Storage |
| | Render deployment |

**Do not** hit real UHC/Aetna portals on stage.

---

## Quick start

```bash
cp .env.example .env   # fill sponsor keys
# apps/web — Next.js UI + portal
# apps/agent — FastAPI agent
```

Demo PDFs: `assets/demo/patient_chart_sarah_martinez.pdf`, `assets/demo/prescription_ozempic_martinez.pdf`

Field reference: `mock/healthfirst-case.json`  
**Portal handoff (teammate):** [docs/healthfirst-portal-handoff.md](docs/healthfirst-portal-handoff.md) · selectors: [mock/healthfirst-portal.json](mock/healthfirst-portal.json)  
InsForge setup: [docs/insforge.md](docs/insforge.md) · Tigris: [docs/tigris.md](docs/tigris.md)

**Team handoff PDF:** [docs/authmatic-team-handoff.pdf](docs/authmatic-team-handoff.pdf) — what we have, what backend needs, sponsor env vars.

---

## Docs (from teammate)

| File | Purpose |
|------|---------|
| [spec.md](spec.md) | Features, user stories, acceptance criteria |
| [architecture.md](architecture.md) | System diagram, data model, sequence |
| [implementation.md](implementation.md) | Hour-by-hour build + sponsor wiring |
| [demo.md](demo.md) | Pitch script + fallback plan |
| [risks.md](risks.md) | What can kill the demo |
