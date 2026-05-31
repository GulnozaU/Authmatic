"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DEMO_FILES } from "@/lib/demo-case";

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [chart, setChart] = useState<File | null>(null);
  const [rx, setRx] = useState<File | null>(null);

  async function startRun(demo: boolean) {
    setLoading(true);
    try {
      let res: Response;
      if (demo) {
        res = await fetch("/api/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ demo: true }),
        });
      } else {
        const fd = new FormData();
        if (chart) fd.append("chart", chart);
        if (rx) fd.append("prescription", rx);
        res = await fetch("/api/run", { method: "POST", body: fd });
      }
      const data = await res.json();
      router.push(`/run/${data.run_id}`);
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-hf-blue">
              Authmatic
            </p>
            <h1 className="text-xl font-semibold text-hf-navy">Prior Authorization</h1>
          </div>
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
            Demo ready
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-lg text-slate-600">
          Drop patient documents. The agent extracts data, fills the insurer form, and
          submits — with a full audit trail.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <label className="flex cursor-pointer flex-col rounded-xl border-2 border-dashed border-slate-300 bg-white p-6 hover:border-hf-blue">
            <span className="text-sm font-medium text-slate-700">Patient chart PDF</span>
            <span className="mt-1 text-xs text-slate-400">
              {chart ? chart.name : "Click or drag"}
            </span>
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => setChart(e.target.files?.[0] ?? null)}
            />
          </label>
          <label className="flex cursor-pointer flex-col rounded-xl border-2 border-dashed border-slate-300 bg-white p-6 hover:border-hf-blue">
            <span className="text-sm font-medium text-slate-700">Prescription PDF</span>
            <span className="mt-1 text-xs text-slate-400">
              {rx ? rx.name : "Click or drag"}
            </span>
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => setRx(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={loading}
            onClick={() => startRun(true)}
            className="flex-1 rounded-lg bg-hf-navy py-3 text-sm font-semibold text-white hover:bg-hf-blue disabled:opacity-50"
          >
            {loading ? "Starting…" : "Run demo — Sarah Martinez / Ozempic"}
          </button>
          <button
            type="button"
            disabled={loading || !chart || !rx}
            onClick={() => startRun(false)}
            className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            Upload & run
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          Demo files:{" "}
          <a href={DEMO_FILES.chart} className="underline">
            chart
          </a>
          {" · "}
          <a href={DEMO_FILES.prescription} className="underline">
            prescription
          </a>
        </p>
      </main>
    </div>
  );
}
