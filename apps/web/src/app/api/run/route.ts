import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { defaultPayload } from "@/lib/agent-orchestrator";
import { createRun } from "@/lib/agent-runs";

export async function POST(request: Request) {
  const runId = randomUUID();
  const contentType = request.headers.get("content-type") ?? "";

  let demo = true;
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    demo = form.get("demo") === "true" || !form.get("chart");
  } else if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    demo = body.demo !== false;
  }

  const form_payload = defaultPayload();
  createRun(runId, form_payload);

  return NextResponse.json({
    run_id: runId,
    demo,
    message: demo
      ? "Demo run started with Sarah Martinez / Ozempic"
      : "Run started",
  });
}
