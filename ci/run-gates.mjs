import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(args) {
  const result = spawnSync(args[0], args.slice(1), { cwd: root, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(["node", "ci/license-check.cjs"]);
run(["node", "--experimental-strip-types", "tests/suite.mjs"]);
console.log("\nCI gates green: license check and implementation tests.");
