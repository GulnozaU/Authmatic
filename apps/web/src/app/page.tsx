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

export default function Home() {
  const router = useRouter();
  const [runId, setRunId] = useState<string | null>(null);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (files: File[]) => {
    if (!files.length) return;
    setError(null);
    setEvents([]);

    const form = new FormData();
    form.append('pdf', files[0]);

    try {
      const r = await fetch('/api/run', { method: 'POST', body: form });
      if (!r.ok) throw new Error(await r.text());
      const { run_id } = (await r.json()) as { run_id: string };
      setRunId(run_id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    }
  }, []);

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
          seconds. Use synthetic patient data only.
        </p>
      </header>

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
          {isDragActive ? 'Drop the prescription PDF…' : 'Drop a prescription PDF here'}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          or click to choose a file
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
