#!/usr/bin/env node
/**
 * SuperQuantumAGI SmartDoc CLI adapter.
 * Invokes the deterministic Python runtime in harness/smartdoc/.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const mainPy = path.join(root, "harness/smartdoc/main.py");

const args = process.argv.slice(2);

const proc = spawnSync("python3", [mainPy, ...args], {
  stdio: "inherit",
  env: process.env,
  cwd: process.cwd(),
});

if (proc.error) {
  process.stderr.write(`Failed to start smartdoc runtime: ${proc.error.message}\n`);
  process.exit(1);
}

process.exit(proc.status ?? 1);
