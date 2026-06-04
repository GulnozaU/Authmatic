import { createAdminClient } from "@insforge/sdk";

// Module-scoped cache: each Vercel function instance constructs the admin
// client at most once. Subsequent requests on the same warm instance reuse
// the HTTP keep-alive pool inside the SDK instead of paying the connection
// cold-start (~80-200ms saved per request).
let _client: ReturnType<typeof createAdminClient> | null = null;
let _clientFingerprint: string | null = null;

export function getInsForgeAdmin() {
  const baseUrl = process.env.INSFORGE_PROJECT_URL?.trim();
  const apiKey = process.env.INSFORGE_API_KEY?.trim();

  if (!baseUrl || !apiKey) {
    throw new Error(
      "Missing INSFORGE_PROJECT_URL or INSFORGE_API_KEY in environment"
    );
  }

  const fingerprint = `${baseUrl}::${apiKey.slice(0, 8)}`;
  if (_client && _clientFingerprint === fingerprint) return _client;

  _client = createAdminClient({ baseUrl, apiKey });
  _clientFingerprint = fingerprint;
  return _client;
}

export function isInsForgeConfigured(): boolean {
  const url = process.env.INSFORGE_PROJECT_URL?.trim();
  const key = process.env.INSFORGE_API_KEY?.trim();
  return Boolean(url && key);
}

export const STORAGE_BUCKET = "authmatic-demo";
