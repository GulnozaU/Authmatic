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

const memory = new Map<string, PaSubmission>();
let counter = 451;

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

function nextLocalReferenceId(): string {
  const id = `PA-2026-${String(counter).padStart(5, "0")}`;
  counter += 1;
  return id;
}

async function nextReferenceId(): Promise<string> {
  if (!isInsForgeConfigured()) return nextLocalReferenceId();

  try {
    const insforge = getInsForgeAdmin();
    const { data, error } = await insforge.database
      .from("pa_submissions")
      .select("reference_id")
      .order("reference_id", { ascending: false })
      .limit(1);

    if (error) return nextLocalReferenceId();

    let next = 451;
    const latest = data?.[0]?.reference_id as string | undefined;
    if (latest) {
      const num = parseInt(latest.replace(/\D/g, ""), 10);
      if (num >= next) next = num + 1;
    }
    counter = next + 1;
    return `PA-2026-${String(next).padStart(5, "0")}`;
  } catch {
    return nextLocalReferenceId();
  }
}

function saveLocal(submission: PaSubmission): PaSubmission {
  memory.set(submission.reference_id, submission);
  return submission;
}

export async function createSubmission(payload: PaFormPayload): Promise<PaSubmission> {
  const reference_id = await nextReferenceId();
  const submitted_at = new Date().toISOString();
  const submission: PaSubmission = {
    ...payload,
    reference_id,
    status: "pending_review",
    submitted_at,
  };

  if (!isInsForgeConfigured()) {
    return saveLocal(submission);
  }

  try {
    const insforge = getInsForgeAdmin();
    const { data, error } = await insforge.database
      .from("pa_submissions")
      .insert([{ reference_id, ...payload, status: "pending_review", submitted_at }])
      .select("*");

    if (error) throw new Error(error.message);
    return rowToSubmission(data![0] as DbRow);
  } catch {
    return saveLocal(submission);
  }
}

export async function getSubmission(reference_id: string): Promise<PaSubmission | null> {
  if (memory.has(reference_id)) {
    return memory.get(reference_id) ?? null;
  }

  if (!isInsForgeConfigured()) return null;

  try {
    const insforge = getInsForgeAdmin();
    const { data, error } = await insforge.database
      .from("pa_submissions")
      .select("*")
      .eq("reference_id", reference_id)
      .limit(1);

    if (error) throw new Error(error.message);
    if (!data?.length) return null;
    return rowToSubmission(data[0] as DbRow);
  } catch {
    return memory.get(reference_id) ?? null;
  }
}

export async function updateSubmission(
  reference_id: string,
  patch: Partial<PaSubmission>
): Promise<PaSubmission | null> {
  const local = memory.get(reference_id);
  if (local) {
    const updated = { ...local, ...patch };
    memory.set(reference_id, updated);
    return updated;
  }

  if (!isInsForgeConfigured()) return null;

  try {
    const insforge = getInsForgeAdmin();
    const { data, error } = await insforge.database
      .from("pa_submissions")
      .update(patch)
      .eq("reference_id", reference_id)
      .select("*");

    if (error) throw new Error(error.message);
    if (!data?.length) return null;
    return rowToSubmission(data[0] as DbRow);
  } catch {
    return null;
  }
}

export { isInsForgeConfigured };
