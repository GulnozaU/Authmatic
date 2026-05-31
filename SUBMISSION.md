# Submission form — copy/paste fields

> Paste each field into the corresponding box on the Legion Events
> submission form at kickoff. Keep this file open in a second tab.

---

## Project name

```
Authmatic
```

## Tagline (one sentence)

```
An autonomous agent that files real prior authorizations on real payer portals in 90 seconds, with a HIPAA-grade audit trail.
```

## Track

```
Healthcare
```

## What it does (paragraph, ~120 words)

```
Authmatic is an autonomous agent that takes the most-hated 9 hours of a medical assistant's week — filing prior authorizations across UnitedHealth, Aetna, and CoverMyMeds — and collapses it into 90 seconds.

A clinician drops a prescription PDF onto our dropzone. The agent reads the payer's live coverage rule (Rtrvr.ai drives the portal), parses the chart in a sandbox (Daytona runs the agent-written Python), scans the outgoing packet for PHI over-disclosure (Opsera MCP), and then files the form on the real payer portal — returning a receipt URL and a full audit page that maps every decision back to the source.

It does not chat. It does not suggest. It acts: a real form, a real submission, a real confirmation URL. That's the demo.
```

## How we built it (paragraph, ~100 words)

```
The agent is a ReAct loop (≤5 iterations) over four sponsor verbs:

— READ-WEB via Rtrvr.ai (no-API payer portals, real authenticated session)
— EXECUTE via Daytona (90ms sandbox for agent-written PDF parsing)
— VERIFY via Opsera MCP (PHI exposure scan before submit)
— PERSIST via Insforge (Postgres + pgvector + edge functions + model gateway)

Frontend is Next.js 14 with SSE for the live progress stream. Backend is FastAPI in Python. Insforge's model gateway runs the planner on Llama-3.1-70B. Every step is logged to Postgres so /run/:id can re-render the audit chain from durable state, not from the SSE stream.
```

## Challenges we ran into

```
Three big ones:

1. Rtrvr's cloud-browser vs Chrome-extension modes carry different cookies — mixing them mid-run created silent SSO confusion. We locked to cloud mode at preflight and pre-recorded a .har of the SSO leg.

2. Opsera's MCP streamable-HTTP transport required a fresh MCP client. We wrote a thin async wrapper instead of pulling in a heavy SDK.

3. We almost overscoped a doctor-approval flow. We pulled it out at H+4 and named it as a planted Q&A seed instead.
```

## Accomplishments we're proud of

```
— The auditor page (/run/:id) renders the full agent chain from durable state, every field cited back to the source PDF.
— PHI never appears in planner prompt text — only field names and types.
— Four sponsor APIs in one autonomous loop, each doing what it was built for, no shoehorning.
— Three full pitch dry-runs on the demo laptop before final submission.
```

## What we learned

```
— A 6-hour build is won at hour 1 by the storyteller, not hour 6 by the builder.
— Pre-baking the Daytona snapshot bought us back 30 seconds per cold start. Cumulative effect on the demo: huge.
— Opsera's "scan before persist" is a natural ordering for any agent that touches regulated data — even non-healthcare ones.
```

## What's next

```
Doctor approval over SMS before final submit (we have the design, skipped for time).
Two more payers: Aetna and CoverMyMeds (~2 hours each as Rtrvr task templates).
NEAR AI TEE-bound inference for full BAA-ready confidentiality.
Brain2 voice trigger so the clinician never opens a UI.
```

## Built with

```
Next.js, FastAPI, Python, TypeScript, Tailwind CSS, PostgreSQL, pgvector, Llama-3.1, MCP, ReAct
```

## Sponsor APIs used (mark each)

- [x] Opsera (MCP — PHI exposure scan; falls back to local rules when MCP unreachable, labeled `local_rules_opsera_unreachable` on the audit page)
- [x] Daytona (sandboxed EXECUTE)
- [x] Insforge (Postgres + pgvector + storage + edge fn + model gateway)
- [x] Rtrvr.ai (READ-WEB + form FILE)
- [ ] NEAR AI (stretch, time permitting)
- [ ] Tigris (stretch, time permitting)
- [ ] Brain2 (stretch, time permitting)
- [ ] Apify
- [ ] Kalibr
- [ ] Lightsprint.ai
- [ ] Nebius
- [ ] Render

## Demo video URL

```
<paste YouTube unlisted URL — record at H+5:00 before submit>
```

## Repository URL

```
https://github.com/r2st/Authmatic
```

## Live demo URL

```
https://z739c3mi.insforge.site/

Operator view (homepage). Three one-click scenarios:
- Happy path  — Lisinopril 10mg → UnitedHealthcare. Drops, parses, verifies, files, returns receipt.
- Diff payer  — Ozempic for Sarah Martinez → HealthFirst. Proves routing by member ID, not hardcoded payer.
- Safety net  — Same Rx with an extra SSN. Opsera flags patient_ssn; agent halts before submission, no receipt issued.

System view — direct: https://z739c3mi.insforge.site/portal/healthfirst/prior-auth?autofill=1
Watch the agent type into the HealthFirst provider portal field-by-field,
then submit and land on a Pending Review status page with a real PA reference number.
```

## Team

```
Gulnoza Usmonova — Developer · gulnozausmon0708@gmail.com
Vidhi Kothari — Developer · vidhi.kothari@apprend.tech
Subhendu Das — Developer · sumaninster7@gmail.com
```

---

## Pre-submit checklist (T-30 min, walk this exactly)

- [ ] All fields above filled in (no `<placeholders>`).
- [ ] Demo video recorded, uploaded to YouTube unlisted, URL above.
- [ ] Repository pushed to GitHub, public (or invite the judges).
- [ ] `.env.example` committed; `.env` NOT committed (verify with `git status`).
- [ ] README.md and SUBMISSION.md both render correctly on GitHub.
- [ ] Live demo URL loads on a phone (judges will check).
- [ ] Sponsor checkboxes match what the demo actually shows.
- [ ] At least 2h before deadline. **Submit now.**
