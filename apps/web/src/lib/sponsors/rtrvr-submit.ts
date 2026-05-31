import type { PaFormPayload } from "../pa-types";

export type RtrvrResult = {
  used: boolean;
  mode: "rtrvr_api" | "portal_autofill";
  http_status?: number;
  reference_id?: string;
  response?: unknown;
  error?: string;
};

function portalUrl(): string {
  if (process.env.PORTAL_URL?.trim()) return process.env.PORTAL_URL.trim();
  const base =
    process.env.WEB_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return `${base.replace(/\/$/, "")}/portal/healthfirst/prior-auth`;
}

function parseReferenceId(text: string): string | undefined {
  const m = text.match(/PA-2026-\d{5}/i);
  return m?.[0]?.toUpperCase();
}

/** Call Rtrvr Agent API to fill + submit the HealthFirst portal */
export async function submitWithRtrvr(fields: PaFormPayload): Promise<RtrvrResult> {
  const apiKey = process.env.RTRVR_API_KEY?.trim();
  if (!apiKey) {
    return { used: false, mode: "portal_autofill" };
  }

  const url = portalUrl();
  const input = [
    "Fill the pharmacy prior authorization form and submit.",
    `Open ${url}`,
    `patient_name: ${fields.patient_name}`,
    `dob: ${fields.dob}`,
    `member_id: ${fields.member_id}`,
    `diagnosis: ${fields.diagnosis}`,
    `medication: ${fields.medication}`,
    `dosage: ${fields.dosage}`,
    `provider_name: ${fields.provider_name}`,
    `justification: ${fields.justification}`,
    "Use selectors #patient_name #dob #member_id #diagnosis #medication #dosage #provider_name #justification.",
    "Click #submit-prior-auth.",
    "Return the reference_id from the final URL (/portal/healthfirst/submission/PA-...).",
  ].join("\n");

  try {
    const res = await fetch("https://api.rtrvr.ai/agent", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input,
        urls: [url],
        response: { verbosity: "final" },
      }),
      signal: AbortSignal.timeout(12000),
    });

    const raw = await res.text();
    let parsed: unknown = raw;
    try {
      parsed = JSON.parse(raw);
    } catch {
      /* keep text */
    }

    const text = typeof parsed === "string" ? parsed : JSON.stringify(parsed);
    const reference_id = parseReferenceId(text);

    if (!res.ok) {
      return {
        used: true,
        mode: "rtrvr_api",
        http_status: res.status,
        error: text.slice(0, 300),
        response: parsed,
      };
    }

    return {
      used: true,
      mode: "rtrvr_api",
      http_status: res.status,
      reference_id,
      response: parsed,
    };
  } catch (err) {
    return {
      used: true,
      mode: "rtrvr_api",
      error: err instanceof Error ? err.message : "Rtrvr request failed",
    };
  }
}

export function isRtrvrConfigured(): boolean {
  return Boolean(process.env.RTRVR_API_KEY?.trim());
}
