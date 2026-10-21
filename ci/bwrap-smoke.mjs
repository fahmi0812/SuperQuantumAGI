/**
 * CI smoke for the production bwrap argv.
 * Do not duplicate binds here. Drift is what made the hardcoded smoke fail.
 */
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { buildBwrapCommand } = require(path.join(root, "harness/sandbox/bwrap-command.cjs"));

const built = buildBwrapCommand("echo SANDBOX_CI_OK", {
  workspaceDir: root,
  allowNetwork: false,
});
const result = spawnSync(built.binary, built.args, { encoding: "utf8" });
const stdout = result.stdout ?? "";
const stderr = result.stderr ?? "";
if (result.status !== 0 || !stdout.includes("SANDBOX_CI_OK")) {
  if (result.error) process.stderr.write(`${result.error.message}\n`);
  if (stderr) process.stderr.write(stderr);
  if (stdout) process.stderr.write(stdout);
  process.exit(result.status && result.status !== 0 ? result.status : 1);
}
