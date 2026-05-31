#!/usr/bin/env node
/**
 * Upload Sarah demo PDFs to Tigris. Updates demo_cases in InsForge with Tigris URLs.
 * Run from apps/web: npm run upload:tigris
 * Loads env from apps/web/.env.local then repo root .env.local
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { PutObjectCommand, S3Client, CreateBucketCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import { createAdminClient } from "@insforge/sdk";

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(webRoot, "../..");

config({ path: path.join(webRoot, ".env.local") });
config({ path: path.join(repoRoot, ".env.local") });

const BUCKET = process.env.TIGRIS_BUCKET ?? "authmatic-demo";

function client() {
  return new S3Client({
    region: "auto",
    endpoint: process.env.TIGRIS_ENDPOINT,
    credentials: {
      accessKeyId: process.env.TIGRIS_ACCESS_KEY_ID,
      secretAccessKey: process.env.TIGRIS_SECRET_ACCESS_KEY,
    },
  });
}

function url(key) {
  return `${process.env.TIGRIS_ENDPOINT.replace(/\/$/, "")}/${BUCKET}/${key}`;
}

async function ensureBucket() {
  try {
    await client().send(new HeadBucketCommand({ Bucket: BUCKET }));
  } catch {
    console.log(`Creating bucket "${BUCKET}"...`);
    await client().send(new CreateBucketCommand({ Bucket: BUCKET }));
  }
}

async function upload(key, filePath) {
  const body = fs.readFileSync(filePath);
  await client().send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: "application/pdf",
    })
  );
  return { key, url: url(key) };
}

async function main() {
  const required = [
    "TIGRIS_ACCESS_KEY_ID",
    "TIGRIS_SECRET_ACCESS_KEY",
    "TIGRIS_ENDPOINT",
    "INSFORGE_API_KEY",
    "INSFORGE_PROJECT_URL",
  ];
  for (const k of required) {
    if (!process.env[k]) throw new Error(`Missing ${k}`);
  }

  console.log("Uploading PDFs to Tigris...");
  await ensureBucket();
  const chart = await upload(
    "demo/patient_chart_sarah_martinez.pdf",
    path.join(repoRoot, "assets/demo/patient_chart_sarah_martinez.pdf")
  );
  const rx = await upload(
    "demo/prescription_ozempic_martinez.pdf",
    path.join(repoRoot, "assets/demo/prescription_ozempic_martinez.pdf")
  );

  console.log("Updating demo_cases in InsForge with Tigris URLs...");
  const insforge = createAdminClient({
    baseUrl: process.env.INSFORGE_PROJECT_URL,
    apiKey: process.env.INSFORGE_API_KEY,
  });

  const caseJson = JSON.parse(
    fs.readFileSync(path.join(repoRoot, "mock/healthfirst-case.json"), "utf-8")
  );
  caseJson.assets = {
    ...caseJson.assets,
    storage: "tigris",
    patient_chart: chart.key,
    prescription: rx.key,
  };

  const { error } = await insforge.database.from("demo_cases").upsert([
    {
      id: "sarah-ozempic-healthfirst",
      case_json: caseJson,
      chart_storage_key: chart.key,
      chart_storage_url: chart.url,
      prescription_storage_key: rx.key,
      prescription_storage_url: rx.url,
      updated_at: new Date().toISOString(),
    },
  ]);

  if (error) throw new Error(error.message);

  console.log("Tigris upload complete.");
  console.log("  chart:", chart.url);
  console.log("  rx:", rx.url);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
