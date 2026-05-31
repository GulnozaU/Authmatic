import type { PaFormPayload } from "./pa-types";

/** Sarah Martinez demo — single source for agent form fill */
export function getDemoFormPayload(): PaFormPayload {
  return {
    patient_name: "Sarah Martinez",
    dob: "03/14/1986",
    member_id: "HF45821973",
    diagnosis: "Type 2 Diabetes (E11.9)",
    medication: "Ozempic",
    dosage: "0.25mg weekly",
    provider_name: "Emily Chen, MD",
    justification:
      "Poor glycemic control despite first-line therapy. HbA1c 8.9% on Metformin x18mo.",
  };
}

export const DEMO_FILES = {
  chart: "/demo/patient_chart_sarah_martinez.pdf",
  prescription: "/demo/prescription_ozempic_martinez.pdf",
};
