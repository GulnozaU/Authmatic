# Authmatic (Prior-Auth Killer)

> An agent that reads patient records, fills the insurer prior-auth form in a
> real browser, submits it, and returns a receipt — collapsing a 30-minute
> paperwork ritual into ~90 seconds.

**Track:** Healthcare · **Theme:** Agents That Act  
**Demo patient:** Sarah Martinez · Ozempic · HealthFirst PPO  
**Stack:** Opsera · Daytona · InsForge · Rtrvr · Render  
**Live app:** https://fj245m46.insforge.site  
**InsForge backend:** https://fj245m46.us-east.insforge.app  
**Repo:** [github.com/GulnozaU/Authmatic](https://github.com/GulnozaU/Authmatic)

---

## Repo map (organized)

```
authmatic/
├── apps/
│   ├── web/              ← Next.js UI + mock HealthFirst portal + APIs
│   └── agent/            ← FastAPI agent (teammate builds)
│
├── handoff/              ← 📋 ALL teammate docs — start at handoff/README.md
│   ├── team-split-report.md
│   ├── healthfirst-portal-handoff.md
│   ├── spec.md, architecture.md, implementation.md, demo.md, risks.md
│   └── authmatic-team-handoff.pdf
│
├── demo/                 ← 🧪 Demo patient + PDFs
│   ├── sarah-martinez.json
│   └── pdfs/
│
├── insurance/            ← 🏥 Fake payer (HealthFirst)
│   └── healthfirst/portal-spec.json
│
├── docs/                 ← Sponsor infra setup only
│   ├── insforge.md
│   └── tigris.md
│
└── db/                   ← InsForge SQL schema
```

---

## Team split

| Who | Owns | Where to look |
|-----|------|---------------|
| **You** | Mock portal, UI, demo data, simulated agent | `apps/web/`, `demo/`, `insurance/` |
| **Teammate** | Real agent, Rtrvr, Daytona, Opsera | `handoff/` → `apps/agent/` |

**Teammate starts here:** [handoff/README.md](handoff/README.md)

---

## Quick start

```bash
cd apps/web && npm install && npm run dev
# Open http://localhost:3000 → Run demo
```

```bash
# Redeploy live site
npx @insforge/cli deployments deploy apps/web -y
```

---

## Key links

| What | Path |
|------|------|
| Teammate handoff | [handoff/README.md](handoff/README.md) |
| Demo patient + PDFs | [demo/README.md](demo/README.md) |
| Fake insurance spec | [insurance/README.md](insurance/README.md) |
| InsForge setup | [docs/insforge.md](docs/insforge.md) |
| Tigris setup | [docs/tigris.md](docs/tigris.md) |

---

## Demo flow

1. Upload PDFs (or click **Run demo**) on `/`
2. Agent steps stream on `/run/[id]`
3. HealthFirst form fills in portal iframe
4. Submission → pending review → adjudication → approved
5. Receipt on submission status page

**Live:** https://fj245m46.insforge.site
