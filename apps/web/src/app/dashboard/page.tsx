"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/components/AuthProvider";

type DashboardData = {
  stats: {
    total_submissions: number;
    approved: number;
    pending: number;
    agent_runs_today: number;
    opsera_pass_rate: number;
  };
  submissions: Array<{
    reference_id: string;
    patient_name: string;
    medication: string;
    status: string;
    submitted_at: string;
  }>;
  recent_runs: Array<{
    id: string;
    status: string;
    patient_name: string;
    medication: string;
    reference_id?: string;
    created_at: string;
    receipt_url?: string;
  }>;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  const stats = data?.stats;

  return (
    <AppShell title={`Welcome, ${user?.name?.split(",")[0] ?? "team"}`}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Submissions" value={stats?.total_submissions ?? "—"} />
        <StatCard label="Approved" value={stats?.approved ?? "—"} accent="green" />
        <StatCard label="Pending review" value={stats?.pending ?? "—"} accent="amber" />
        <StatCard
          label="Opsera pass rate"
          value={stats ? `${stats.opsera_pass_rate}%` : "—"}
          accent="accent"
        />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/"
          className="rounded-lg bg-[#b8410e] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#9a360c]"
        >
          + New prior auth
        </Link>
        <Link
          href="/security"
          className="rounded-lg border border-[#e4e7eb] bg-white px-5 py-2.5 text-sm font-medium text-[#0f1419] hover:bg-slate-50"
        >
          Security log
        </Link>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section className="rounded-xl border border-[#e4e7eb] bg-white p-5 shadow-sm">
          <h2 className="font-serif text-xl font-semibold text-[#0f1419]">Recent agent runs</h2>
          <ul className="mt-4 space-y-3">
            {(data?.recent_runs.length ? data.recent_runs : []).map((run) => (
              <li key={run.id} className="flex items-center justify-between border-b border-[#e4e7eb] pb-3 last:border-0">
                <div>
                  <p className="text-sm font-medium text-[#0f1419]">
                    {run.patient_name} · {run.medication}
                  </p>
                  <p className="text-xs text-[#5b6470]">
                    {run.status}
                    {run.reference_id ? ` · ${run.reference_id}` : ""}
                  </p>
                </div>
                <Link
                  href={`/run/${run.id}`}
                  className="text-xs font-semibold text-[#b8410e] hover:underline"
                >
                  Audit →
                </Link>
              </li>
            ))}
            {!data?.recent_runs.length && (
              <p className="text-sm text-[#5b6470]">
                No runs yet. Start a demo from{" "}
                <Link href="/" className="text-[#b8410e] underline">
                  New PA
                </Link>
                .
              </p>
            )}
          </ul>
        </section>

        <section className="rounded-xl border border-[#e4e7eb] bg-white p-5 shadow-sm">
          <h2 className="font-serif text-xl font-semibold text-[#0f1419]">PA submissions</h2>
          <ul className="mt-4 space-y-3">
            {(data?.submissions ?? []).slice(0, 6).map((s) => (
              <li key={s.reference_id} className="flex items-center justify-between text-sm">
                <div>
                  <Link
                    href={`/portal/healthfirst/submission/${s.reference_id}`}
                    className="font-medium text-[#0f1419] hover:text-[#b8410e] hover:underline"
                  >
                    {s.reference_id}
                  </Link>
                  <p className="text-xs text-[#5b6470]">
                    {s.patient_name} · {s.medication}
                  </p>
                </div>
                <Link
                  href={`/portal/healthfirst/submission/${s.reference_id}`}
                  className={`rounded-full px-2 py-0.5 text-xs font-medium hover:opacity-80 ${
                    s.status === "approved"
                      ? "bg-[#e6f1ea] text-[#1f6b3e]"
                      : "bg-amber-50 text-amber-800"
                  }`}
                >
                  {s.status.replace("_", " ")} →
                </Link>
              </li>
            ))}
            {!data?.submissions.length && (
              <p className="text-sm text-[#5b6470]">Submissions appear after agent submit step.</p>
            )}
          </ul>
        </section>
      </div>

      <section className="mt-8 rounded-xl border border-[#e6f1ea] bg-[#e6f1ea] p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-[#1f6b3e]">
          Sponsor stack active
        </p>
        <p className="mt-2 text-sm text-[#1f6b3e]">
          Daytona extract · Opsera VERIFY · Rtrvr submit · InsForge + Tigris persist
        </p>
      </section>
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: "green" | "amber" | "accent";
}) {
  const ring =
    accent === "green"
      ? "border-[#b9d6c2]"
      : accent === "amber"
        ? "border-amber-200"
        : accent === "accent"
          ? "border-[#fde9d9]"
          : "border-[#e4e7eb]";

  return (
    <div className={`rounded-xl border bg-white p-4 shadow-sm ${ring}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#5b6470]">{label}</p>
      <p className="mt-1 font-serif text-3xl font-semibold text-[#0f1419]">{value}</p>
    </div>
  );
}
