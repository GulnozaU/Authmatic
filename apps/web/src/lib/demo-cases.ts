import type { PaFormPayload } from "./pa-types";

export type DemoCaseId = "sarah-martinez" | "james-wilson" | "maria-overshare";

export type DemoCase = {
  id: DemoCaseId;
  title: string;
  blurb: string;
  accent: "green" | "blue" | "amber";
  payer: string;
  payload: PaFormPayload;
  /** Expected pipeline outcome for batch UI */
  expect: "approve" | "halt_verify";
};

export const DEMO_CASES: Record<DemoCaseId, DemoCase> = {
  "sarah-martinez": {
    id: "sarah-martinez",
    title: "Happy path",
    blurb: "Ozempic for Sarah Martinez → HealthFirst. Extract, verify, submit, approve.",
    accent: "green",
    payer: "HealthFirst PPO",
    expect: "approve",
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
    title: "Different patient",
    blurb: "Lisinopril 10mg for James Wilson → routes by member ID, not hardcoded payer.",
    accent: "blue",
    payer: "HealthFirst PPO",
    expect: "approve",
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
  "maria-overshare": {
    id: "maria-overshare",
    title: "Safety net",
    blurb: "Chart includes SSN in notes. Opsera flags PHI — agent halts before submit.",
    accent: "amber",
    payer: "HealthFirst PPO",
    expect: "halt_verify",
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

export const BATCH_DEMO_IDS: DemoCaseId[] = ["sarah-martinez", "james-wilson"];

export function getDemoCase(id?: string | null): DemoCase {
  if (id && id in DEMO_CASES) return DEMO_CASES[id as DemoCaseId];
  return DEMO_CASES["sarah-martinez"];
}

export function getDemoFormPayload(caseId?: string | null): PaFormPayload {
  return getDemoCase(caseId).payload;
}

export function submissionPath(referenceId: string): string {
  return `/portal/healthfirst/submission/${referenceId}`;
}
