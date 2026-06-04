"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  DEMO_CASES,
  LIVE_BATCH_IDS,
  type DemoCaseId,
} from "@/lib/demo-cases";

const ACCENT: Record<string, string> = {
  green: "border-l-[#1f6b3e]",
  blue: "border-l-[#2563eb]",
  purple: "border-l-purple-600",
  teal: "border-l-teal-600",
  amber: "border-l-amber-500",
};

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<DemoCaseId>>(
    () => new Set(LIVE_BATCH_IDS)
  );

  function toggle(id: DemoCaseId) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function startOne(caseId: DemoCaseId) {
    setLoading(caseId);
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demo: true, case_id: caseId }),
      });
      const data = await res.json();
      router.push(`/run/${data.run_id}`);
    } catch {
      setLoading(null);
    }
  }

  async function startBatch() {
    const ids = [...selected].filter((id) => DEMO_CASES[id].expect === "approve");
    if (!ids.length) return;
    setLoading("batch");
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch: true, case_ids: ids }),
      });
      const data = await res.json();
      router.push(`/batch/${data.batch_id}`);
    } catch {
      setLoading(null);
    }
  }

  const approveCases = LIVE_BATCH_IDS.map((id) => DEMO_CASES[id]);

  return (
    <AppShell title="New prior authorization">
      <p className="-mt-2 mb-6 text-base text-[#5b6470]">
        Select patients for the live demo. Each has chart + prescription PDFs. Run
        one or launch all in parallel — separate agents, forms, and receipts.
      </p>

      <section className="grid gap-3 sm:grid-cols-2">
        {approveCases.map((c) => (
          <div
            key={c.id}
            className={`rounded-xl border border-l-4 bg-white p-4 shadow-sm ${ACCENT[c.accent]}`}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selected.has(c.id)}
                onChange={() => toggle(c.id)}
                className="mt-1 h-4 w-4 rounded border-slate-300"
              />
              <div className="min-w-0 flex-1">
                <p className="font-serif text-lg font-semibold text-[#0f1419]">
                  {c.title}
                </p>
                <p className="text-sm text-[#5b6470]">{c.blurb}</p>
                <p className="mt-1 font-mono text-xs text-slate-400">
                  {c.pdfs.chart} · {c.pdfs.prescription}
                </p>
              </div>
              <button
                type="button"
                disabled={!!loading}
                onClick={() => startOne(c.id)}
                className="shrink-0 text-xs font-semibold text-[#b8410e] hover:underline disabled:opacity-50"
              >
                {loading === c.id ? "…" : "Run →"}
              </button>
            </div>
          </div>
        ))}
      </section>

      <div className="mt-6 rounded-xl border border-[#fde9d9] bg-[#fff7f0] p-5">
        <p className="font-serif text-lg font-semibold text-[#0f1419]">
          Live demo — run {selected.size} patient{selected.size !== 1 ? "s" : ""} in
          parallel
        </p>
        <p className="mt-1 text-sm text-[#5b6470]">
          One agent per patient. Watch all forms fill on the batch page.
        </p>
        <button
          type="button"
          disabled={!!loading || selected.size === 0}
          onClick={startBatch}
          className="mt-4 rounded-lg bg-[#b8410e] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#9a360c] disabled:opacity-50"
        >
          {loading === "batch"
            ? "Starting agents…"
            : `Run ${selected.size} patients in parallel`}
        </button>
      </div>

      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <strong>Safety demo:</strong>{" "}
        <button
          type="button"
          className="font-semibold underline"
          disabled={!!loading}
          onClick={() => startOne("maria-overshare")}
        >
          Maria Santos
        </button>{" "}
        — Opsera blocks SSN in notes (no submission).
      </div>
    </AppShell>
  );
}
