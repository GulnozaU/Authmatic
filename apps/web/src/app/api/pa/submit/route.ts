import { NextRequest, NextResponse } from "next/server";
import type { PaFormPayload } from "@/lib/pa-types";
import { createSubmission } from "@/lib/submissions";

function formDataToPayload(form: FormData): PaFormPayload {
  return {
    patient_name: String(form.get("patient_name") ?? ""),
    dob: String(form.get("dob") ?? ""),
    member_id: String(form.get("member_id") ?? ""),
    diagnosis: String(form.get("diagnosis") ?? ""),
    medication: String(form.get("medication") ?? ""),
    dosage: String(form.get("dosage") ?? ""),
    provider_name: String(form.get("provider_name") ?? ""),
    justification: String(form.get("justification") ?? ""),
  };
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";
  let payload: PaFormPayload;

  if (contentType.includes("application/json")) {
    payload = (await request.json()) as PaFormPayload;
  } else {
    const form = await request.formData();
    payload = formDataToPayload(form);
  }

  const submission = await createSubmission(payload);
  const base = request.nextUrl.origin;

  const accept = request.headers.get("accept") ?? "";
  if (contentType.includes("application/json") || accept.includes("application/json")) {
    return NextResponse.json({
      reference_id: submission.reference_id,
      status: submission.status,
      status_url: `${base}/portal/healthfirst/submission/${submission.reference_id}`,
      message:
        "Prior authorization request received. Status: Pending Review. Medical review typically completes within 24–72 hours.",
    });
  }

  return NextResponse.redirect(
    `${base}/portal/healthfirst/submission/${submission.reference_id}`,
    303
  );
}
