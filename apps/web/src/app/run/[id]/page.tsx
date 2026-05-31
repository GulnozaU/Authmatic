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
  const tigris = run?.tigris_artifacts;

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

        {done && tigris && (tigris.chart || tigris.prescription || tigris.receipt) && (
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-orange-800">
              Tigris — document storage
            </p>
            <p className="mt-1 text-sm text-orange-900">
              Patient PDFs and receipt stored in bucket{" "}
              <span className="font-mono font-semibold">{tigris.bucket}</span>
            </p>
            <ul className="mt-3 space-y-2 text-xs">
              {tigris.chart && (
                <li className="rounded bg-white/80 px-3 py-2 font-mono text-slate-700">
                  Chart: {tigris.chart.key}
                </li>
              )}
              {tigris.prescription && (
                <li className="rounded bg-white/80 px-3 py-2 font-mono text-slate-700">
                  Prescription: {tigris.prescription.key}
                </li>
              )}
              {tigris.receipt && (
                <li className="rounded bg-white/80 px-3 py-2 font-mono text-slate-700">
                  Receipt: {tigris.receipt.key}
                </li>
              )}
            </ul>
          </div>
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
            <p className="font-semibold text-hf-navy">Sponsors (live integrations)</p>
            <ul className="mt-2 space-y-1 text-xs">
              <li>
                Daytona — PDF extract
                {steps.find((s) => s.step_no === 1)?.tool_output?._extract ? " ✓" : ""}
              </li>
              <li>
                Opsera — compliance verify
                {steps.find((s) => s.step_no === 2)?.tool_output?.passed ? " ✓" : ""}
              </li>
              <li>
                Rtrvr —{" "}
                {(steps.find((s) => s.step_no === 3)?.tool_output?.rtrvr as { used?: boolean })
                  ?.used
                  ? "Agent API ✓"
                  : "portal autofill"}
              </li>
              <li>InsForge — workflow DB + prior_auths ✓</li>
              <li>
                Tigris — {tigris?.bucket ?? "authmatic-demo"}
                {tigris?.receipt ? " ✓" : ""}
              </li>
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
