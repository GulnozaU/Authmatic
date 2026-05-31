import fs from "fs";
import path from "path";
import type { PaFormPayload, PaSubmission, PaStatus } from "./pa-types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "submissions.json");

let counter = 451;

function ensureStore(): Map<string, PaSubmission> {
  if (!globalThis.__paStore) {
    globalThis.__paStore = new Map<string, PaSubmission>();
    try {
      if (fs.existsSync(DATA_FILE)) {
        const rows = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as PaSubmission[];
        for (const row of rows) {
          globalThis.__paStore.set(row.reference_id, row);
          const num = parseInt(row.reference_id.replace(/\D/g, ""), 10);
          if (num >= counter) counter = num + 1;
        }
      }
    } catch {
      /* fresh store */
    }
  }
  return globalThis.__paStore;
}

function persist(store: Map<string, PaSubmission>) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify([...store.values()], null, 2));
  } catch {
    /* in-memory only */
  }
}

export function nextReferenceId(): string {
  const id = `PA-2026-${String(counter).padStart(5, "0")}`;
  counter += 1;
  return id;
}

export function createSubmission(payload: PaFormPayload): PaSubmission {
  const store = ensureStore();
  const reference_id = nextReferenceId();
  const submission: PaSubmission = {
    ...payload,
    reference_id,
    status: "pending_review",
    submitted_at: new Date().toISOString(),
  };
  store.set(reference_id, submission);
  persist(store);
  return submission;
}

export function getSubmission(reference_id: string): PaSubmission | undefined {
  return ensureStore().get(reference_id);
}

export function updateSubmission(
  reference_id: string,
  patch: Partial<PaSubmission>
): PaSubmission | undefined {
  const store = ensureStore();
  const existing = store.get(reference_id);
  if (!existing) return undefined;
  const updated = { ...existing, ...patch };
  store.set(reference_id, updated);
  persist(store);
  return updated;
}

declare global {
  // eslint-disable-next-line no-var
  var __paStore: Map<string, PaSubmission> | undefined;
}
