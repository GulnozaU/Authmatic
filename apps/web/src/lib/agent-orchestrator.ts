import { adjudicateReference } from "./adjudication";
import {
  appendStep,
  createRun,
  getRun,
  updateRun,
  updateStep,
  type AgentStep,
} from "./agent-runs";
import { createSubmission } from "./submissions";
import { extractWithDaytona } from "./sponsors/daytona-extract";
import { verifyWithOpsera } from "./sponsors/opsera-verify";
import { submitWithRtrvr, type RtrvrResult } from "./sponsors/rtrvr-submit";
import {
  persistRunArtifacts,
  uploadRunPdfs,
  type RunTigrisArtifacts,
} from "./tigris/persist-run";
import { getDemoFormPayload, submissionPath, type DemoCaseId } from "./demo-cases";
import type { PaFormPayload } from "./pa-types";

const pipelines = new Set<string>();

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

export function isPipelineRunning(id: string): boolean {
  return pipelines.has(id);
}

export async function runAgentPipeline(
  runId: string,
  _initialPayload: PaFormPayload,
  onEvent: (data: Record<string, unknown>) => void,
  options?: { caseId?: DemoCaseId }
) {
  if (pipelines.has(runId)) return;
  pipelines.add(runId);

  const caseId = options?.caseId;
  const existing = getRun(runId);
  if (!existing) {
    createRun(runId, _initialPayload, caseId);
  } else if (caseId && !existing.case_id) {
    updateRun(runId, { case_id: caseId });
  }

  onEvent({ type: "progress", message: "Agent starting…", run: getRun(runId) });

  try {
    let tigrisArtifacts: RunTigrisArtifacts | null = null;
    const tigrisPromise = uploadRunPdfs(runId).catch(() => null);

    const extracted = await extractWithDaytona(caseId);
    const formPayload = extracted.payload;
    updateRun(runId, { form_payload: formPayload });

    tigrisArtifacts = await tigrisPromise;

    const extractOutput: Record<string, unknown> = {
      ...formPayload,
      _extract: extracted.meta,
    };
    if (tigrisArtifacts) {
      extractOutput.tigris = {
        bucket: tigrisArtifacts.bucket,
        chart: tigrisArtifacts.chart,
        prescription: tigrisArtifacts.prescription,
      };
      updateRun(runId, { tigris_artifacts: tigrisArtifacts });
    }

    await emitStep(
      runId,
      {
        step_no: 1,
        verb: "EXTRACT",
        sponsor: "Daytona",
        plan: "Parse patient chart and prescription PDFs in Daytona sandbox; extract payer fields.",
        tool_input: { patient: formPayload.patient_name, files: 2 },
        tool_output: extractOutput,
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
        plan: "Opsera MCP security scan + PHI scope check before payer submit.",
        tool_input: { fields: Object.keys(formPayload) },
      },
      onEvent,
      600
    );

    const verify = await verifyWithOpsera(formPayload);
    updateStep(runId, 2, { tool_output: verify });
    onEvent({ type: "step", step: getRun(runId)!.steps[1], run: getRun(runId) });

    if (!verify.passed) {
      throw new Error(
        `Opsera compliance failed: ${verify.flagged_fields.join("; ") || verify.notes}`
      );
    }

    const portalPath = `/portal/healthfirst/prior-auth?autofill=1&run=${runId}${caseId ? `&case=${caseId}` : ""}`;
    updateRun(runId, { portal_url: portalPath });
    onEvent({ type: "portal", path: portalPath, run: getRun(runId) });

    const rtrvrPromise = submitWithRtrvr(formPayload).catch((err) => ({
      used: false as const,
      mode: "portal_autofill" as const,
      error: err instanceof Error ? err.message : "Rtrvr skipped",
    }));

    await emitStep(
      runId,
      {
        step_no: 3,
        verb: "SUBMIT",
        sponsor: "Rtrvr",
        plan: "Rtrvr Agent API fills HealthFirst portal; iframe shows live autofill.",
        tool_input: { portal_path: portalPath, fields: formPayload },
      },
      onEvent,
      1200
    );

    const rtrvr = await Promise.race<RtrvrResult>([
      rtrvrPromise,
      new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              used: false,
              mode: "portal_autofill",
              error: "Rtrvr timeout — iframe autofill",
            }),
          8000
        )
      ),
    ]);
    const submission = await createSubmission(formPayload);
    const receipt_url = submissionPath(submission.reference_id);
    const receipt_absolute = `${baseUrl()}${receipt_url}`;

    updateStep(runId, 3, {
      tool_output: {
        reference_id: rtrvr.reference_id ?? submission.reference_id,
        status: submission.status,
        receipt_url,
        rtrvr,
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

    const reviewMs = 2000;
    await adjudicateReference(submission.reference_id, reviewMs);

    updateStep(runId, 4, {
      tool_output: {
        reference_id: submission.reference_id,
        status: "approved",
        review_delay_ms: reviewMs,
      },
    });

    const runBeforePersist = getRun(runId)!;
    const baseArtifacts: RunTigrisArtifacts = runBeforePersist.tigris_artifacts ?? {
      bucket: process.env.TIGRIS_BUCKET ?? "authmatic-demo",
    };

    let persistOutput: Record<string, unknown> = {
      insforge: "pa_submissions (submit step)",
      tigris_bucket: baseArtifacts.bucket,
      reference_id: submission.reference_id,
    };

    try {
      const { insforge_updated, artifacts } = await persistRunArtifacts(runId, {
        reference_id: submission.reference_id,
        receipt_url: receipt_absolute,
        form_payload: formPayload,
        artifacts: baseArtifacts,
        status: "approved",
      });
      updateRun(runId, { tigris_artifacts: artifacts });
      persistOutput = {
        insforge: insforge_updated
          ? "prior_auths + pa_submissions"
          : "pa_submissions (submit step)",
        tigris_bucket: artifacts.bucket,
        chart: artifacts.chart,
        prescription: artifacts.prescription,
        receipt: artifacts.receipt,
        reference_id: submission.reference_id,
      };
    } catch (err) {
      console.error("[persist] failed:", err);
    }

    await emitStep(
      runId,
      {
        step_no: 5,
        verb: "PERSIST",
        sponsor: "InsForge + Tigris",
        plan: "Store workflow in InsForge; PDFs and receipt in Tigris.",
        tool_output: persistOutput,
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
  } finally {
    pipelines.delete(runId);
  }
}

export function defaultPayload(caseId?: DemoCaseId): PaFormPayload {
  return getDemoFormPayload(caseId);
}
