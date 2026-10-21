import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const nodeMajor = Number(process.versions.node.split(".")[0]);
if (!Number.isFinite(nodeMajor) || nodeMajor < 22) {
  console.error(
    `CI hard-fail: Node ${process.version} is below 22. SuperQuantumAGI requires Node >= 22 (--experimental-strip-types). No Node 20 transpile fallback is provided.`,
  );
  process.exit(1);
}

function run(args) {
  const result = spawnSync(args[0], args.slice(1), { cwd: root, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(["node", "ci/license-check.cjs"]);
run(["node", "--experimental-strip-types", "tests/suite.mjs"]);
console.log("\nCI gates green: license check and implementation tests.");
