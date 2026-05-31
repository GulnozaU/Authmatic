"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AgentStepCard } from "@/components/AgentStepCard";
import type { AgentRun, AgentStep } from "@/lib/agent-runs";

export default function RunPage() {
  const params = useParams();
  const runId = String(params.id ?? "");
  const [run, setRun] = useState<AgentRun | null>(null);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [portalOpened, setPortalOpened] = useState(false);
  const portalRef = useRef(false);

  useEffect(() => {
    if (!runId) return;

    const es = new EventSource(`/api/stream/${runId}`);

    es.onmessage = (event) => {
      const data = JSON.parse(event.data) as {
        type: string;
        step?: AgentStep;
        run?: AgentRun;
        url?: string;
      };

      if (data.run) setRun(data.run);
      if (data.step) {
        setSteps((prev) => {
          const idx = prev.findIndex((s) => s.step_no === data.step!.step_no);
          if (idx === -1) return [...prev, data.step!];
          const next = [...prev];
          next[idx] = data.step!;
          return next.sort((a, b) => a.step_no - b.step_no);
        });
      }

      if (data.type === "portal" && data.url && !portalRef.current) {
        portalRef.current = true;
        setPortalOpened(true);
        window.open(data.url, "_blank", "noopener,noreferrer");
      }
    };

    es.onerror = () => es.close();

    return () => es.close();
  }, [runId]);

  const done = run?.status === "completed";
  const receipt = run?.receipt_url;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white px-6 py-4">
        <p className="text-xs font-bold uppercase tracking-widest text-hf-blue">
          Authmatic
        </p>
        <h1 className="text-xl font-semibold text-hf-navy">Agent run</h1>
        <p className="font-mono text-xs text-slate-400">{runId}</p>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 px-6 py-8">
        {receipt && done && (
          <a
            href={receipt}
            className="block rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-center text-white shadow-lg"
          >
            <p className="text-xs uppercase tracking-wider opacity-90">
              Authorization reference
            </p>
            <p className="mt-1 text-2xl font-bold font-mono">{run?.reference_id}</p>
            <p className="mt-2 text-sm underline opacity-90">View submission receipt →</p>
          </a>
        )}

        {portalOpened && (
          <p className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-900">
            HealthFirst portal opened in new tab — watch the agent fill the form.
          </p>
        )}

        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Agent loop
          </h2>
          {steps.length === 0 && (
            <p className="text-slate-500">Starting agent…</p>
          )}
          {steps.map((step) => (
            <AgentStepCard key={step.step_no} step={step} />
          ))}
        </div>

        {done && (
          <div className="rounded-xl border bg-white p-4 text-sm text-slate-600">
            <p className="font-semibold text-hf-navy">Sponsors</p>
            <ul className="mt-2 space-y-1 text-xs">
              <li>Rtrvr — browser form submit</li>
              <li>Opsera — compliance verify</li>
              <li>Daytona — PDF extract</li>
              <li>InsForge — workflow DB</li>
              <li>Tigris — document storage</li>
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
