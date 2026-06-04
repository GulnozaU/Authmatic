import type { PaFormPayload } from "./pa-types";

export type DemoCaseId =
  | "sarah-martinez"
  | "james-wilson"
  | "robert-kim"
  | "lisa-patel"
  | "maria-overshare";

export type DemoCase = {
  id: DemoCaseId;
  title: string;
  blurb: string;
  accent: "green" | "blue" | "purple" | "teal" | "amber";
  payer: string;
  payload: PaFormPayload;
  pdfs: { chart: string; prescription: string };
  expect: "approve" | "halt_verify";
};

export const DEMO_CASES: Record<DemoCaseId, DemoCase> = {
  "sarah-martinez": {
    id: "sarah-martinez",
    title: "Sarah Martinez",
    blurb: "Ozempic · Type 2 Diabetes · HealthFirst",
    accent: "green",
    payer: "HealthFirst PPO",
    expect: "approve",
    pdfs: {
      chart: "patient_chart_sarah_martinez.pdf",
      prescription: "prescription_ozempic_martinez.pdf",
    },
    payload: {
      patient_name: "Sarah Martinez",
      dob: "03/14/1986",
      member_id: "HF45821973",
      diagnosis: "Type 2 Diabetes (E11.9)",
      medication: "Ozempic",
      dosage: "0.25mg weekly",
      provider_name: "Emily Chen, MD",
      justification:
        "Poor glycemic control despite first-line therapy. HbA1c 8.9% on Metformin x18mo.",
    },
  },
  "james-wilson": {
    id: "james-wilson",
    title: "James Wilson",
    blurb: "Lisinopril · Hypertension · HealthFirst",
    accent: "blue",
    payer: "HealthFirst PPO",
    expect: "approve",
    pdfs: {
      chart: "patient_chart_james_wilson.pdf",
      prescription: "prescription_lisinopril_wilson.pdf",
    },
    payload: {
      patient_name: "James Wilson",
      dob: "07/22/1971",
      member_id: "HF88210456",
      diagnosis: "Essential Hypertension (I10)",
      medication: "Lisinopril",
      dosage: "10mg daily",
      provider_name: "Emily Chen, MD",
      justification:
        "BP 158/96 on amlodipine 5mg x6mo. ACE inhibitor indicated per JNC guidelines.",
    },
  },
  "robert-kim": {
    id: "robert-kim",
    title: "Robert Kim",
    blurb: "Humira · Rheumatoid Arthritis · HealthFirst",
    accent: "purple",
    payer: "HealthFirst PPO",
    expect: "approve",
    pdfs: {
      chart: "patient_chart_robert_kim.pdf",
      prescription: "prescription_humira_kim.pdf",
    },
    payload: {
      patient_name: "Robert Kim",
      dob: "04/05/1968",
      member_id: "HF77190234",
      diagnosis: "Rheumatoid Arthritis (M06.9)",
      medication: "Humira",
      dosage: "40mg every 2 weeks",
      provider_name: "Emily Chen, MD",
      justification:
        "Active RA with persistent joint swelling despite methotrexate 15mg weekly x12mo.",
    },
  },
  "lisa-patel": {
    id: "lisa-patel",
    title: "Lisa Patel",
    blurb: "Mounjaro · Type 2 Diabetes · HealthFirst",
    accent: "teal",
    payer: "HealthFirst PPO",
    expect: "approve",
    pdfs: {
      chart: "patient_chart_lisa_patel.pdf",
      prescription: "prescription_mounjaro_patel.pdf",
    },
    payload: {
      patient_name: "Lisa Patel",
      dob: "09/18/1979",
      member_id: "HF66501892",
      diagnosis: "Type 2 Diabetes (E11.9)",
      medication: "Mounjaro",
      dosage: "2.5mg weekly",
      provider_name: "Emily Chen, MD",
      justification:
        "HbA1c 9.1% despite metformin + glipizide x14mo. GLP-1/GIP agonist indicated.",
    },
  },
  "maria-overshare": {
    id: "maria-overshare",
    title: "Maria Santos (safety)",
    blurb: "Opsera blocks — SSN in chart notes",
    accent: "amber",
    payer: "HealthFirst PPO",
    expect: "halt_verify",
    pdfs: {
      chart: "patient_chart_maria_santos.pdf",
      prescription: "prescription_ozempic_santos.pdf",
    },
    payload: {
      patient_name: "Maria Santos",
      dob: "11/02/1990",
      member_id: "HF33901287",
      diagnosis: "Type 2 Diabetes (E11.9)",
      medication: "Ozempic",
      dosage: "0.25mg weekly",
      provider_name: "Emily Chen, MD",
      justification:
        "Poor glycemic control. Chart note includes patient SSN 555-12-3456 — must redact before payer submit.",
    },
  },
};

/** Default live-demo batch — all approve, run in parallel */
export const LIVE_BATCH_IDS: DemoCaseId[] = [
  "sarah-martinez",
  "james-wilson",
  "robert-kim",
  "lisa-patel",
];

export const BATCH_DEMO_IDS = LIVE_BATCH_IDS;

export const ALL_CASE_IDS = Object.keys(DEMO_CASES) as DemoCaseId[];

export function getDemoCase(id?: string | null): DemoCase {
  if (id && id in DEMO_CASES) return DEMO_CASES[id as DemoCaseId];
  return DEMO_CASES["sarah-martinez"];
}

export function getDemoFormPayload(caseId?: string | null): PaFormPayload {
  return getDemoCase(caseId).payload;
}

export function getDemoPdfs(caseId?: string | null): { chart: string; prescription: string } {
  return getDemoCase(caseId).pdfs;
}

export function submissionPath(referenceId: string): string {
  return `/portal/healthfirst/submission/${referenceId}`;
}
