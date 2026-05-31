# Web app (UI + mock HealthFirst payer portal)

## Mock portal (built)

| URL | Purpose |
|-----|---------|
| `/portal/healthfirst/prior-auth` | **PA form** — Rtrvr fills & submits here |
| `/portal/healthfirst/submission/[ref]` | Status page — starts as **Pending Review** (not approved) |
| `/portal/healthfirst/success?ref=` | Redirects to submission status |

## Realistic PA workflow

Submit does **not** auto-approve. Flow:

```
1. Rtrvr submits form
   → status: pending_review
   → redirect to /portal/healthfirst/submission/PA-2026-00451

2. Agent calls POST /api/pa/PA-2026-00451/adjudicate
   → status: under_review (medical review ~8s)
   → then: approved OR denied (based on payer rules)

3. Status page polls GET /api/pa/{ref} every 2.5s — judge sees review progress
```

Sarah Martinez + Ozempic + proper justification → **approved** after adjudication.
Missing fields or bad member ID → **denied**.

## Run locally

```bash
cd apps/web
npm install
npm run dev
```

Open http://localhost:3000/portal/healthfirst/prior-auth

## Rtrvr task

After submit, Rtrvr lands on submission page. Return `reference_id` from URL.
Agent must call adjudicate separately — that simulates payer review.

## Form field IDs (must match)

`patient_name`, `dob`, `member_id`, `diagnosis`, `medication`, `dosage`, `provider_name`, `justification`

Submit button: `#submit-prior-auth`

---

## Related folders

| Folder | Purpose |
|--------|---------|
| [../../handoff/](../../handoff/) | Teammate docs |
| [../../demo/](../../demo/) | Sarah PDFs + fixture JSON |
| [../../insurance/](../../insurance/) | HealthFirst portal spec |
| [../../docs/insforge.md](../../docs/insforge.md) | InsForge setup |

**Live:** https://fj245m46.insforge.site
