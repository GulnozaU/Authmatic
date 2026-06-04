import { NextResponse } from "next/server";
import { listRuns } from "@/lib/agent-runs";
import { listSubmissions } from "@/lib/submissions";

export async function GET() {
  const submissions = await listSubmissions(15);
  const runs = listRuns(10);

  const approved = submissions.filter((s) => s.status === "approved").length;
  const pending = submissions.filter(
    (s) => s.status === "pending_review" || s.status === "under_review"
  ).length;

  return NextResponse.json({
    stats: {
      total_submissions: submissions.length,
      approved,
      pending,
      agent_runs_today: runs.length,
      opsera_pass_rate: runs.length
        ? Math.round(
            (runs.filter((r) =>
              r.steps.some(
                (s) => s.verb === "VERIFY" && (s.tool_output as { passed?: boolean })?.passed
              )
            ).length /
              runs.length) *
              100
          )
        : 100,
    },
    submissions,
    recent_runs: runs.map((r) => ({
      id: r.id,
      status: r.status,
      patient_name: r.form_payload.patient_name,
      medication: r.form_payload.medication,
      reference_id: r.reference_id,
      created_at: r.created_at,
      receipt_url: r.receipt_url,
    })),
  });
}
