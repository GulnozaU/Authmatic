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
    "Fill the Prescription Drug Prior Authorization form (Page 1) and submit.",
    `Open ${url}`,
    "Patient section:",
    `#patient_first_name: ${fields.patient_name.split(" ")[0] ?? "Sarah"}`,
    `#patient_last_name: ${fields.patient_name.split(" ").slice(1).join(" ") ?? "Martinez"}`,
    `#patient_dob: ${fields.dob}`,
    `#primary_patient_id: ${fields.member_id}`,
    `#primary_insurance_name: HealthFirst PPO`,
    "Prescriber section:",
    `#prescriber_first_name: ${fields.provider_name.split(" ")[0] ?? "Emily"}`,
    `#prescriber_last_name: Chen`,
    `#prescriber_npi: 1234567890`,
    "Medication section:",
    `#medication_name: ${fields.medication}`,
    `#medication_dose + #medication_frequency: ${fields.dosage}`,
    `#diagnosis_primary: ${fields.diagnosis}`,
    `#clinical_justification: ${fields.justification}`,
    "Check #therapy_new and #medication_route_injection if applicable.",
    "Click #submit-prior-auth when complete.",
    "Return reference_id from /portal/healthfirst/submission/PA-... URL.",
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
