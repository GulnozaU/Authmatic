import { createAdminClient } from "@insforge/sdk";

export function getInsForgeAdmin() {
  const baseUrl = process.env.INSFORGE_PROJECT_URL?.trim();
  const apiKey = process.env.INSFORGE_API_KEY?.trim();

  if (!baseUrl || !apiKey) {
    throw new Error(
      "Missing INSFORGE_PROJECT_URL or INSFORGE_API_KEY in environment"
    );
  }

  return createAdminClient({ baseUrl, apiKey });
}

export function isInsForgeConfigured(): boolean {
  const url = process.env.INSFORGE_PROJECT_URL?.trim();
  const key = process.env.INSFORGE_API_KEY?.trim();
  return Boolean(url && key);
}

export const STORAGE_BUCKET = "authmatic-demo";
