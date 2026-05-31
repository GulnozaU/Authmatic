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
  const [portalPath, setPortalPath] = useState<string | null>(null);
  const portalRef = useRef(false);

  useEffect(() => {
    if (!runId) return;

    const es = new EventSource(`/api/stream/${runId}`);

    es.onmessage = (event) => {
      const data = JSON.parse(event.data) as {
        type: string;
        step?: AgentStep;
        run?: AgentRun;
        path?: string;
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

      if (data.type === "portal" && !portalRef.current) {
        portalRef.current = true;
        let path = data.path;
        if (!path && data.url) {
          try {
            path = new URL(data.url).pathname + new URL(data.url).search;
          } catch {
            path = `/portal/healthfirst/prior-auth?autofill=1&run=${runId}`;
          }
        }
        if (path) setPortalPath(path);
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

      <main className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        {receipt && done && (
          <a
            href={receipt}
            className="block rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-center text-white shadow-lg"
          >
            <p className="text-xs uppercase tracking-wider opacity-90">
              Authorization reference
            </p>
            <p className="mt-1 font-mono text-2xl font-bold">{run?.reference_id}</p>
            <p className="mt-2 text-sm underline opacity-90">View submission receipt →</p>
          </a>
        )}

        {portalPath && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b bg-hf-sky px-4 py-2 text-sm font-medium text-hf-navy">
              HealthFirst portal — agent filling form live
            </div>
            <iframe
              title="HealthFirst prior auth form"
              src={portalPath}
              className="h-[520px] w-full border-0 bg-white"
            />
          </div>
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
