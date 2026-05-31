"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DEMO_CASES, type DemoCaseId } from "@/lib/demo-cases";

const CASE_ORDER: DemoCaseId[] = ["sarah-martinez", "james-wilson", "maria-overshare"];

const ACCENT: Record<string, string> = {
  green: "border-l-[#1f6b3e] hover:border-[#1f6b3e]",
  blue: "border-l-[#2563eb] hover:border-[#2563eb]",
  amber: "border-l-amber-500 hover:border-amber-500",
};

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function startCase(caseId: DemoCaseId) {
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
    setLoading("batch");
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batch: true,
          case_ids: ["sarah-martinez", "james-wilson"],
        }),
      });
      const data = await res.json();
      router.push(`/batch/${data.batch_id}`);
    } catch {
      setLoading(null);
    }
  }

  return (
    <AppShell title="New prior authorization">
      <p className="-mt-2 mb-6 text-base text-[#5b6470]">
        Pick a demo patient or run two in parallel. Each agent extracts data, fills the
        HealthFirst PA form, and returns a submission receipt.
      </p>

      <section className="grid gap-4 sm:grid-cols-3">
        {CASE_ORDER.map((id) => {
          const c = DEMO_CASES[id];
          return (
            <button
              key={id}
              type="button"
              disabled={!!loading}
              onClick={() => startCase(id)}
              className={`rounded-xl border border-l-4 bg-white p-5 text-left shadow-sm transition hover:shadow-md disabled:opacity-50 ${ACCENT[c.accent]}`}
            >
              <p className="text-xs font-bold uppercase tracking-widest text-[#5b6470]">
                {c.title}
              </p>
              <p className="mt-2 font-serif text-lg font-semibold text-[#0f1419]">
                {c.payload.patient_name}
              </p>
              <p className="mt-1 text-sm text-[#5b6470]">
                {c.payload.medication} · {c.payer}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-[#5b6470]">{c.blurb}</p>
              <p className="mt-3 text-xs font-semibold text-[#b8410e]">
                {loading === id ? "Starting…" : "Run agent →"}
              </p>
            </button>
          );
        })}
      </section>

      <div className="mt-6 rounded-xl border border-[#fde9d9] bg-[#fff7f0] p-5">
        <p className="font-serif text-lg font-semibold text-[#0f1419]">
          Run multiple patients in parallel
        </p>
        <p className="mt-1 text-sm text-[#5b6470]">
          Sarah Martinez + James Wilson at the same time — two agents, two forms, two receipts.
        </p>
        <button
          type="button"
          disabled={!!loading}
          onClick={startBatch}
          className="mt-4 rounded-lg bg-[#b8410e] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#9a360c] disabled:opacity-50"
        >
          {loading === "batch" ? "Starting batch…" : "Run batch (2 patients)"}
        </button>
      </div>
    </AppShell>
  );
}
