import fs from "node:fs";
import path from "node:path";

const PDF_NAMES = {
  chart: "patient_chart_sarah_martinez.pdf",
  prescription: "prescription_ozempic_martinez.pdf",
} as const;

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

export function readDemoPdfBuffers(): { chart: Buffer | null; prescription: Buffer | null } {
  const chartPath = resolvePdf(PDF_NAMES.chart);
  const rxPath = resolvePdf(PDF_NAMES.prescription);
  return {
    chart: chartPath ? fs.readFileSync(chartPath) : null,
    prescription: rxPath ? fs.readFileSync(rxPath) : null,
  };
}
