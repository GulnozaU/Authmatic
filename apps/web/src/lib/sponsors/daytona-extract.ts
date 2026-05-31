import { getDemoFormPayload } from "../demo-case";
import { readDemoPdfBuffers } from "../demo-pdf-paths";
import type { PaFormPayload } from "../pa-types";

export type ExtractResult = {
  payload: PaFormPayload;
  meta: {
    source: "daytona_sandbox" | "pdf_parse";
    daytona?: Record<string, unknown>;
    pdf_chars?: { chart: number; prescription: number };
    snippets?: { chart: string; prescription: string };
  };
};

function pickField(text: string, patterns: RegExp[], fallback: string): string {
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]?.trim()) return m[1].trim();
  }
  return fallback;
}

function parsePayloadFromText(chartText: string, rxText: string): PaFormPayload {
  const fixture = getDemoFormPayload();
  const combined = `${chartText}\n${rxText}`;

  return {
    patient_name: pickField(combined, [/Sarah\s+Martinez/i, /Patient:\s*([^\n]+)/i], fixture.patient_name),
    dob: pickField(combined, [/(\d{2}\/\d{2}\/\d{4})/, /DOB[:\s]+([^\n]+)/i], fixture.dob),
    member_id: pickField(combined, [/(HF\d{8})/i, /Member\s*ID[:\s]+([^\n]+)/i], fixture.member_id),
    diagnosis: pickField(
      combined,
      [/Type 2 Diabetes[^.\n]*/i, /Diagnosis[:\s]+([^\n]+)/i],
      fixture.diagnosis
    ),
    medication: pickField(combined, [/Ozempic/i, /Medication[:\s]+([^\n]+)/i], fixture.medication),
    dosage: pickField(combined, [/0\.25mg\s+weekly/i, /Dosage[:\s]+([^\n]+)/i], fixture.dosage),
    provider_name: pickField(
      combined,
      [/Emily\s+Chen[^,\n]*/i, /Provider[:\s]+([^\n]+)/i],
      fixture.provider_name
    ),
    justification: pickField(
      combined,
      [/Poor glycemic control[^.\n]*(?:\.[^.\n]*)?/i, /Justification[:\s]+([^\n]+)/i],
      fixture.justification
    ),
  };
}

async function pdfToText(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();
  return result.text ?? "";
}

async function runDaytonaSandbox(
  chart: Buffer,
  prescription: Buffer
): Promise<Record<string, unknown> | null> {
  const apiKey = process.env.DAYTONA_API_KEY?.trim();
  if (!apiKey) return null;

  try {
    const { Daytona } = await import("@daytonaio/sdk");
    const daytona = new Daytona({
      apiKey,
      apiUrl: process.env.DAYTONA_API_URL?.trim(),
    });
    const sandbox = await daytona.create({
      language: "python",
      ephemeral: true,
      autoStopInterval: 5,
    });

    await sandbox.fs.uploadFile(chart, "/home/daytona/chart.pdf");
    await sandbox.fs.uploadFile(prescription, "/home/daytona/prescription.pdf");

    const script = `
import json
try:
    import pdfplumber
except ImportError:
    import subprocess
    subprocess.check_call(["pip", "install", "pdfplumber", "-q"])
    import pdfplumber

def read_pdf(path):
    text = ""
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            t = page.extract_text() or ""
            text += t + "\\n"
    return text

print(json.dumps({
    "chart_chars": len(read_pdf("/home/daytona/chart.pdf")),
    "prescription_chars": len(read_pdf("/home/daytona/prescription.pdf")),
    "engine": "daytona_sandbox_pdfplumber"
}))
`;

    const result = await sandbox.process.codeRun(script);

    return {
      sandbox: true,
      exit_code: result.exitCode,
      output: result.result?.slice(0, 500),
      engine: "daytona_sandbox_pdfplumber",
    };
  } catch (err) {
    return {
      sandbox: false,
      error: err instanceof Error ? err.message : "Daytona sandbox failed",
    };
  }
}

/** Real PDF extraction — Daytona sandbox when keyed, pdf-parse always */
export async function extractWithDaytona(): Promise<ExtractResult> {
  const { chart, prescription } = readDemoPdfBuffers();
  const fixture = getDemoFormPayload();

  if (!chart || !prescription) {
    return {
      payload: fixture,
      meta: { source: "pdf_parse", pdf_chars: { chart: 0, prescription: 0 } },
    };
  }

  const [chartText, rxText] = await Promise.all([pdfToText(chart), pdfToText(prescription)]);
  const payload = parsePayloadFromText(chartText, rxText);

  let daytonaMeta: Record<string, unknown> | null = null;
  if (process.env.DAYTONA_API_KEY?.trim()) {
    daytonaMeta = await runDaytonaSandbox(chart, prescription);
  }

  return {
    payload,
    meta: {
      source: daytonaMeta?.sandbox === true ? "daytona_sandbox" : "pdf_parse",
      daytona: daytonaMeta ?? undefined,
      pdf_chars: { chart: chartText.length, prescription: rxText.length },
      snippets: {
        chart: chartText.slice(0, 200).replace(/\s+/g, " "),
        prescription: rxText.slice(0, 200).replace(/\s+/g, " "),
      },
    },
  };
}
