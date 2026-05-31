# Agent service (FastAPI) — teammate instructions

**Owner:** Teammate (backend + sponsor integrations)

---

## Start here

1. **[handoff/README.md](../../handoff/README.md)** — index of all handoff docs  
2. **[handoff/team-split-report.md](../../handoff/team-split-report.md)** — what's done vs your tasks  
3. **[handoff/healthfirst-portal-handoff.md](../../handoff/healthfirst-portal-handoff.md)** — portal URLs + API  
4. **[insurance/healthfirst/portal-spec.json](../../insurance/healthfirst/portal-spec.json)** — Rtrvr selectors  
5. **[demo/sarah-martinez.json](../../demo/sarah-martinez.json)** — expected form fields  

**Live portal:** https://fj245m46.insforge.site/portal/healthfirst/prior-auth

---

## Your job (short)

Build `apps/agent/` FastAPI and **replace 3 simulated steps**:

| Step | Sponsor | Input |
|------|---------|-------|
| EXTRACT | Daytona | `demo/pdfs/*.pdf` |
| VERIFY | Opsera | extracted fields |
| SUBMIT | Rtrvr | `insurance/healthfirst` portal (UI in `apps/web`) |
| ADJUDICATE | — | call `POST {WEB_URL}/api/pa/{ref}/adjudicate` |
| PERSIST | InsForge + Tigris | `agent_events`, file uploads |

**Do NOT rebuild:** portal UI, `/api/pa/*`, or `/run/[id]` audit page.

**Match SSE format:** `apps/web/src/lib/agent-orchestrator.ts`

---

## Env vars

```bash
WEB_URL=https://fj245m46.insforge.site
PORTAL_URL=https://fj245m46.insforge.site/portal/healthfirst/prior-auth
AGENT_URL=http://localhost:8000
# + RTRVR, DAYTONA, OPSERA, INSFORGE, TIGRIS from .env.example
```

---

## Done when

- [ ] Rtrvr fills live portal → real `reference_id`
- [ ] SSE events match `agent-runs.ts` shape
- [ ] InsForge `agent_events` + Tigris uploads
- [ ] `/run/[id]` UI still works

Full checklist: [handoff/team-split-report.md](../../handoff/team-split-report.md)
