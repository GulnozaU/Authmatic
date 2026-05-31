# Mock insurance — HealthFirst PPO

Fake payer for the demo. **Do not use real insurer portals.**

---

## HealthFirst

| Item | Value |
|------|-------|
| Insurer | HealthFirst |
| Plan | HealthFirst PPO |
| Member ID format | `HF` + 8 digits (e.g. `HF45821973`) |
| Reference ID format | `PA-2026-#####` |

---

## Files

| File | Purpose |
|------|---------|
| [healthfirst/portal-spec.json](./healthfirst/portal-spec.json) | URLs, form selectors, API contract, Rtrvr task prompt |

---

## Portal UI (built — do not rebuild)

The mock portal lives in the **web app**, not in this folder:

| Route | Purpose |
|-------|---------|
| `/portal/healthfirst/prior-auth` | PA form Rtrvr fills |
| `/portal/healthfirst/submission/[ref]` | Status after submit |

Code: `apps/web/src/app/portal/healthfirst/`

**Live:** https://fj245m46.insforge.site/portal/healthfirst/prior-auth

---

## Form selectors (Rtrvr)

`#patient_name`, `#dob`, `#member_id`, `#diagnosis`, `#medication`, `#dosage`, `#provider_name`, `#justification`, `#submit-prior-auth`

Full spec: [healthfirst/portal-spec.json](./healthfirst/portal-spec.json)  
Human-readable: [../handoff/healthfirst-portal-handoff.md](../handoff/healthfirst-portal-handoff.md)

---

## Payer APIs (built in web app)

| Endpoint | Purpose |
|----------|---------|
| `POST /api/pa/submit` | Form submit → pending_review |
| `GET /api/pa/{ref}` | Status |
| `POST /api/pa/{ref}/adjudicate` | Medical review → approved/denied |

Logic: `apps/web/src/lib/adjudication.ts`
