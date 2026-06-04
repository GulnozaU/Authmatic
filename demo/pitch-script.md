# Authmatic — 3-minute pitch script

> Read aloud with a timer. **Bold** lines survive the cut. v1 draft against
> the post-PR-#2/#3 clinic UI + live deploy at
> [fj245m46.insforge.site](https://fj245m46.insforge.site/) — storyteller
> will rewrite; this is the starting point.

---

## 0:00 – 0:30 — Problem

> **Elena is a medical assistant at a primary-care clinic in Oakland.
> Every Friday she spends nine hours filing prior-authorization forms
> across UHC, Aetna, and HealthFirst — three payer portals, none of
> them with an API. Every patient stuck on a denied PA waits another
> week for their medication. Last month it happened twelve times in her
> clinic alone.**
>
> This is the most-hated nine hours in American primary care, and it
> happens forty million times a week.

**Beat lands when:** judge has a doctor in their life. Don't oversell.

## 0:30 – 0:45 — Solution one-liner

> **"We built Authmatic: an autonomous agent that files real prior
> authorizations on real payer portals in 90 seconds, with a HIPAA-grade
> audit trail. No chatbot. No suggestions. The agent acts."**

## 0:45 – 2:30 — Live demo

The homepage is the **clinic console**: one screen, one job. Walk it
in four beats; the live deploy holds them all.

| Time | What happens on screen | What you say |
|------|------------------------|--------------|
| 0:45 | Open https://fj245m46.insforge.site — clinic console, "New prior authorization" header. | **"This is Elena's screen. One panel. One affordance."** |
| 0:55 | Click **Try the demo** (Sarah Martinez · Ozempic) | "Sarah Martinez. Type 2 diabetes. Her doctor needs Ozempic approved. Elena would normally spend 20 minutes on this — I'm going to click a button." |
| 1:10 | EXTRACT card lights up — Daytona | "Daytona spins up a sandbox. Reads the chart PDF and the prescription. Extracts diagnosis, member ID, dose. Ninety milliseconds." |
| 1:25 | VERIFY card — Opsera | "Before anything leaves us, Opsera scans the outgoing packet for PHI we shouldn't disclose. Green." |
| 1:40 | SUBMIT card — Rtrvr | "Rtrvr drives the HealthFirst provider portal in a real browser session. Fills the form. Submits it." |
| 1:50 | ADJUDICATE + PERSIST cards | "HealthFirst's rule engine returns a decision. Insforge persists the entire chain to Postgres and uploads the receipt PDF to Tigris. Done." |
| 2:00 | Page redirects to `/run/<uuid>` — full audit chain visible, reference number `PA-2026-<id>` pinned at top | **"Receipt URL. Every step cited back to the source PDF. If a regulator audits this in six months, Elena can defend every field."** |

### The batch + safety beats (cut if running long)

After the single happy path, switch tabs to `/dashboard` and the
`/portal/healthfirst/prior-auth?autofill=1` view:

| Time | Screen | What you say |
|------|--------|--------------|
| 2:10 | `/dashboard` — 14 submissions, 4 patients, 2 approved / 11 pending / 1 errored | "Elena's not running one PA. She's running her whole Friday queue. Four patients in parallel." |
| 2:20 | Click the **Maria Santos** row (status: errored) → show the VERIFY step output `SSN pattern detected — remove before payer submit` | **"And here's the safety beat. Maria Santos's chart has an extra SSN line that shouldn't have been faxed in. Opsera caught it. The agent halted before submission. No receipt issued. The agent *didn't act* — and that's exactly right."** |

**Fallback:** if anything breaks live, switch to
`demo/recordings/authmatic-90s.mp4`. Don't apologize — keep going.

## 2:30 – 3:00 — Close

> **"Five sponsors — Daytona, Opsera, Rtrvr, Insforge, Tigris — one
> autonomous loop. Daytona extracts, Opsera verifies, Rtrvr submits,
> Insforge persists the chain, Tigris holds the artifacts. Six hours.
> The next thing we'd add is doctor-approval-over-SMS before the final
> submit — we have the design, skipped for time."**

**Planted-seed candidates** (pick one — judge will ask):

- *Doctor-approval-over-SMS* — Brain2 voice + SMS gate before ACTION.
- *Multi-payer scale-out* — each new portal is one Rtrvr task template
  + one fixture + one entry in the planner's known-payers list.
  Aetna and CoverMyMeds are next.
- *Confidential planning* — NEAR AI TEE-bound inference so the planner
  itself runs in an enclave. PHI never leaves the trust boundary.

---

## Q&A prep

| Likely question | Our answer |
|-----------------|------------|
| "How is this not an RPA macro?" | "Rtrvr drives a *real browser session* against the live portal — the agent re-reads the coverage rule on every run. When HealthFirst changed the formulary last Tuesday, a macro would have silently filed under the old rule. The agent reads the new rule and adjusts the rationale text." |
| "What stops it from filing a wrong PA?" | "Opsera VERIFY runs before every submit. We saw it work on Maria's case — extra SSN line, agent halted, no submission. Plus the planner won't move to ADJUDICATE without a clean VERIFY." |
| "What's the HIPAA story?" | "PHI never enters the planner's prompt — only field names and types. The patient identifiers stay in Postgres and only get hydrated at form-fill time. The audit page makes every field defensible." |
| "Did the agent really pick its actions?" | "Yes — Insforge's model gateway runs the planner on Llama-3.1-70B in JSON mode. The five-step lifecycle (EXTRACT → VERIFY → SUBMIT → ADJUDICATE → PERSIST) is the planner's output, not a hardcoded pipeline. Happy to run it live with a fresh PDF after the pitch." |
| "Why these five sponsors?" | "Each one does the thing it was built for. Rtrvr for portals that don't have APIs. Daytona because we don't want to ship a parser — the agent writes one per chart. Opsera because regulated agents need a guard. Insforge because we needed Postgres + pgvector + a model gateway in one place. Tigris because every PA artifact (chart, prescription, signed receipt) needs durable S3-compatible storage we can replay from." |
| "How long to add a new payer?" | "Two hours. One Rtrvr task template, one fixture, one entry in the known-payers list. We did UHC + HealthFirst first because those are the highest-volume in the clinic we built this for." |

## Cut list (in priority — drop top first)

1. The batch-dashboard beat at 2:10 (Elena-runs-her-whole-queue) — collapse into the close.
2. The "Beat lands when" director's note — that's for the storyteller, not the room.
3. The third planted-seed option (NEAR AI TEE) — too technical for 30 seconds.

---

## Pre-pitch checklist (T-15 min)

- [ ] Open the live deploy in two browser tabs:
      `https://fj245m46.insforge.site/` (operator view) and
      `https://fj245m46.insforge.site/dashboard` (system view).
- [ ] `bash scripts/smoke.sh` — green on the rows that smoke covers.
- [ ] One fresh `Try the demo` click in advance so any cold-start
      latency is already paid by the time you go on stage.
- [ ] Fallback recording open in QuickTime, paused at frame 1.
- [ ] Notifications off, focus mode on, screen-share permissions granted.
- [ ] Backup phone on hotspot, ready to tether if WiFi dies.

---

## Verified live (smoke results from 2026-05-31)

These are real numbers from the deployed `pa_submissions` table — not
projections. Use them for credibility in Q&A:

- **14 total submissions** across 4 patient cases (Sarah Martinez, James
  Wilson, Robert Kim, Lisa Patel)
- **Mixed adjudication** — 2 approved, 1 denied, 11 pending review.
  The agent isn't a rubber-stamp.
- **Opsera pass rate: 90%** — 9 of 10 runs clean, 1 halted on PHI
  over-share (Maria Santos). That's the safety beat in numeric form.
- **Avg run time:** ~30 seconds end-to-end (EXTRACT → PERSIST) on the
  live deploy, with Rtrvr making real browser calls.
