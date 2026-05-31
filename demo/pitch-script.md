# Authmatic — 3-minute pitch script

> Read aloud with a timer. If you're over by 10s, cut a sentence.
> Full Q&A prep, fallback plan, and sponsor-mention checklist:
> see [`../../docs/ideas/authmatic/demo.md`](../../docs/ideas/authmatic/demo.md).

---

## 0:00 – 0:30 — Problem

> Meet Maria. She's the lead medical assistant at Dr. Chen's primary
> care group in Oakland. Every single week, Maria spends nine hours
> filing prior authorizations — typing the same patient data into UHC,
> then Aetna, then CoverMyMeds, because none of them have an API. When
> she misses one, her patient doesn't get their prescription. When she
> rushes, she over-shares PHI and triggers a compliance review.
>
> This is the most-hated 9 hours in American primary care. And it
> happens forty million times a week, across every clinic in this
> country.

## 0:30 – 0:45 — Solution one-liner

> We built **Authmatic**: an agent that watches the prescription queue,
> drives the payer portals end-to-end, and returns a HIPAA-grade audit
> receipt — in ninety seconds, with a cryptographic compliance stamp.

## 0:45 – 2:30 — Live demo

| Time | Screen | What you say |
|------|--------|--------------|
| 0:45 | App dropzone, clean single-screen UI | "This is what Maria sees. One screen, one box." |
| 0:55 | Drag `rx-lisinopril.pdf` onto dropzone | "She drops the prescription. That's it. That's her whole job from here." |
| 1:00 | Card 1 — **READ-WEB / Rtrvr.ai** | "First, Rtrvr.ai opens the UHC portal in a real browser and pulls the live coverage rule for Lisinopril under Dr. Chen's plan. That rule changes weekly." |
| 1:20 | Card 2 — **EXECUTE / Daytona** | "Second, Daytona spins up a sandbox in ninety milliseconds and runs Python to extract the diagnosis, dose, and ICD-10 code — code the agent wrote on the fly." |
| 1:40 | Card 3 — **VERIFY / Opsera** | "Third, Opsera's MCP server scans the outgoing packet for PHI we don't need to send. Green check. No over-disclosure." |
| 2:00 | Card 4 — **PERSIST / Insforge** + Rtrvr submitting | "Fourth, Insforge stores the case and fires the doctor a Slack ping. And — here — Rtrvr submits the form on UHC's portal." |
| 2:15 | `/run/abc123` auditor page, receipt URL pinned at top, four sponsor logos in footer | "And here's the proof. Receipt URL. Full audit chain. Four sponsors. Ninety seconds. From PDF to filed." |

## 2:30 – 3:00 — Close

> We used **Opsera, Daytona, Insforge, and Rtrvr.ai** — all live, all
> in one autonomous loop. The next thing we'd add is the doctor-approval
> step before submit — we have a hypothesis on it and skipped it for
> time. Happy to walk through it.

**Planted seed:** the doctor-approval beat. Judge asks → rehearsed
answer (see [demo.md](../../docs/ideas/authmatic/demo.md)
Q&A table).

---

## Pre-pitch checklist (T-15 min)

- [ ] Demo laptop on conference WiFi (not personal hotspot).
- [ ] `make smoke` — green on all four sponsors.
- [ ] `bash scripts/reset.sh` — clean DB so the demo starts fresh.
- [ ] Fallback recording open in QuickTime, paused.
- [ ] Notifications off, focus mode on, screen-share permissions granted.
- [ ] Backup phone on hotspot, ready to tether if WiFi dies.
