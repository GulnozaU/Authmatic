"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";

type SecurityEvent = {
  id: string;
  at: string;
  type: string;
  severity: "info" | "warn" | "success";
  summary: string;
  detail?: string;
  run_id?: string;
};

const TYPE_LABEL: Record<string, string> = {
  opsera_verify: "Opsera VERIFY",
  phi_block: "PHI block",
  login: "Sign-in",
  tigris_persist: "Tigris",
};

export default function SecurityPage() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);

  useEffect(() => {
    fetch("/api/security-log")
      .then((r) => r.json())
      .then((d) => setEvents(d.events ?? []))
      .catch(() => setEvents([]));
  }, []);

  return (
    <AppShell title="Security & compliance log">
      <p className="-mt-4 mb-6 max-w-2xl text-sm text-[#5b6470]">
        Opsera MCP scans, PHI scope checks, and artifact persistence — every action
        auditable for HIPAA review.
      </p>

      <div className="overflow-hidden rounded-xl border border-[#e4e7eb] bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#e4e7eb] bg-[#fafaf7] text-xs uppercase tracking-wide text-[#5b6470]">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Run</th>
            </tr>
          </thead>
          <tbody>
            {events.map((ev) => (
              <tr key={ev.id} className="border-b border-[#e4e7eb] last:border-0">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-[#5b6470]">
                  {new Date(ev.at).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                      ev.severity === "success"
                        ? "bg-[#e6f1ea] text-[#1f6b3e]"
                        : ev.severity === "warn"
                          ? "bg-amber-50 text-amber-800"
                          : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {TYPE_LABEL[ev.type] ?? ev.type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-[#0f1419]">{ev.summary}</p>
                  {ev.detail && (
                    <p className="text-xs text-[#5b6470]">{ev.detail}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  {ev.run_id ? (
                    <Link
                      href={`/run/${ev.run_id}`}
                      className="font-mono text-xs text-[#b8410e] hover:underline"
                    >
                      {ev.run_id.slice(0, 8)}…
                    </Link>
                  ) : (
                    <span className="text-[#5b6470]">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!events.length && (
          <p className="p-8 text-center text-sm text-[#5b6470]">
            Run a prior auth to populate Opsera verify events.
          </p>
        )}
      </div>
    </AppShell>
  );
}
