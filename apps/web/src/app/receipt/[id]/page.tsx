// /receipt/[id] — fixture-mode "payer-portal confirmation" page.
//
// Intentionally styled to feel like a payer provider portal, NOT Authmatic.
// This is the artifact at the end of the pitch's money-shot beat: the
// judge clicks the receipt URL the agent returned and sees a real-looking
// confirmation from an external system.
//
// Hits the agent's GET /api/run/:id so the page reflects whatever PA was
// actually just submitted (Lisinopril for Jane Doe, Ozempic for Sarah
// Martinez, etc.) rather than a hardcoded fixture.

import { notFound } from 'next/navigation';

type RunDetail = {
  id: string;
  patient: { full_name: string; dob: string; plan_id: string; member_id: string };
  drug: { name: string; dose: string; diagnosis_code: string };
  status: 'pending' | 'submitted' | 'approved' | 'denied' | 'error';
  rationale: string | null;
  receipt_url: string | null;
  created_at: string;
};

async function fetchRun(id: string): Promise<RunDetail | null> {
  const base = process.env.AGENT_BASE_URL ?? 'http://localhost:8000';
  const r = await fetch(`${base}/api/run/${id}`, { cache: 'no-store' });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`Failed to load run: ${r.status}`);
  return r.json();
}

type PayerBrand = {
  name: string;
  short: string;
  hex: string;
  phone: string;
};

function payerBrand(planId: string): PayerBrand {
  const id = (planId || '').toUpperCase();
  if (id.startsWith('AET') || id.includes('AETNA')) {
    return { name: 'Aetna Better Health', short: 'Aetna', hex: '#7c2d8e', phone: '1-800-872-3862' };
  }
  if (id.startsWith('HF') || id.includes('HEALTHFIRST')) {
    return { name: 'HealthFirst', short: 'HealthFirst', hex: '#0a5275', phone: '1-888-260-1010' };
  }
  return { name: 'UnitedHealthcare', short: 'UHC', hex: '#002677', phone: '1-877-842-3210' };
}

function formatDob(dob: string): string {
  // Accept "1968-04-12" or "04/12/1968" — render as US-style for the portal.
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  return iso ? `${iso[2]}/${iso[3]}/${iso[1]}` : dob;
}

export function generateMetadata({ params }: { params: { id: string } }) {
  return { title: `Provider Portal · PA-${params.id.slice(0, 8).toUpperCase()}` };
}

export default async function ReceiptPage({ params }: { params: { id: string } }) {
  const run = await fetchRun(params.id);
  if (!run) notFound();

  const payer = payerBrand(run.patient.plan_id);
  const submitted = new Date(run.created_at);
  const confirmation = `PA-${run.id.slice(0, 8).toUpperCase()}-${run.id.slice(9, 13).toUpperCase()}`;
  const session = `clinic-${run.id.slice(0, 4)}`;

  return (
    <div className="font-sans text-[#1a1a1a]" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
      {/* Portal header — payer-branded bar. Deliberately bureaucratic. */}
      <header className="-mx-6 -mt-12 mb-8 px-6 py-4" style={{ backgroundColor: payer.hex }}>
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="text-white">
            <p className="text-[11px] uppercase tracking-widest opacity-80">{payer.name}</p>
            <p className="text-base font-semibold">Provider Portal</p>
          </div>
          <p className="text-xs text-white/70">
            Session · {session} · {submitted.toLocaleString()}
          </p>
        </div>
      </header>

      <article className="mx-auto max-w-3xl space-y-8 border border-gray-300 bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between border-b border-gray-200 pb-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-500">Prior Authorization</p>
            <h1 className="mt-1 text-2xl font-semibold">Submission received</h1>
            <p className="mt-2 text-sm text-gray-600">
              Your request has been submitted to the medical review queue.
              No further action is required at this time.
            </p>
          </div>
          <span className="rounded-sm bg-[#e6f3eb] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#1f6b3e]">
            {run.status}
          </span>
        </div>

        <section>
          <p className="text-xs uppercase tracking-widest text-gray-500">Confirmation number</p>
          <p className="mt-1 font-mono text-lg">{confirmation}</p>
        </section>

        <section className="grid grid-cols-2 gap-x-8 gap-y-5 border-t border-gray-200 pt-6 text-sm">
          <Field label="Member" value={run.patient.full_name} />
          <Field label="Member ID" value={run.patient.member_id} />
          <Field label="Date of birth" value={formatDob(run.patient.dob)} />
          <Field label="Plan" value={run.patient.plan_id} />
          <Field
            label="Requested drug"
            value={run.drug.dose ? `${run.drug.name} ${run.drug.dose}` : run.drug.name}
          />
          <Field label="Diagnosis (ICD-10)" value={run.drug.diagnosis_code} />
        </section>

        {run.rationale && (
          <section className="border-t border-gray-200 pt-6 text-sm">
            <p className="text-xs uppercase tracking-widest text-gray-500">
              Medical necessity (attached)
            </p>
            <p className="mt-2 leading-relaxed text-gray-700">{run.rationale}</p>
          </section>
        )}

        <section className="border-t border-gray-200 pt-6 text-sm">
          <p className="text-xs uppercase tracking-widest text-gray-500">Next steps</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-700">
            <li>Medical review typically completes within 72 hours for routine requests.</li>
            <li>Status updates will appear in the {payer.short} Provider Portal inbox.</li>
            <li>For urgent requests, call {payer.short} Provider Services at {payer.phone}.</li>
          </ul>
        </section>

        <footer className="border-t border-gray-200 pt-4 text-[11px] text-gray-500">
          <p>
            Submission ref {confirmation} · received {submitted.toLocaleString()}. This page is a
            demonstration artifact; no real claim has been filed with {payer.name}. Submitted via
            Authmatic.
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
