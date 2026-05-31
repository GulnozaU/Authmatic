#!/usr/bin/env node
/** Generate demo patient chart + prescription PDFs for all demo cases. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "demo", "pdfs");

function esc(text) {
  return String(text).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function makePdf(paragraphs) {
  const lines = paragraphs.flatMap((p) => p.split("\n"));
  const fontSize = 10;
  const lineHeight = 13;
  let y = 760;
  const ops = ["BT", "/F1 10 Tf"];
  for (const line of lines) {
    if (y < 40) break;
    ops.push(`1 0 0 1 50 ${y} Tm (${esc(line.slice(0, 100))}) Tj`);
    y -= lineHeight;
  }
  ops.push("ET");
  const stream = ops.join("\n");
  const len = Buffer.byteLength(stream, "utf8");

  const objects = [
    "1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj",
    "2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj",
    "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj",
    `4 0 obj<< /Length ${len} >>stream\n${stream}\nendstream endobj`,
    "5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj",
  ];

  let body = "";
  const offsets = [0];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(body, "utf8") + (i === 0 ? 0 : offsets[offsets.length - 1] + objects[i - 1].length + 2));
    body += `${i + 1} 0 obj`.replace(/^\d+ 0 obj/, objects[i].split(" ")[0] + " 0 obj");
    // simpler: build properly
  }

  // Rebuild PDF cleanly
  const parts = [];
  const add = (s) => parts.push(s);
  add("1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n");
  add("2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n");
  add("3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj\n");
  add(`4 0 obj<< /Length ${len} >>stream\n${stream}\nendstream endobj\n`);
  add("5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n");

  const bodyStr = parts.join("");
  const xrefOffsets = [0];
  let pos = 0;
  for (const part of parts) {
    xrefOffsets.push(pos);
    pos += Buffer.byteLength(part, "utf8");
  }

  const xref = [`xref`, `0 ${parts.length + 1}`, `0000000000 65535 f `];
  for (let i = 1; i <= parts.length; i++) {
    xref.push(`${String(xrefOffsets[i]).padStart(10, "0")} 00000 n `);
  }
  const xrefStr = xref.join("\n") + "\n";
  const trailer = `trailer<< /Size ${parts.length + 1} /Root 1 0 R >>\nstartxref\n${pos}\n%%EOF`;
  return Buffer.from(`%PDF-1.4\n${bodyStr}${xrefStr}${trailer}`, "utf8");
}

const CASES = {
  "patient_chart_sarah_martinez.pdf": [
    "BAY AREA PRIMARY CARE — PATIENT CHART (CONFIDENTIAL)",
    "Patient: Sarah Elena Martinez | DOB: 03/14/1986 | Member ID: HF45821973",
    "Insurance: HealthFirst PPO | PCP: Dr. Emily Chen, MD",
    "Diagnosis: Type 2 Diabetes (E11.9) — HbA1c 8.9% on Metformin x18mo",
    "Plan: Initiate Ozempic 0.25mg weekly. Prior authorization required.",
    "FOR DEMO PURPOSES ONLY — SYNTHETIC PHI",
  ],
  "prescription_ozempic_martinez.pdf": [
    "PRESCRIPTION — Bay Area Primary Care",
    "Patient: Sarah Martinez | DOB: 03/14/1986 | Member ID: HF45821973",
    "Medication: Ozempic (semaglutide) 0.25mg weekly",
    "Provider: Emily Chen, MD | NPI: 1234567890",
    "Justification: Poor glycemic control despite first-line therapy. HbA1c 8.9%.",
    "FOR DEMO PURPOSES ONLY",
  ],
  "patient_chart_james_wilson.pdf": [
    "BAY AREA PRIMARY CARE — PATIENT CHART (CONFIDENTIAL)",
    "Patient: James Robert Wilson | DOB: 07/22/1971 | Member ID: HF88210456",
    "Insurance: HealthFirst PPO | PCP: Dr. Emily Chen, MD",
    "Diagnosis: Essential Hypertension (I10) — BP 158/96 on amlodipine 5mg x6mo",
    "Plan: Start Lisinopril 10mg daily. Prior authorization required.",
    "FOR DEMO PURPOSES ONLY — SYNTHETIC PHI",
  ],
  "prescription_lisinopril_wilson.pdf": [
    "PRESCRIPTION — Bay Area Primary Care",
    "Patient: James Wilson | DOB: 07/22/1971 | Member ID: HF88210456",
    "Medication: Lisinopril 10mg daily",
    "Provider: Emily Chen, MD | NPI: 1234567890",
    "Justification: BP 158/96 on amlodipine 5mg x6mo. ACE inhibitor indicated.",
    "FOR DEMO PURPOSES ONLY",
  ],
  "patient_chart_robert_kim.pdf": [
    "BAY AREA PRIMARY CARE — PATIENT CHART (CONFIDENTIAL)",
    "Patient: Robert James Kim | DOB: 04/05/1968 | Member ID: HF77190234",
    "Insurance: HealthFirst PPO | PCP: Dr. Emily Chen, MD",
    "Diagnosis: Rheumatoid Arthritis (M06.9) — failed methotrexate x12mo",
    "Plan: Initiate Humira 40mg every 2 weeks. Prior authorization required.",
    "FOR DEMO PURPOSES ONLY — SYNTHETIC PHI",
  ],
  "prescription_humira_kim.pdf": [
    "PRESCRIPTION — Bay Area Primary Care",
    "Patient: Robert Kim | DOB: 04/05/1968 | Member ID: HF77190234",
    "Medication: Humira (adalimumab) 40mg every 2 weeks",
    "Provider: Emily Chen, MD | NPI: 1234567890",
    "Justification: Active RA with inadequate response to methotrexate 12 months.",
    "FOR DEMO PURPOSES ONLY",
  ],
  "patient_chart_lisa_patel.pdf": [
    "BAY AREA PRIMARY CARE — PATIENT CHART (CONFIDENTIAL)",
    "Patient: Lisa Anika Patel | DOB: 09/18/1979 | Member ID: HF66501892",
    "Insurance: HealthFirst PPO | PCP: Dr. Emily Chen, MD",
    "Diagnosis: Type 2 Diabetes (E11.9) — HbA1c 9.1% despite metformin + glipizide",
    "Plan: Initiate Mounjaro 2.5mg weekly. Prior authorization required.",
    "FOR DEMO PURPOSES ONLY — SYNTHETIC PHI",
  ],
  "prescription_mounjaro_patel.pdf": [
    "PRESCRIPTION — Bay Area Primary Care",
    "Patient: Lisa Patel | DOB: 09/18/1979 | Member ID: HF66501892",
    "Medication: Mounjaro (tirzepatide) 2.5mg weekly",
    "Provider: Emily Chen, MD | NPI: 1234567890",
    "Justification: Uncontrolled T2DM after dual oral therapy. HbA1c 9.1%.",
    "FOR DEMO PURPOSES ONLY",
  ],
  "patient_chart_maria_santos.pdf": [
    "BAY AREA PRIMARY CARE — PATIENT CHART (CONFIDENTIAL)",
    "Patient: Maria Lucia Santos | DOB: 11/02/1990 | Member ID: HF33901287",
    "Insurance: HealthFirst PPO | Note: chart contains SSN 555-12-3456 — REDACT",
    "Diagnosis: Type 2 Diabetes (E11.9)",
    "FOR DEMO PURPOSES ONLY — SYNTHETIC PHI",
  ],
  "prescription_ozempic_santos.pdf": [
    "PRESCRIPTION — Bay Area Primary Care",
    "Patient: Maria Santos | DOB: 11/02/1990 | Member ID: HF33901287",
    "Medication: Ozempic 0.25mg weekly",
    "Justification: Poor glycemic control. Chart note includes SSN 555-12-3456.",
    "FOR DEMO PURPOSES ONLY",
  ],
};

fs.mkdirSync(outDir, { recursive: true });

for (const [filename, paragraphs] of Object.entries(CASES)) {
  const out = path.join(outDir, filename);
  if (
    filename.includes("sarah_martinez") &&
    fs.existsSync(out) &&
    fs.statSync(out).size > 5000
  ) {
    console.log("skip (keep existing)", filename);
    continue;
  }
  fs.writeFileSync(out, makePdf(paragraphs));
  console.log("wrote", filename);
}

console.log(`Done — ${Object.keys(CASES).length} PDFs in demo/pdfs/`);
