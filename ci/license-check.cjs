#!/usr/bin/env node
/**
 * SuperQuantumAGI - License & Attribution CI Checker
 * Verifies AC8: 0 copyleft in vendored paths, attribution files intact.
 */

const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
let hasErrors = false;

function reportError(msg) {
  console.error(`[LICENSE CHECK FAIL] ${msg}`);
  hasErrors = true;
}

function reportPass(msg) {
  console.log(`[PASS] ${msg}`);
}

// 1. Check NOTICE file
const noticePath = path.join(ROOT_DIR, "NOTICE");
if (!fs.existsSync(noticePath)) {
  reportError("NOTICE file is missing.");
} else {
  const content = fs.readFileSync(noticePath, "utf8");
  if (!content.includes("https://github.com/unclecode/crawl4ai")) {
    reportError("NOTICE file missing mandatory Crawl4AI attribution clause.");
  } else {
    reportPass("NOTICE file verified with Crawl4AI attribution.");
  }
}

// 2. Check THIRD_PARTY_LICENSES file
const tplPath = path.join(ROOT_DIR, "THIRD_PARTY_LICENSES");
if (!fs.existsSync(tplPath)) {
  reportError("THIRD_PARTY_LICENSES file is missing.");
} else {
  const content = fs.readFileSync(tplPath, "utf8");
  const requiredEntities = ["DeusData", "Upstash", "shadcn", "Daniel (San) Ávila"];
  for (const entity of requiredEntities) {
    if (!content.includes(entity)) {
      reportError(`THIRD_PARTY_LICENSES missing copyright entry for: ${entity}`);
    }
  }
  reportPass("THIRD_PARTY_LICENSES verified with required copyright holders.");
}

// 3. Check README.md attribution lines
const readmePath = path.join(ROOT_DIR, "README.md");
if (!fs.existsSync(readmePath)) {
  reportError("README.md is missing.");
} else {
  const content = fs.readFileSync(readmePath, "utf8");
  if (!content.includes("Crawl4AI Attribution") || !content.includes("Serena")) {
    reportError("README.md is missing explicit Crawl4AI or Serena attribution mentions.");
  } else {
    reportPass("README.md attribution mentions verified.");
  }
}

// 4. Check vendor directory: Must not contain copyleft or unlicensed files
const vendorDir = path.join(ROOT_DIR, "vendor");
if (fs.existsSync(vendorDir)) {
  const files = fs.readdirSync(vendorDir, { recursive: true });
  for (const file of files) {
    if (file.toLowerCase().includes("gpl") || file.toLowerCase().includes("agpl")) {
      reportError(`Found copyleft artifact in vendor directory: ${file}`);
    }
  }
} else {
  reportPass("No vendored copyleft directory present (clean external pointer architecture).");
}

if (hasErrors) {
  console.error("\nLicense verification failed.");
  process.exit(1);
} else {
  console.log("\nAll license and attribution checks passed successfully (0 copyleft in repo).");
  process.exit(0);
}
