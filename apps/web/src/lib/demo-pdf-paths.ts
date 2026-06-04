import fs from "node:fs";
import path from "node:path";
import { getDemoCase, type DemoCaseId } from "./demo-cases";

function resolvePdf(filename: string): string | null {
  const candidates = [
    path.join(process.cwd(), "public", "demo", filename),
    path.join(process.cwd(), "demo", "pdfs", filename),
    path.join(process.cwd(), "..", "..", "demo", "pdfs", filename),
  ];
  for (const filePath of candidates) {
    try {
      if (fs.existsSync(filePath)) return filePath;
    } catch {
      /* try next */
    }
  }
  return null;
}

export function readDemoPdfBuffers(caseId?: DemoCaseId | string | null): {
  chart: Buffer | null;
  prescription: Buffer | null;
} {
  const pdfs = getDemoCase(caseId).pdfs;
  const chartPath = resolvePdf(pdfs.chart);
  const rxPath = resolvePdf(pdfs.prescription);
  return {
    chart: chartPath ? fs.readFileSync(chartPath) : null,
    prescription: rxPath ? fs.readFileSync(rxPath) : null,
  };
}
