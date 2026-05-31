import { NextRequest } from "next/server";
import { defaultPayload, isPipelineRunning, runAgentPipeline } from "@/lib/agent-orchestrator";
import { getRun } from "@/lib/agent-runs";

const AGENT_BASE_URL = process.env.AGENT_BASE_URL ?? "http://localhost:8000";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const local = getRun(id);

  // In-process demo runs (Gulnoza stack)
  if (local || req.nextUrl.searchParams.get("engine") === "inprocess") {
    const formPayload = local?.form_payload ?? defaultPayload(local?.case_id);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let closed = false;
        const send = (data: Record<string, unknown>) => {
          if (closed) return;
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          } catch {
            closed = true;
          }
        };

        send({ type: "connected", run_id: id });

        if (!isPipelineRunning(id)) {
          void runAgentPipeline(id, formPayload, send, { caseId: local?.case_id as never });
        }

        let lastStepCount = 0;
        let lastStatus = "";
        let portalSent = false;

        while (!closed) {
          const run = getRun(id);
          if (run) {
            if (run.steps.length > lastStepCount) {
              for (let i = lastStepCount; i < run.steps.length; i++) {
                send({ type: "step", step: run.steps[i], run });
              }
              lastStepCount = run.steps.length;
            }
            if (run.portal_url && !portalSent) {
              portalSent = true;
              send({ type: "portal", path: run.portal_url, run });
            }
            if (run.status !== lastStatus) {
              lastStatus = run.status;
              if (run.status === "completed") {
                send({ type: "done", run });
                break;
              }
              if (run.status === "error") {
                send({ type: "error", message: run.error ?? "Run failed", run });
                break;
              }
            }
          }
          if (!isPipelineRunning(id) && run && run.status !== "running") break;
          await new Promise((r) => setTimeout(r, 300));
        }

        closed = true;
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  // FastAPI agent (Subhendu's stack)
  const upstream = await fetch(`${AGENT_BASE_URL}/api/stream/${id}`, {
    headers: { accept: "text/event-stream" },
  });

  if (!upstream.body) {
    return new Response("upstream has no body", { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
    },
  });
}
