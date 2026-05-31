import type { PaStatus } from "@/lib/pa-types";
import { STATUS_LABELS } from "@/lib/pa-types";

const STEPS: { key: PaStatus | "submitted"; label: string }[] = [
  { key: "submitted", label: "Submitted" },
  { key: "pending_review", label: "Pending Review" },
  { key: "under_review", label: "Medical Review" },
  { key: "approved", label: "Decision" },
];

function stepIndex(status: PaStatus): number {
  switch (status) {
    case "pending_review":
      return 1;
    case "under_review":
      return 2;
    case "approved":
    case "denied":
    case "needs_info":
      return 3;
    default:
      return 0;
  }
}

export function StatusTimeline({
  status,
  submittedAt,
  decidedAt,
}: {
  status: PaStatus;
  submittedAt: string;
  decidedAt?: string;
}) {
  const active = stepIndex(status);
  const isDenied = status === "denied";
  const finalLabel = isDenied ? "Denied" : status === "approved" ? "Approved" : "Decision";

  return (
    <ol className="space-y-0">
      {STEPS.map((step, i) => {
        const done = i <= active;
        const current = i === active && status !== "approved" && status !== "denied";
        const label = i === 3 && (status === "approved" || status === "denied") ? finalLabel : step.label;

        return (
          <li key={step.key} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  isDenied && i === 3
                    ? "bg-red-100 text-red-800 ring-2 ring-red-500"
                    : done
                      ? "bg-hf-navy text-white"
                      : "bg-slate-200 text-slate-500"
                } ${current ? "ring-2 ring-hf-blue ring-offset-2" : ""}`}
              >
                {done ? "✓" : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`my-1 h-10 w-0.5 ${done ? "bg-hf-navy" : "bg-slate-200"}`} />
              )}
            </div>
            <div className="pb-8 pt-1">
              <p className={`font-medium ${done ? "text-hf-navy" : "text-slate-400"}`}>{label}</p>
              {i === 0 && (
                <p className="text-xs text-slate-500">
                  {new Date(submittedAt).toLocaleString()}
                </p>
              )}
              {i === 3 && decidedAt && (
                <p className="text-xs text-slate-500">{new Date(decidedAt).toLocaleString()}</p>
              )}
              {current && (
                <p className="mt-1 text-sm text-hf-amber">{STATUS_LABELS[status]}…</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
