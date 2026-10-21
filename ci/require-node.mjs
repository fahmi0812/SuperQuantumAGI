#!/usr/bin/env node
/**
 * Hard-fail below Node 22. Plain JavaScript so Node 20 can print this
 * message instead of dying inside --experimental-strip-types.
 * Pass a version argument only from tests: node ci/require-node.mjs v20.0.0
 */
const raw = process.argv[2] || process.version;
const match = String(raw).match(/(\d+)/);
const major = match ? Number(match[1]) : NaN;
if (!Number.isFinite(major) || major < 22) {
  console.error(
    `npm test hard-fail: Node ${raw} is below 22. SuperQuantumAGI requires Node >= 22. A default Node 20 box fails by design. There is no transpile fallback.`,
  );
  process.exit(1);
}
