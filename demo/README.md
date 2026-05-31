# Demo — Sarah Martinez / Ozempic

Synthetic patient data and PDFs for the hackathon demo. **Not real PHI.**

---

## Files

| File | Purpose |
|------|---------|
| [sarah-martinez.json](./sarah-martinez.json) | Patient, clinic, prescriber, medication, insurer refs |
| [pdfs/patient_chart_sarah_martinez.pdf](./pdfs/patient_chart_sarah_martinez.pdf) | Patient chart (Daytona extract input) |
| [pdfs/prescription_ozempic_martinez.pdf](./pdfs/prescription_ozempic_martinez.pdf) | Ozempic prescription PDF |

---

## Web URLs (when app is running)

- Chart: `/demo/patient_chart_sarah_martinez.pdf`
- Prescription: `/demo/prescription_ozempic_martinez.pdf`

(`apps/web/public/demo/` — auto-synced from here via `npm run sync:demo`)

---

## Expected extracted fields (for agent)

```json
{
  "patient_name": "Sarah Martinez",
  "dob": "03/14/1986",
  "member_id": "HF45821973",
  "diagnosis": "Type 2 Diabetes (E11.9)",
  "medication": "Ozempic",
  "dosage": "0.25mg weekly",
  "provider_name": "Emily Chen, MD",
  "justification": "Poor glycemic control despite first-line therapy. HbA1c 8.9% on Metformin x18mo."
}
```

Also in `apps/web/src/lib/demo-case.ts` → `getDemoFormPayload()`.

---

## Upload to Tigris

```bash
cd apps/web && npm run upload:tigris
```

Reads PDFs from `demo/pdfs/` and updates InsForge `demo_cases`.
