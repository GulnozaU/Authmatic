'use client';

import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';

type AgentEvent = {
  step_no: number;
  verb: 'READ-WEB' | 'EXECUTE' | 'VERIFY' | 'PERSIST' | 'ACTION';
  plan: string;
  tool_input?: unknown;
  tool_output?: unknown;
  duration_ms?: number;
};

const VERB_META: Record<string, { label: string; sponsor: string }> = {
  'READ-WEB': { label: 'READ-WEB', sponsor: 'Rtrvr.ai' },
  EXECUTE: { label: 'EXECUTE', sponsor: 'Daytona' },
  VERIFY: { label: 'VERIFY', sponsor: 'Opsera' },
  PERSIST: { label: 'PERSIST', sponsor: 'Insforge' },
  ACTION: { label: 'ACTION', sponsor: 'Rtrvr.ai' },
};

type SampleTile = {
  filename: string;
  title: string;
  blurb: string;
  accentClass: string;
};

const SAMPLES: SampleTile[] = [
  {
    filename: 'rx-lisinopril.pdf',
    title: 'Happy path',
    blurb: 'Lisinopril 10mg → UnitedHealthcare. Drops, parses, verifies, files, returns receipt.',
    accentClass: 'border-good text-good',
  },
  {
    filename: 'rx-ozempic-martinez.pdf',
    title: 'Different payer',
    blurb: 'Ozempic for Sarah Martinez on HealthFirst. Proves it routes by member ID, not hardcoded.',
    accentClass: 'border-accent text-accent',
  },
  {
    filename: 'rx-overshare-demo.pdf',
    title: 'Safety net',
    blurb: 'Same Rx with an extra SSN. Opsera flags it, agent halts before submission — no receipt.',
    accentClass: 'border-amber-400 text-amber-700',
  },
];

export default function Home() {
  const router = useRouter();
  const [runId, setRunId] = useState<string | null>(null);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const startRun = useCallback(async (fetcher: () => Promise<Response>) => {
    setError(null);
    setEvents([]);
    try {
      const r = await fetcher();
      if (!r.ok) throw new Error(await r.text());
      const { run_id } = (await r.json()) as { run_id: string };
      setRunId(run_id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Run failed to start');
    }
  }, []);

  const onDrop = useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      const form = new FormData();
      form.append('pdf', files[0]);
      await startRun(() => fetch('/api/run', { method: 'POST', body: form }));
    },
    [startRun],
  );

  const onSample = useCallback(
    (filename: string) => async () => {
      await startRun(() => fetch(`/api/sample/${filename}`, { method: 'POST' }));
    },
    [startRun],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
  });

  useEffect(() => {
    if (!runId) return;
    const es = new EventSource(`/api/stream/${runId}`);
    es.onmessage = (m) => {
      try {
        const ev = JSON.parse(m.data) as AgentEvent | { done: true };
        if ('done' in ev) {
          es.close();
          router.push(`/run/${runId}`);
        } else {
          setEvents((prev) => [...prev, ev]);
        }
      } catch {
        /* ignore malformed */
      }
    };
    es.onerror = () => {
      es.close();
      setError('Lost connection to agent stream — check /run/' + runId);
    };
    return () => es.close();
  }, [runId, router]);

  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">
          Authmatic
        </p>
        <h1 className="font-serif text-4xl font-semibold text-ink mt-2">
          Drop a prescription. Watch it file itself.
        </h1>
        <p className="text-base text-gray-500 mt-3 max-w-prose">
          The agent reads the payer rule, parses the chart, scans for PHI,
          submits the form, and returns a receipt URL — usually under 90
          seconds.
        </p>
        <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900">
          <span aria-hidden>⚠</span>
          Synthetic data only · all patients, member IDs, and NPIs are fictitious
        </p>
      </header>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {SAMPLES.map((s) => (
          <button
            key={s.filename}
            type="button"
            onClick={onSample(s.filename)}
            disabled={runId !== null && events.length < 5}
            className={`group rounded-lg border-2 border-l-4 bg-white p-4 text-left transition hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${s.accentClass}`}
          >
            <p className="text-xs font-semibold uppercase tracking-widest">
              Try the {s.title.toLowerCase()}
            </p>
            <p className="mt-2 font-serif text-base text-ink">{s.title}</p>
            <p className="mt-1 text-xs text-gray-500 leading-relaxed">{s.blurb}</p>
            <p className="mt-3 text-xs text-gray-400 group-hover:text-ink">
              {s.filename} →
            </p>
          </button>
        ))}
      </section>

      <section
        {...getRootProps()}
        className={`rounded-xl border-2 border-dashed p-16 text-center transition-colors cursor-pointer ${
          isDragActive
            ? 'border-accent bg-orange-50'
            : 'border-gray-300 bg-white hover:border-accent'
        }`}
      >
        <input {...getInputProps()} />
        <p className="font-serif text-xl text-ink">
          {isDragActive ? 'Drop the prescription PDF…' : 'Or drop your own prescription PDF'}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          click to choose a file
        </p>
      </section>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {events.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-serif text-2xl font-semibold text-ink">
            Agent run · {runId?.slice(0, 8)}…
          </h2>
          <ol className="space-y-3">
            {events.map((ev) => {
              const meta = VERB_META[ev.verb];
              return (
                <li
                  key={ev.step_no}
                  className="rounded-lg border border-gray-200 bg-white p-4"
                >
                  <div className="flex items-baseline justify-between">
                    <p className="text-xs font-bold tracking-widest text-accent">
                      {meta?.label ?? ev.verb}{' '}
                      <span className="text-gray-400 font-medium">
                        · {meta?.sponsor}
                      </span>
                    </p>
                    {ev.duration_ms != null && (
                      <span className="text-xs text-gray-400">
                        {ev.duration_ms}ms
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-ink">{ev.plan}</p>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </div>
  );
}
