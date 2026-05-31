import { adjudicateReference } from "./adjudication";
import { getDemoFormPayload } from "./demo-case";
import type { PaFormPayload } from "./pa-types";
import {
  appendStep,
  createRun,
  getRun,
  updateRun,
  updateStep,
  type AgentStep,
} from "./agent-runs";
import { createSubmission } from "./submissions";

function baseUrl() {
  if (process.env.WEB_URL?.trim()) return process.env.WEB_URL.trim();
  if (process.env.VERCEL_URL?.trim()) {
    return `https://${process.env.VERCEL_URL.trim()}`;
  }
  return "http://localhost:3000";
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function emitStep(
  runId: string,
  step: Omit<AgentStep, "status"> & { status?: AgentStep["status"] },
  onEvent: (data: Record<string, unknown>) => void,
  minMs = 1200
) {
  const started = Date.now();
  const full: AgentStep = { ...step, status: step.status ?? "running" };
  appendStep(runId, full);
  onEvent({ type: "step", step: full, run: getRun(runId) });

  await sleep(minMs);

  const duration_ms = Date.now() - started;
  updateStep(runId, step.step_no, { status: "done", duration_ms });
  onEvent({
    type: "step",
    step: { ...full, status: "done", duration_ms },
    run: getRun(runId),
  });
}

export async function runAgentPipeline(
  runId: string,
  formPayload: PaFormPayload,
  onEvent: (data: Record<string, unknown>) => void
) {
  createRun(runId, formPayload);

  try {
    await emitStep(
      runId,
      {
        step_no: 1,
        verb: "EXTRACT",
        sponsor: "Daytona",
        plan: "Parse patient chart and prescription PDFs; extract diagnosis, drug, and member ID.",
        tool_input: { patient: "Sarah Martinez", files: 2 },
        tool_output: formPayload as unknown as Record<string, unknown>,
      },
      onEvent,
      1800
    );

    await emitStep(
      runId,
      {
        step_no: 2,
        verb: "VERIFY",
        sponsor: "Opsera",
        plan: "Scan outgoing packet for PHI over-disclosure before payer submit.",
        tool_output: { passed: true, flagged_fields: [] },
      },
      onEvent,
      1400
    );

    const portalPath = `/portal/healthfirst/prior-auth?autofill=1&run=${runId}`;
    updateRun(runId, { portal_url: portalPath });
    onEvent({ type: "portal", path: portalPath, run: getRun(runId) });

    await emitStep(
      runId,
      {
        step_no: 3,
        verb: "SUBMIT",
        sponsor: "Rtrvr",
        plan: "Open HealthFirst provider portal, fill prior-auth form, and submit.",
        tool_input: { portal_path: portalPath, fields: formPayload },
      },
      onEvent,
      2500
    );

    const submission = await createSubmission(formPayload);
    const receipt_url = `${baseUrl()}/portal/healthfirst/submission/${submission.reference_id}`;

    updateStep(runId, 3, {
      tool_output: {
        reference_id: submission.reference_id,
        status: submission.status,
        receipt_url,
      },
    });
    updateRun(runId, {
      reference_id: submission.reference_id,
      receipt_url,
    });
    onEvent({ type: "step", step: getRun(runId)!.steps[2], run: getRun(runId) });

    await emitStep(
      runId,
      {
        step_no: 4,
        verb: "ADJUDICATE",
        sponsor: "HealthFirst",
        plan: "Payer medical review queue — step therapy and formulary check.",
        tool_input: { reference_id: submission.reference_id },
      },
      onEvent,
      1500
    );

    const reviewMs = 4000;
    await adjudicateReference(submission.reference_id, reviewMs);

    updateStep(runId, 4, {
      tool_output: {
        reference_id: submission.reference_id,
        status: "approved",
        review_delay_ms: reviewMs,
      },
    });

    await emitStep(
      runId,
      {
        step_no: 5,
        verb: "PERSIST",
        sponsor: "InsForge + Tigris",
        plan: "Store workflow in InsForge; PDFs and receipt in Tigris.",
        tool_output: {
          insforge: "pa_submissions, prior_auths, agent_events",
          tigris: "authmatic-demo",
          reference_id: submission.reference_id,
        },
      },
      onEvent,
      900
    );

    updateRun(runId, { status: "completed" });
    onEvent({ type: "done", run: getRun(runId) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Agent run failed";
    updateRun(runId, { status: "error", error: message });
    onEvent({ type: "error", message, run: getRun(runId) });
  }
}

export function defaultPayload(): PaFormPayload {
  return getDemoFormPayload();
}
