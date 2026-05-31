import { PortalHeader } from "@/components/portal/PortalHeader";

const fields = [
  { id: "patient_name", label: "Patient Name", type: "text", placeholder: "Last, First" },
  { id: "dob", label: "Date of Birth", type: "text", placeholder: "MM/DD/YYYY" },
  { id: "member_id", label: "Member ID", type: "text", placeholder: "HF12345678" },
  { id: "diagnosis", label: "Primary Diagnosis", type: "text", placeholder: "Diagnosis (ICD-10)" },
  { id: "medication", label: "Requested Medication", type: "text", placeholder: "Drug name" },
  { id: "dosage", label: "Dosage / Frequency", type: "text", placeholder: "e.g. 0.25mg weekly" },
  { id: "provider_name", label: "Prescribing Provider", type: "text", placeholder: "Name, credentials" },
  {
    id: "justification",
    label: "Clinical Justification / Step Therapy",
    type: "textarea",
    placeholder: "Document prior therapies tried and clinical rationale for requested agent…",
  },
] as const;

export default function PriorAuthFormPage() {
  return (
    <div className="min-h-screen bg-slate-100 font-portal">
      <PortalHeader title="Pharmacy Prior Authorization Request" />

      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>HealthFirst PPO — Pharmacy PA.</strong> Complete all fields. Submissions enter
          medical review queue. Approval is not immediate; typical turnaround 24–72 business hours.
        </div>

        <form
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
            {fields.map((field) => (
              <div
                key={field.id}
                className={field.type === "textarea" ? "sm:col-span-2" : ""}
              >
                <label htmlFor={field.id} className="mb-1.5 block text-sm font-medium text-slate-700">
                  {field.label}
                  <span className="text-red-600"> *</span>
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    id={field.id}
                    name={field.id}
                    required
                    rows={5}
                    placeholder={field.placeholder}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-hf-blue focus:outline-none focus:ring-1 focus:ring-hf-blue"
                  />
                ) : (
                  <input
                    id={field.id}
                    name={field.id}
                    type="text"
                    required
                    placeholder={field.placeholder}
                    autoComplete="off"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-hf-blue focus:outline-none focus:ring-1 focus:ring-hf-blue"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-hf-border bg-slate-50 px-6 py-4">
            <p className="text-xs text-slate-500">
              By submitting, you attest that information is accurate per provider record.
            </p>
            <button
              id="submit-prior-auth"
              type="submit"
              className="rounded-md bg-hf-navy px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-hf-blue focus:outline-none focus:ring-2 focus:ring-hf-blue focus:ring-offset-2"
            >
              Submit Prior Authorization
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          HealthFirst is a demonstration payer for Authmatic hackathon demo purposes.
        </p>
      </main>
    </div>
  );
}
