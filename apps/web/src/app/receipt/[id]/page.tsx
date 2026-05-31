// /receipt/[id] — fixture-mode "payer-portal confirmation" page.
//
// Intentionally styled to feel like a UHC provider portal, NOT Authmatic.
// This is the artifact at the end of the pitch's money-shot beat: the
// judge clicks the receipt URL the agent returned and sees a real-looking
// confirmation from an external system.
//
// The URL contains only the first 8 chars of the prior_auth UUID, which
// is enough for a believable reference number but not enough to query
// the run. We render synthetic data matching the canonical fixture
// (rx-metformin.pdf + Jane Doe / UHC-CHOICE-PLUS) so the page is
// deterministic for demo and recordings.

type Params = { params: { id: string } };

export function generateMetadata({ params }: Params) {
  return {
    title: `UHC Provider Portal · PA-${params.id.toUpperCase()}`,
  };
}

const SUBMITTED_AT = '2026-05-31 09:42 PT';

export default function ReceiptPage({ params }: Params) {
  const ref = params.id.toUpperCase();
  const confirmation = `PA-${ref}-9F2C`;

  return (
    <div
      className="font-sans text-[#1a1a1a]"
      style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
    >
      {/* Portal header — navy bar, white wordmark. Deliberately bureaucratic. */}
      <header className="-mx-6 -mt-12 mb-8 bg-[#002677] px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="text-white">
            <p className="text-[11px] uppercase tracking-widest opacity-80">
              UnitedHealthcare
            </p>
            <p className="text-base font-semibold">Provider Portal</p>
          </div>
          <p className="text-xs text-white/70">
            Session · clinic-sf-mateo · {SUBMITTED_AT}
          </p>
        </div>
      </header>

      <article className="mx-auto max-w-3xl space-y-8 border border-gray-300 bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between border-b border-gray-200 pb-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-500">
              Prior Authorization
            </p>
            <h1 className="mt-1 text-2xl font-semibold">
              Submission received
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Your request has been submitted to the medical review queue.
              No further action is required at this time.
            </p>
          </div>
          <span className="rounded-sm bg-[#e6f3eb] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#1f6b3e]">
            Submitted
          </span>
        </div>

        <section>
          <p className="text-xs uppercase tracking-widest text-gray-500">
            Confirmation number
          </p>
          <p className="mt-1 font-mono text-lg">{confirmation}</p>
        </section>

        <section className="grid grid-cols-2 gap-x-8 gap-y-5 border-t border-gray-200 pt-6 text-sm">
          <Field label="Member" value="Jane Doe" />
          <Field label="Member ID" value="UHC-000000-DEMO" />
          <Field label="Date of birth" value="04/12/1968" />
          <Field label="Plan" value="UHC Choice Plus" />
          <Field label="Requested drug" value="Metformin 500mg" />
          <Field label="NDC" value="00093-1059-01" />
          <Field label="Diagnosis (ICD-10)" value="E11.9 — T2DM, w/o complication" />
          <Field label="Prescriber" value="A. Patel, MD · NPI 1234567890" />
        </section>

        <section className="border-t border-gray-200 pt-6 text-sm">
          <p className="text-xs uppercase tracking-widest text-gray-500">
            Medical necessity (attached)
          </p>
          <p className="mt-2 leading-relaxed text-gray-700">
            Patient meets medical-necessity criteria for Metformin. Diagnosis
            E11.9 (Type 2 Diabetes Mellitus) satisfies ADA first-line therapy
            guidelines (A1c ≥ 6.5%). First-line alternatives have been tried
            and documented in the chart.
          </p>
        </section>

        <section className="border-t border-gray-200 pt-6 text-sm">
          <p className="text-xs uppercase tracking-widest text-gray-500">
            Next steps
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-700">
            <li>Medical review typically completes within 72 hours.</li>
            <li>Status updates will appear in the Provider Portal inbox.</li>
            <li>For urgent requests, call 1-800-555-0142.</li>
          </ul>
        </section>

        <footer className="border-t border-gray-200 pt-4 text-[11px] text-gray-500">
          <p>
            Submission ref {confirmation} · received {SUBMITTED_AT}. This page
            is a demonstration artifact; no real claim has been filed with
            UnitedHealthcare. Submitted via Authmatic.
          </p>
        </footer>
      </article>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-gray-500">{label}</p>
      <p className="mt-1 text-gray-900">{value}</p>
    </div>
  );
}
