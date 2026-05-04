#!/usr/bin/env node
/**
 * Sync llms.txt and llms-full.txt from the repo root into frontend/public/
 * so they are served at https://epi-gram.app/llms.txt and /llms-full.txt.
 *
 * Source-of-truth files live at the repo root for easy hand-editing.
 * Run automatically as a `prebuild` step via frontend/package.json.
 *
 * Usage: node ../scripts/sync-llms.mjs   (from frontend/ during prebuild)
 *        node scripts/sync-llms.mjs      (from repo root, manual)
 */
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
// scripts/ is at the repo root, so root = scripts/..
const REPO_ROOT = resolve(__dirname, "..");
const PUBLIC_DIR = resolve(REPO_ROOT, "frontend/public");

const FILES = ["llms.txt", "llms-full.txt"];

if (!existsSync(PUBLIC_DIR)) {
  mkdirSync(PUBLIC_DIR, { recursive: true });
}

let copied = 0;
let missing = [];

for (const file of FILES) {
  const src = resolve(REPO_ROOT, file);
  const dest = resolve(PUBLIC_DIR, file);
  if (!existsSync(src)) {
    missing.push(file);
    continue;
  }
  copyFileSync(src, dest);
  console.log(`[sync-llms] ${file} → ${dest}`);
  copied += 1;
}

if (missing.length > 0) {
  console.warn(
    `[sync-llms] WARNING: missing source files at repo root: ${missing.join(
      ", "
    )}`
  );
  // Don't fail the build — these files are optional.
}

console.log(`[sync-llms] copied ${copied} file(s).`);
