// GET /api/stream/:id — proxies the agent's SSE stream to the browser.

import { NextRequest } from 'next/server';

const AGENT_BASE_URL = process.env.AGENT_BASE_URL ?? 'http://localhost:8000';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const upstream = await fetch(`${AGENT_BASE_URL}/api/stream/${params.id}`, {
    headers: { accept: 'text/event-stream' },
  });

  if (!upstream.body) {
    return new Response('upstream has no body', { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
    },
  });
}
