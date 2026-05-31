// POST /api/run — forward the PDF upload to the agent service.
// Returns { run_id } the client subscribes to via /api/stream/:id.

import { NextRequest, NextResponse } from 'next/server';

const AGENT_BASE_URL = process.env.AGENT_BASE_URL ?? 'http://localhost:8000';

export async function POST(req: NextRequest) {
  try {
    const inboundForm = await req.formData();
    const file = inboundForm.get('pdf');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing pdf field' }, { status: 400 });
    }

    const outboundForm = new FormData();
    outboundForm.append('pdf', file, file.name);

    const r = await fetch(`${AGENT_BASE_URL}/api/run`, {
      method: 'POST',
      body: outboundForm,
    });

    if (!r.ok) {
      return NextResponse.json(
        { error: `Agent service rejected upload: ${r.status}` },
        { status: r.status },
      );
    }

    return NextResponse.json(await r.json());
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
