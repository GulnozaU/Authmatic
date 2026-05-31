#!/usr/bin/env node
/** Copy demo PDFs into public/demo for Next.js + Tigris uploads. Never fails the build. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(webRoot, "public", "demo");
const sources = [
  path.join(webRoot, "..", "..", "demo", "pdfs"),
  path.join(webRoot, "demo", "pdfs"),
];

fs.mkdirSync(outDir, { recursive: true });

let copied = 0;
for (const srcDir of sources) {
  if (!fs.existsSync(srcDir)) continue;
  for (const name of fs.readdirSync(srcDir)) {
    if (!name.endsWith(".pdf")) continue;
    fs.copyFileSync(path.join(srcDir, name), path.join(outDir, name));
    copied += 1;
  }
}

if (copied === 0 && fs.existsSync(outDir)) {
  const existing = fs.readdirSync(outDir).filter((f) => f.endsWith(".pdf"));
  if (existing.length) copied = existing.length;
}

console.log(`sync:demo — ${copied} PDF(s) in public/demo`);
