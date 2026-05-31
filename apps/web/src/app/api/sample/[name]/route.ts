// POST /api/sample/[name] — kick off a run using a committed fixture PDF
// rather than a file the user uploaded. Powers the "Try X" tiles on the
// landing page so a remote viewer (or judge over ngrok) can drive the
// whole flow in one click without finding a file.

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const AGENT_BASE_URL = process.env.AGENT_BASE_URL ?? 'http://localhost:8000';

// Resolved at runtime, relative to where `next dev` / `next start` runs from
// (apps/web/). The fixtures live two directories up.
const FIXTURES_DIR = path.resolve(process.cwd(), '..', '..', 'assets', 'fixtures');

// Hardcoded allowlist — we only proxy the curated demo PDFs, never
// arbitrary filenames. Protects against `..` traversal too.
const ALLOWED = new Set([
  'rx-lisinopril.pdf',
  'rx-metformin.pdf',
  'rx-ozempic-martinez.pdf',
  'rx-humira-thompson.pdf',
  'rx-overshare-demo.pdf',
]);

export async function POST(
  _req: NextRequest,
  { params }: { params: { name: string } },
) {
  if (!ALLOWED.has(params.name)) {
    return NextResponse.json(
      { error: `Unknown sample: ${params.name}` },
      { status: 404 },
    );
  }

  let pdfBytes: Buffer;
  try {
    pdfBytes = await fs.readFile(path.join(FIXTURES_DIR, params.name));
  } catch (e) {
    return NextResponse.json(
      { error: `Sample not found on disk: ${params.name}` },
      { status: 500 },
    );
  }

  const form = new FormData();
  form.append(
    'pdf',
    new Blob([pdfBytes], { type: 'application/pdf' }),
    params.name,
  );

  const r = await fetch(`${AGENT_BASE_URL}/api/run`, {
    method: 'POST',
    body: form,
  });

  if (!r.ok) {
    return NextResponse.json(
      { error: `Agent rejected sample: ${r.status}` },
      { status: r.status },
    );
  }

  return NextResponse.json(await r.json());
}
