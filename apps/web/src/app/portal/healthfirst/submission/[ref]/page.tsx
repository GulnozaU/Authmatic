"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { StatusTimeline } from "@/components/portal/StatusTimeline";
import type { PaSubmission } from "@/lib/pa-types";
import { STATUS_LABELS } from "@/lib/pa-types";

export default function SubmissionStatusPage() {
  const params = useParams();
  const ref = String(params.ref ?? "");
  const [submission, setSubmission] = useState<PaSubmission | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ref) return;

    let active = true;

    async function poll() {
      try {
        const res = await fetch(`/api/pa/${ref}`);
        if (!res.ok) {
          if (active) setError("Reference ID not found");
          return;
        }
        const data = (await res.json()) as PaSubmission;
        if (active) {
          setSubmission(data);
          setError(null);
        }
      } catch {
        if (active) setError("Unable to load status");
      }
    }

    poll();
    const id = setInterval(poll, 2500);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [ref]);

  const status = submission?.status ?? "pending_review";
  const isFinal = status === "approved" || status === "denied";

  return (
    <div className="min-h-screen bg-slate-100 font-portal">
      <PortalHeader title="Prior Authorization — Request Status" />

      <main className="mx-auto max-w-4xl px-6 py-8">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
            {error}
          </div>
        )}

        {submission && (
          <div className="space-y-6">
            <div
              className={`rounded-xl border px-6 py-5 ${
                status === "approved"
                  ? "border-green-200 bg-green-50"
                  : status === "denied"
                    ? "border-red-200 bg-red-50"
                    : "border-hf-border bg-white"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Reference ID
              </p>
              <p className="mt-1 font-mono text-2xl font-bold text-hf-navy">
                {submission.reference_id}
              </p>
              <p className="mt-3 text-lg font-semibold">
                {status === "pending_review" && "Request Received — Pending Review"}
                {status === "under_review" && "Under Medical Review"}
                {status === "approved" && "Authorization Approved"}
                {status === "denied" && "Authorization Denied"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Status: <strong>{STATUS_LABELS[status]}</strong>
                {!isFinal && " — HealthFirst clinical review in progress"}
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-hf-border bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-hf-navy">
                  Review Progress
                </h2>
                <StatusTimeline
                  status={status}
                  submittedAt={submission.submitted_at}
                  decidedAt={submission.decided_at}
                />
              </div>

              <div className="rounded-xl border border-hf-border bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-hf-navy">
                  Request Summary
                </h2>
                <dl className="space-y-3 text-sm">
                  {(
                    [
                      ["Patient", submission.patient_name],
                      ["Date of birth", submission.dob],
                      ["Member ID", submission.member_id],
                      ["Medication", `${submission.medication} — ${submission.dosage}`],
                      ["Diagnosis", submission.diagnosis],
                      ["Provider", submission.provider_name],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                      <dt className="text-slate-500">{label}</dt>
                      <dd className="max-w-[60%] text-right font-medium text-slate-800">{value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Clinical justification
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-800">
                    {submission.justification}
                  </p>
                </div>

                {submission.decision_notes && isFinal && (
                  <div
                    className={`mt-4 rounded-lg p-3 text-sm ${
                      status === "approved"
                        ? "bg-green-100 text-green-900"
                        : "bg-red-100 text-red-900"
                    }`}
                  >
                    <p className="font-semibold">Medical Review Notes</p>
                    <p className="mt-1">{submission.decision_notes}</p>
                    {submission.denial_reason && (
                      <p className="mt-2 text-xs">{submission.denial_reason}</p>
                    )}
                    {submission.reviewer_id && (
                      <p className="mt-2 text-xs opacity-70">
                        Reviewer: {submission.reviewer_id}
                      </p>
                    )}
                  </div>
                )}

                {!isFinal && (
                  <p className="mt-4 text-xs text-slate-500">
                    You will be notified when medical review completes. Do not dispense until
                    approval is confirmed.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {!submission && !error && (
          <p className="text-center text-slate-500">Loading submission status…</p>
        )}
      </main>
    </div>
  );
}
