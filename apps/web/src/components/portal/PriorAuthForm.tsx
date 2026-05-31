"use client";

import { useEffect, useRef, useState } from "react";
import { PortalHeader } from "./PortalHeader";
import { getDemoFormPayload } from "@/lib/demo-case";
import type { PaFormPayload } from "@/lib/pa-types";

const fields = [
  { id: "patient_name", label: "Patient Name", type: "text" as const },
  { id: "dob", label: "Date of Birth", type: "text" as const },
  { id: "member_id", label: "Member ID", type: "text" as const },
  { id: "diagnosis", label: "Primary Diagnosis", type: "text" as const },
  { id: "medication", label: "Requested Medication", type: "text" as const },
  { id: "dosage", label: "Dosage / Frequency", type: "text" as const },
  { id: "provider_name", label: "Prescribing Provider", type: "text" as const },
  {
    id: "justification",
    label: "Clinical Justification / Step Therapy",
    type: "textarea" as const,
  },
];

type Props = {
  autofill?: boolean;
  runId?: string;
};

export function PriorAuthForm({ autofill = false, runId }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [filling, setFilling] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!autofill) return;

    const payload = getDemoFormPayload();
    const keys = Object.keys(payload) as (keyof PaFormPayload)[];

    let i = 0;
    const interval = setInterval(() => {
      if (i >= keys.length) {
        clearInterval(interval);
        setFilling(null);
        setTimeout(() => {
          formRef.current?.requestSubmit();
          setSubmitted(true);
        }, 600);
        return;
      }
      const key = keys[i];
      setFilling(key);
      setValues((prev) => ({ ...prev, [key]: payload[key] }));
      i += 1;
    }, 450);

    return () => clearInterval(interval);
  }, [autofill]);

  return (
    <div className="min-h-screen bg-slate-100 font-portal">
      <PortalHeader title="Pharmacy Prior Authorization Request" />

      <main className="mx-auto max-w-4xl px-6 py-8">
        {autofill && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            <strong>Agent filling form</strong>
            {runId && <> — run {runId.slice(0, 8)}…</>}
            {filling && (
              <span className="mt-1 block font-mono text-xs">
                Filling: {filling} ✓
              </span>
            )}
            {submitted && (
              <span className="mt-1 block text-green-800">Submitting…</span>
            )}
          </div>
        )}

        {!autofill && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <strong>HealthFirst PPO — Pharmacy PA.</strong> Submissions enter medical
            review. Approval is not immediate.
          </div>
        )}

        <form
          ref={formRef}
          id="prior-auth-form"
          action="/api/pa/submit"
          method="POST"
          className="rounded-xl border border-hf-border bg-white shadow-sm"
        >
          <div className="border-b border-hf-border bg-hf-sky px-6 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-hf-navy">
              Request Information
            </h2>
          </div>

          <div className="grid gap-6 p-6 sm:grid-cols-2">
            {fields.map((field) => {
              const active = filling === field.id;
              const cls = `w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
                active
                  ? "border-green-500 bg-green-50 ring-green-500"
                  : "border-slate-300 focus:border-hf-blue focus:ring-hf-blue"
              }`;

              return (
                <div
                  key={field.id}
                  className={field.type === "textarea" ? "sm:col-span-2" : ""}
                >
                  <label
                    htmlFor={field.id}
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    {field.label}
                    <span className="text-red-600"> *</span>
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      id={field.id}
                      name={field.id}
                      required
                      rows={5}
                      value={values[field.id] ?? ""}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [field.id]: e.target.value }))
                      }
                      className={cls}
                    />
                  ) : (
                    <input
                      id={field.id}
                      name={field.id}
                      type="text"
                      required
                      autoComplete="off"
                      value={values[field.id] ?? ""}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [field.id]: e.target.value }))
                      }
                      className={cls}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between border-t border-hf-border bg-slate-50 px-6 py-4">
            <p className="text-xs text-slate-500">
              By submitting, you attest that information is accurate.
            </p>
            <button
              id="submit-prior-auth"
              type="submit"
              disabled={autofill && !!filling}
              className="rounded-md bg-hf-navy px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-hf-blue disabled:opacity-50"
            >
              Submit Prior Authorization
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
