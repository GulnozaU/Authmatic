#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createAdminClient } from "@insforge/sdk";

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(webRoot, "../..");
const projectFile = path.join(repoRoot, ".insforge/project.json");
const caseFile = path.join(repoRoot, "demo/sarah-martinez.json");
const BUCKET = "authmatic-demo";

function loadConfig() {
  const project = JSON.parse(fs.readFileSync(projectFile, "utf-8"));
  return { baseUrl: project.oss_host, apiKey: project.api_key };
}

async function uploadPdf(insforge, localPath, key) {
  const buffer = fs.readFileSync(localPath);
  const blob = new Blob([buffer], { type: "application/pdf" });
  const file = new File([blob], path.basename(localPath), { type: "application/pdf" });
  const { data, error } = await insforge.storage.from(BUCKET).upload(file, { key });
  if (error) throw new Error(`Upload ${key}: ${error.message}`);
  return data;
}

async function main() {
  const insforge = createAdminClient(loadConfig());
  const demoCase = JSON.parse(fs.readFileSync(caseFile, "utf-8"));

  console.log("Uploading demo PDFs...");
  const chart = await uploadPdf(
    insforge,
    path.join(repoRoot, "demo/pdfs/patient_chart_sarah_martinez.pdf"),
    "demo/patient_chart_sarah_martinez.pdf"
  );
  const rx = await uploadPdf(
    insforge,
    path.join(repoRoot, "demo/pdfs/prescription_ozempic_martinez.pdf"),
    "demo/prescription_ozempic_martinez.pdf"
  );

  const row = {
    id: demoCase.demo_id,
    case_json: demoCase,
    chart_storage_key: chart.key ?? chart.path ?? "demo/patient_chart_sarah_martinez.pdf",
    chart_storage_url: chart.url ?? null,
    prescription_storage_key: rx.key ?? rx.path ?? "demo/prescription_ozempic_martinez.pdf",
    prescription_storage_url: rx.url ?? null,
    updated_at: new Date().toISOString(),
  };

  console.log("Seeding demo_cases...");
  const { error } = await insforge.database.from("demo_cases").upsert([row]);
  if (error) throw new Error(error.message);

  console.log("InsForge seed complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
