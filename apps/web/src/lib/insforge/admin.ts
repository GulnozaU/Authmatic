import { createAdminClient } from "@insforge/sdk";

export function getInsForgeAdmin() {
  const baseUrl = process.env.INSFORGE_PROJECT_URL;
  const apiKey = process.env.INSFORGE_API_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error(
      "Missing INSFORGE_PROJECT_URL or INSFORGE_API_KEY in environment"
    );
  }

  return createAdminClient({ baseUrl, apiKey });
}

export function isInsForgeConfigured(): boolean {
  return Boolean(process.env.INSFORGE_PROJECT_URL && process.env.INSFORGE_API_KEY);
}

export const STORAGE_BUCKET = "authmatic-demo";
