import { notFound } from 'next/navigation';

type RunDetail = {
  id: string;
  patient: { full_name: string; dob: string; plan_id: string; member_id: string };
  drug: { name: string; dose: string; diagnosis_code: string };
  status: 'pending' | 'submitted' | 'approved' | 'denied' | 'error';
  receipt_url: string | null;
  rationale: string | null;
  events: Array<{
    step_no: number;
    verb: string;
    plan: string;
    tool_input: unknown;
    tool_output: unknown;
    duration_ms: number;
  }>;
  scan: {
    passed: boolean;
    flagged_fields: string[];
    scanned_at: string;
  } | null;
  created_at: string;
};

async function fetchRun(id: string): Promise<RunDetail | null> {
  const base = process.env.AGENT_BASE_URL ?? 'http://localhost:8000';
  const r = await fetch(`${base}/api/run/${id}`, { cache: 'no-store' });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`Failed to load run: ${r.status}`);
  return r.json();
}

const SPONSORS = [
  { name: 'Rtrvr.ai', role: 'Drove the payer portal — fetched the live rule and submitted the form' },
  { name: 'Daytona', role: 'Sandboxed the agent-written PDF parsing + ICD-10 normalization' },
  { name: 'Opsera', role: 'Scanned the outgoing packet for PHI over-disclosure' },
  { name: 'Insforge', role: 'Persisted state, vectorized priors, fired the doctor notification' },
];

export default async function RunPage({ params }: { params: { id: string } }) {
  const run = await fetchRun(params.id);
  if (!run) notFound();

  return (
    <div className="space-y-10">
      {/* ─── Header: the money shot ─────────────────────────────── */}
      <header className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">
          Audit page · run {run.id.slice(0, 8)}
        </p>
        <h1 className="font-serif text-3xl font-semibold text-ink">
          {run.drug.name} · {run.patient.full_name}
        </h1>

        {run.receipt_url ? (
          <a
            href={run.receipt_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-xl bg-good px-6 py-4 text-lg font-semibold text-white shadow-lg hover:bg-emerald-700 transition"
          >
            View payer receipt →
          </a>
        ) : (
          <div className="inline-flex rounded-xl bg-gray-200 px-6 py-4 text-lg font-semibold text-gray-500">
            Status: {run.status}
          </div>
        )}
      </header>

      {/* ─── Patient + drug card ────────────────────────────────── */}
      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
          Submission
        </h2>
        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-gray-500">Patient</dt>
          <dd className="text-ink">{run.patient.full_name} (DOB {run.patient.dob})</dd>
          <dt className="text-gray-500">Plan / member</dt>
          <dd className="text-ink">{run.patient.plan_id} · {run.patient.member_id}</dd>
          <dt className="text-gray-500">Drug</dt>
          <dd className="text-ink">{run.drug.name} {run.drug.dose}</dd>
          <dt className="text-gray-500">Diagnosis (ICD-10)</dt>
          <dd className="text-ink">{run.drug.diagnosis_code}</dd>
        </dl>
      </section>

      {/* ─── Compliance scan ────────────────────────────────────── */}
      {run.scan && (
        <section className={`rounded-lg border p-5 ${
          run.scan.passed
            ? 'border-good bg-emerald-50'
            : 'border-amber-300 bg-amber-50'
        }`}>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
            Compliance scan · Opsera MCP
          </h2>
          <p className={`text-base font-semibold ${
            run.scan.passed ? 'text-good' : 'text-amber-800'
          }`}>
            {run.scan.passed
              ? '✓ Passed — no PHI over-disclosure detected'
              : `⚠ Flagged: ${run.scan.flagged_fields.join(', ')}`}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Scanned at {new Date(run.scan.scanned_at).toLocaleTimeString()}
          </p>
        </section>
      )}

      {/* ─── Agent chain ────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          Agent decision chain
        </h2>
        <ol className="space-y-3">
          {run.events.map((ev) => (
            <li
              key={ev.step_no}
              className="rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="flex items-baseline justify-between">
                <p className="text-xs font-bold tracking-widest text-accent">
                  Step {ev.step_no} · {ev.verb}
                </p>
                <span className="text-xs text-gray-400">{ev.duration_ms}ms</span>
              </div>
              <p className="mt-2 text-sm text-ink">{ev.plan}</p>
              <details className="mt-3 text-xs">
                <summary className="text-gray-500 cursor-pointer hover:text-ink">
                  Tool I/O
                </summary>
                <pre className="mt-2 p-3 bg-gray-50 rounded text-[11px] overflow-x-auto">
{JSON.stringify({ input: ev.tool_input, output: ev.tool_output }, null, 2)}
                </pre>
              </details>
            </li>
          ))}
        </ol>
      </section>

      {/* ─── Sponsor footer ─────────────────────────────────────── */}
      <footer className="border-t border-gray-200 pt-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
          Powered by
        </h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {SPONSORS.map((s) => (
            <li key={s.name} className="rounded-lg border border-gray-200 bg-white p-3">
              <p className="font-serif font-semibold text-ink">{s.name}</p>
              <p className="text-xs text-gray-500 mt-1">{s.role}</p>
            </li>
          ))}
        </ul>
      </footer>
    </div>
  );
}
