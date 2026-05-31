import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { defaultPayload, runAgentPipeline } from "@/lib/agent-orchestrator";
import { createRun } from "@/lib/agent-runs";
import { BATCH_DEMO_IDS, DEMO_CASES, getDemoCase, type DemoCaseId } from "@/lib/demo-cases";
import { createBatch } from "@/lib/batch-runs";

const AGENT_BASE_URL = process.env.AGENT_BASE_URL ?? "http://localhost:8000";

function parseCaseId(raw: unknown): DemoCaseId | undefined {
  if (typeof raw !== "string" || !(raw in DEMO_CASES)) return undefined;
  return raw as DemoCaseId;
}

function wantsInProcess(contentType: string, body?: Record<string, unknown>): boolean {
  if (process.env.USE_INPROCESS_AGENT === "true") return true;
  if (process.env.DEMO_FIXTURE_MODE === "true") return true;
  if (!contentType.includes("application/json")) return false;
  if (!body) return false;
  return body.demo === true || body.batch === true || Boolean(body.case_id);
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await req.json().catch(() => ({}))) as {
      demo?: boolean;
      case_id?: string;
      batch?: boolean;
      case_ids?: string[];
    };

    if (body.batch && Array.isArray(body.case_ids)) {
      return startBatch(body.case_ids);
    }

    if (wantsInProcess(contentType, body)) {
      return startInProcess(parseCaseId(body.case_id), body.demo !== false);
    }
  }

  // Default: forward PDF upload to FastAPI agent (Subhendu's stack)
  try {
    const inboundForm = await req.formData();
    const file = inboundForm.get("pdf");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing pdf field" }, { status: 400 });
    }

    const outboundForm = new FormData();
    outboundForm.append("pdf", file, file.name);

    const r = await fetch(`${AGENT_BASE_URL}/api/run`, {
      method: "POST",
      body: outboundForm,
    });

    if (!r.ok) {
      return NextResponse.json(
        { error: `Agent service rejected upload: ${r.status}` },
        { status: r.status }
      );
    }

    return NextResponse.json(await r.json());
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}

function startInProcess(caseId: DemoCaseId | undefined, demo: boolean) {
  const runId = randomUUID();
  const form_payload = defaultPayload(caseId);
  createRun(runId, form_payload, caseId);
  void runAgentPipeline(runId, form_payload, () => {}, { caseId });

  const demoCase = getDemoCase(caseId);
  return NextResponse.json({
    run_id: runId,
    case_id: caseId ?? "sarah-martinez",
    demo,
    engine: "inprocess",
    message: `Demo run started — ${demoCase.title}: ${demoCase.payload.patient_name}`,
  });
}

function startBatch(caseIds: string[]) {
  const batchId = randomUUID();
  const validIds = caseIds.filter((id) => id in DEMO_CASES) as DemoCaseId[];
  const ids = validIds.length ? validIds : BATCH_DEMO_IDS;
  const runIds = ids.map(() => randomUUID());

  ids.forEach((caseId, i) => {
    const runId = runIds[i];
    const form_payload = defaultPayload(caseId);
    createRun(runId, form_payload, caseId);
    void runAgentPipeline(runId, form_payload, () => {}, { caseId });
  });

  createBatch(batchId, ids, runIds);

  return NextResponse.json({
    batch_id: batchId,
    run_ids: runIds,
    case_ids: ids,
    engine: "inprocess",
    message: `Batch started — ${ids.length} patients in parallel`,
  });
}

export async function GET() {
  return NextResponse.json({
    cases: Object.values(DEMO_CASES).map((c) => ({
      id: c.id,
      title: c.title,
      blurb: c.blurb,
      patient: c.payload.patient_name,
      medication: c.payload.medication,
      expect: c.expect,
    })),
    batch_default: BATCH_DEMO_IDS,
  });
}
