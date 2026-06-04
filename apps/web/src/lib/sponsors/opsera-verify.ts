import type { PaFormPayload } from "../pa-types";
import { isDemoFixtureMode } from "../demo-mode";

export type VerifyResult = {
  passed: boolean;
  // "opsera_mcp"                       — Opsera MCP responded with a real result
  // "local_rules_opsera_unreachable"   — MCP attempted, failed; local PHI rules ran
  source: "opsera_mcp" | "local_rules_opsera_unreachable";
  flagged_fields: string[];
  notes: string;
  opsera?: Record<string, unknown>;
};

const OPSERA_MCP_DEFAULT = "https://agent.opsera.ai/mcp";
const PREFERRED_TOOLS = ["compliance-audit", "security-scan", "sql-security"];

const SSN = /\b\d{3}-\d{2}-\d{4}\b/;
const ALLOWED_KEYS = new Set([
  "patient_name",
  "dob",
  "member_id",
  "diagnosis",
  "medication",
  "dosage",
  "provider_name",
  "justification",
]);

function localPhiRules(payload: PaFormPayload): VerifyResult {
  const flagged: string[] = [];
  const blob = JSON.stringify(payload);

  if (SSN.test(blob)) flagged.push("SSN pattern detected — remove before payer submit");
  if (/\b\d{16}\b/.test(blob)) flagged.push("Credit card pattern detected");

  for (const [key, value] of Object.entries(payload)) {
    if (!ALLOWED_KEYS.has(key)) flagged.push(`Unexpected field: ${key}`);
    if (!String(value).trim()) flagged.push(`Empty required field: ${key}`);
  }

  if (String(payload.justification).length > 600) {
    flagged.push("Justification too long — PHI over-disclosure risk");
  }

  return {
    passed: flagged.length === 0,
    source: "local_rules_opsera_unreachable",
    flagged_fields: flagged,
    notes:
      flagged.length === 0
        ? "Packet scoped to payer-required fields only; no excess PHI patterns."
        : "Compliance issues found in outgoing packet.",
  };
}

function mcpUrl(): string {
  return process.env.OPSERA_MCP_URL?.trim() || OPSERA_MCP_DEFAULT;
}

function mcpHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  };
}

function parseMcpBody(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  if (!trimmed) return { error: "Empty MCP response" };

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return JSON.parse(trimmed) as Record<string, unknown>;
  }

  let last: Record<string, unknown> | null = null;
  for (const line of trimmed.split("\n")) {
    if (!line.startsWith("data:")) continue;
    const data = line.slice(5).trim();
    if (!data || data === "[DONE]") continue;
    try {
      last = JSON.parse(data) as Record<string, unknown>;
    } catch {
      /* skip partial SSE chunks */
    }
  }

  return last ?? { error: "Unparseable MCP stream", raw: trimmed.slice(0, 400) };
}

async function mcpRequest(
  token: string,
  method: string,
  params: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const body = {
    jsonrpc: "2.0",
    id: `authmatic-${Date.now()}`,
    method,
    params,
  };

  const res = await fetch(mcpUrl(), {
    method: "POST",
    headers: mcpHeaders(token),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });

  const text = await res.text();
  let parsed: Record<string, unknown>;
  try {
    parsed = parseMcpBody(text);
  } catch {
    parsed = { error: text.slice(0, 400) };
  }

  if (!res.ok) {
    return {
      http_status: res.status,
      error: parsed.error ?? text.slice(0, 300),
      ...parsed,
    };
  }

  if ("error" in parsed && parsed.error) {
    return parsed;
  }

  return parsed;
}

function toolNamesFromList(result: Record<string, unknown>): string[] {
  const tools = (result.result as { tools?: { name: string }[] } | undefined)?.tools;
  if (!Array.isArray(tools)) return [];
  return tools.map((t) => t.name).filter(Boolean);
}

function pickTool(names: string[]): string | null {
  for (const preferred of PREFERRED_TOOLS) {
    const hit = names.find(
      (n) => n === preferred || n.endsWith(preferred) || n.includes(preferred)
    );
    if (hit) return hit;
  }
  return names[0] ?? null;
}

function toolArguments(tool: string, payload: PaFormPayload): Record<string, unknown> {
  const packet = {
    context: "prior_auth_payer_submit",
    framework: "HIPAA",
    scope: "outgoing_packet",
    fields: payload,
    field_names: Object.keys(payload),
  };

  if (tool.includes("compliance")) {
    return { framework: "HIPAA", context: JSON.stringify(packet) };
  }
  if (tool.includes("sql")) {
    return { query: JSON.stringify(payload), context: "pii_discovery" };
  }
  return {
    scope: "application",
    context: "prior_auth_payer_submit",
    payload_fields: Object.keys(payload),
    packet,
  };
}

async function callOpseraMcp(payload: PaFormPayload): Promise<Record<string, unknown> | null> {
  const token = process.env.OPSERA_API_TOKEN?.trim();
  if (!token || isDemoFixtureMode() || token.includes("...") || token.length < 40) {
    return null;
  }

  const list = await mcpRequest(token, "tools/list", {});
  if ("error" in list && !list.result) {
    return { mcp_url: mcpUrl(), transport: "streamable-http", ...list };
  }

  const names = toolNamesFromList(list);
  const tool = pickTool(names) ?? "compliance-audit";

  const call = await mcpRequest(token, "tools/call", {
    name: tool,
    arguments: toolArguments(tool, payload),
  });

  return {
    mcp_url: mcpUrl(),
    transport: "streamable-http",
    tool,
    tools_available: names,
    ...call,
  };
}

/** Opsera compliance verify — MCP when keyed, else rigorous local PHI rules */
export async function verifyWithOpsera(payload: PaFormPayload): Promise<VerifyResult> {
  const rules = localPhiRules(payload);

  const mcp = await callOpseraMcp(payload).catch((err) => ({
    error: err instanceof Error ? err.message : "Opsera MCP unreachable",
    mcp_url: mcpUrl(),
    transport: "streamable-http",
  }));

  const mcpOk = Boolean(mcp && "result" in mcp && mcp.result !== undefined);

  if (mcpOk && mcp) {
    return {
      ...rules,
      source: "opsera_mcp",
      opsera: mcp as Record<string, unknown>,
      notes: rules.passed
        ? "Opsera MCP (streamable-http) + local PHI rules passed."
        : "Opsera MCP invoked; local PHI rules failed.",
    };
  }

  const errMsg =
    mcp && "error" in mcp
      ? String((mcp as { error?: unknown }).error ?? "unavailable")
      : "unavailable";

  return {
    ...rules,
    opsera: mcp ?? undefined,
    notes: mcp
      ? `${rules.notes} Opsera MCP (${mcpUrl()}): ${errMsg}.`
      : rules.notes,
  };
}

export function isOpseraConfigured(): boolean {
  return Boolean(process.env.OPSERA_API_TOKEN?.trim());
}
