export type PaStatus =
  | "pending_review"
  | "under_review"
  | "approved"
  | "denied"
  | "needs_info";

export interface PaFormPayload {
  patient_name: string;
  dob: string;
  member_id: string;
  diagnosis: string;
  medication: string;
  dosage: string;
  provider_name: string;
  justification: string;
}

export interface PaSubmission extends PaFormPayload {
  reference_id: string;
  status: PaStatus;
  submitted_at: string;
  under_review_at?: string;
  decided_at?: string;
  decision_notes?: string;
  denial_reason?: string;
  reviewer_id?: string;
}

export interface AdjudicationResult {
  reference_id: string;
  status: PaStatus;
  decision_notes: string;
  denial_reason?: string;
  reviewer_id: string;
}

export const FORM_FIELDS = [
  "patient_name",
  "dob",
  "member_id",
  "diagnosis",
  "medication",
  "dosage",
  "provider_name",
  "justification",
] as const satisfies readonly (keyof PaFormPayload)[];

export const STATUS_LABELS: Record<PaStatus, string> = {
  pending_review: "Pending Review",
  under_review: "Under Review",
  approved: "Approved",
  denied: "Denied",
  needs_info: "Additional Information Required",
};
