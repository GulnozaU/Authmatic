import { getRun } from "@/lib/agent-runs";
import { defaultPayload, runAgentPipeline } from "@/lib/agent-orchestrator";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = getRun(id);
  const formPayload = existing?.form_payload ?? defaultPayload();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      send({ type: "connected", run_id: id });

      await runAgentPipeline(id, formPayload, send);

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
