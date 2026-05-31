"use client";

import type { AgentStep } from "@/lib/agent-runs";

const verbColors: Record<string, string> = {
  EXTRACT: "bg-violet-100 text-violet-800",
  VERIFY: "bg-emerald-100 text-emerald-800",
  SUBMIT: "bg-orange-100 text-orange-800",
  ADJUDICATE: "bg-amber-100 text-amber-800",
  PERSIST: "bg-blue-100 text-blue-800",
};

export function AgentStepCard({ step }: { step: AgentStep }) {
  const color = verbColors[step.verb] ?? "bg-slate-100 text-slate-800";

  return (
    <div
      className={`rounded-xl border p-4 transition-all ${
        step.status === "running"
          ? "border-hf-blue bg-blue-50/50 shadow-md"
          : step.status === "done"
            ? "border-green-200 bg-white"
            : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded px-2 py-0.5 text-xs font-bold ${color}`}>
          {step.verb}
        </span>
        <span className="text-xs text-slate-500">{step.sponsor}</span>
        {step.duration_ms != null && (
          <span className="ml-auto text-xs text-slate-400">
            {(step.duration_ms / 1000).toFixed(1)}s
          </span>
        )}
        {step.status === "done" && (
          <span className="text-green-600 text-sm">✓</span>
        )}
      </div>
      <p className="mt-2 text-sm text-slate-700">{step.plan}</p>
      {step.tool_output && Object.keys(step.tool_output).length > 0 && (
        <pre className="mt-3 max-h-32 overflow-auto rounded bg-slate-900 p-2 text-xs text-green-300">
          {JSON.stringify(step.tool_output, null, 2)}
        </pre>
      )}
    </div>
  );
}
