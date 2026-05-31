import type { PaFormPayload, PaSubmission, PaStatus } from "./pa-types";
import { getInsForgeAdmin, isInsForgeConfigured } from "./insforge/admin";

type DbRow = {
  reference_id: string;
  patient_name: string;
  dob: string;
  member_id: string;
  diagnosis: string;
  medication: string;
  dosage: string;
  provider_name: string;
  justification: string;
  status: PaStatus;
  submitted_at: string;
  under_review_at?: string | null;
  decided_at?: string | null;
  decision_notes?: string | null;
  denial_reason?: string | null;
  reviewer_id?: string | null;
};

function rowToSubmission(row: DbRow): PaSubmission {
  return {
    reference_id: row.reference_id,
    patient_name: row.patient_name,
    dob: row.dob,
    member_id: row.member_id,
    diagnosis: row.diagnosis,
    medication: row.medication,
    dosage: row.dosage,
    provider_name: row.provider_name,
    justification: row.justification,
    status: row.status,
    submitted_at: row.submitted_at,
    under_review_at: row.under_review_at ?? undefined,
    decided_at: row.decided_at ?? undefined,
    decision_notes: row.decision_notes ?? undefined,
    denial_reason: row.denial_reason ?? undefined,
    reviewer_id: row.reviewer_id ?? undefined,
  };
}

async function nextReferenceId(): Promise<string> {
  const insforge = getInsForgeAdmin();
  const { data, error } = await insforge.database
    .from("pa_submissions")
    .select("reference_id")
    .order("reference_id", { ascending: false })
    .limit(1);

  if (error) throw new Error(error.message);

  let counter = 451;
  const latest = data?.[0]?.reference_id as string | undefined;
  if (latest) {
    const num = parseInt(latest.replace(/\D/g, ""), 10);
    if (num >= counter) counter = num + 1;
  }

  return `PA-2026-${String(counter).padStart(5, "0")}`;
}

export async function createSubmission(payload: PaFormPayload): Promise<PaSubmission> {
  const insforge = getInsForgeAdmin();
  const reference_id = await nextReferenceId();
  const submitted_at = new Date().toISOString();

  const row = {
    reference_id,
    ...payload,
    status: "pending_review" as PaStatus,
    submitted_at,
  };

  const { data, error } = await insforge.database
    .from("pa_submissions")
    .insert([row])
    .select("*");

  if (error) throw new Error(error.message);
  return rowToSubmission(data![0] as DbRow);
}

export async function getSubmission(reference_id: string): Promise<PaSubmission | null> {
  const insforge = getInsForgeAdmin();
  const { data, error } = await insforge.database
    .from("pa_submissions")
    .select("*")
    .eq("reference_id", reference_id)
    .limit(1);

  if (error) throw new Error(error.message);
  if (!data?.length) return null;
  return rowToSubmission(data[0] as DbRow);
}

export async function updateSubmission(
  reference_id: string,
  patch: Partial<PaSubmission>
): Promise<PaSubmission | null> {
  const insforge = getInsForgeAdmin();
  const { data, error } = await insforge.database
    .from("pa_submissions")
    .update(patch)
    .eq("reference_id", reference_id)
    .select("*");

  if (error) throw new Error(error.message);
  if (!data?.length) return null;
  return rowToSubmission(data[0] as DbRow);
}

export { isInsForgeConfigured };
