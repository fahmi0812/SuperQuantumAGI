/**
 * Print a stable sha256 of the harness surface. Two runs in one checkout must match.
 * This is not an OCH release tarball.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const files = [
  "package.json",
  "ci/run-gates.mjs",
  "harness/done-gate.ts",
  "harness/anti-spin.ts",
  "harness/post-push.ts",
  ".opencode/rules/01-verification.md",
];

const hash = createHash("sha256");
for (const rel of files) {
  hash.update(rel);
  hash.update("\0");
  hash.update(fs.readFileSync(path.join(root, rel)));
  hash.update("\0");
}
process.stdout.write(`${hash.digest("hex")}\n`);
