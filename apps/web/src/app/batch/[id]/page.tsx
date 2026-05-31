"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { submissionPath } from "@/lib/demo-cases";

type BatchRunRow = {
  id: string;
  case_id?: string;
  title: string;
  patient_name: string;
  medication: string;
  status: string;
  reference_id?: string;
  receipt_url?: string;
  error?: string;
};

type BatchData = {
  batch: { id: string; created_at: string };
  runs: BatchRunRow[];
  completed: number;
  failed: number;
  total: number;
  done: boolean;
};

export default function BatchPage() {
  const params = useParams();
  const batchId = String(params.id ?? "");
  const [data, setData] = useState<BatchData | null>(null);

  useEffect(() => {
    if (!batchId) return;

    let active = true;

    async function poll() {
      try {
        const res = await fetch(`/api/batch/${batchId}`);
        if (!res.ok) return;
        const json = (await res.json()) as BatchData;
        if (active) setData(json);
      } catch {
        /* retry */
      }
    }

    poll();
    const id = setInterval(poll, 1500);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [batchId]);

  return (
    <AppShell title="Batch agent run">
      <p className="-mt-4 mb-6 font-mono text-xs text-slate-400">{batchId}</p>

      {data && (
        <>
          <div className="mb-6 flex flex-wrap gap-4 text-sm">
            <span className="rounded-full bg-green-100 px-3 py-1 text-green-800">
              {data.completed} completed
            </span>
            {data.failed > 0 && (
              <span className="rounded-full bg-red-100 px-3 py-1 text-red-800">
                {data.failed} failed
              </span>
            )}
            <span className="text-slate-500">
              {data.completed + data.failed} / {data.total} done
            </span>
          </div>

          <ul className="space-y-4">
            {data.runs.map((run) => (
              <li
                key={run.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-[#b8410e]">
                      {run.title}
                    </p>
                    <p className="mt-1 font-serif text-lg font-semibold text-[#0f1419]">
                      {run.patient_name} · {run.medication}
                    </p>
                    <p className="mt-1 text-sm capitalize text-slate-500">{run.status}</p>
                    {run.error && (
                      <p className="mt-2 text-sm text-red-700">{run.error}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Link
                      href={`/run/${run.id}`}
                      className="text-sm font-semibold text-[#b8410e] hover:underline"
                    >
                      Audit →
                    </Link>
                    {run.reference_id && (
                      <Link
                        href={run.receipt_url ?? submissionPath(run.reference_id)}
                        className="text-sm text-green-700 hover:underline"
                      >
                        View submission →
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {!data && (
        <p className="text-slate-500">Loading batch status…</p>
      )}
    </AppShell>
  );
}
