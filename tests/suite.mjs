import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AntiSpinTracker } from "../harness/anti-spin.ts";
import { evaluateDoneGate } from "../harness/done-gate.ts";
import { SingleWriterEnforcer } from "../harness/fileio/single-writer.ts";
import {
  assertProfilesDisjoint,
  evaluateRuntimePermission,
  isOffensiveInvocation,
  verifyPentestAuthorization,
} from "../harness/policy.cjs";
import { evaluateRootCauseGate } from "../harness/root-cause-gate.ts";
import { runInSandbox } from "../harness/sandbox/bwrap-runner.ts";
import { planDispatch } from "../routing/dispatch.ts";
import { SECTOR_SKILL_REGISTRY, resolveSkillInSector } from "../routing/intent-registry/index.ts";
import { parseTriageOutput } from "../routing/layer1-triage.ts";
import { routeLayer0 } from "../routing/layer0-zero-llm.ts";
import { routeTask } from "../routing/route-task.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`[FAIL] ${name}`);
    console.error(err);
  }
}

test("done-gate accepts only exit 0, non-empty artifacts, and green tests", () => {
  const ok = evaluateDoneGate({
    commandExitCode: 0,
    expectedArtifacts: [path.join(root, "NOTICE")],
    testsGreen: true,
  });
  assert.equal(ok.isDone, true);

  const badExit = evaluateDoneGate({
    commandExitCode: 1,
    expectedArtifacts: [path.join(root, "NOTICE")],
    testsGreen: true,
  });
  assert.equal(badExit.isDone, false);

  const missing = evaluateDoneGate({
    commandExitCode: 0,
    expectedArtifacts: [path.join(root, "missing-artifact.txt")],
    testsGreen: true,
  });
  assert.equal(missing.isDone, false);
  assert.equal(missing.missingArtifacts.length, 1);

  const red = evaluateDoneGate({
    commandExitCode: 0,
    expectedArtifacts: [path.join(root, "NOTICE")],
    testCommandExitCode: 1,
  });
  assert.equal(red.isDone, false);
});

test("anti-spin trips at hardcoded iteration 3 and audits after 2 failures", () => {
  const tracker = new AntiSpinTracker("task-123");
  const failure = { isDone: false, exitCodeOk: false, artifactsExist: false, missingArtifacts: ["x"], testsPassed: false };
  const first = tracker.recordIteration(failure);
  assert.equal(first.canContinue, true);
  assert.equal(first.invokeExceptionAuditor, false);
  const second = tracker.recordIteration(failure);
  assert.equal(second.invokeExceptionAuditor, true);
  assert.equal(second.tripped, false);
  const third = tracker.recordIteration(failure);
  assert.equal(third.canContinue, false);
  assert.equal(third.tripped, true);
  assert.equal(tracker.getState().maxIterations, 3);
});

test("single-writer allows only synthesizer on plan files", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "superq-writer-"));
  const enforcer = new SingleWriterEnforcer(dir);
  assert.equal(enforcer.checkWritePermission("synthesizer", "task_plan.md").allowed, true);
  assert.equal(enforcer.checkWritePermission("orchestrator", "findings.md").allowed, false);
  assert.equal(enforcer.checkWritePermission("sectors/coding", path.join(dir, "task_plan.md")).allowed, false);
  assert.equal(enforcer.checkWritePermission("sectors/coding", "runtime/progress.coding.md").allowed, true);
  assert.equal(enforcer.checkWritePermission("sectors/coding", "runtime/progress.osint.md").allowed, false);
});

test("root-cause gate stops before widening a symptom fix", () => {
  const symptom = evaluateRootCauseGate({
    changedFiles: ["src/a.ts"],
    targetModule: "src",
    isSymptomFixOnly: true,
    symptomExplanation: "null check hides the missing init",
    otherModulesMatchingPattern: ["pkg/b"],
  });
  assert.equal(symptom.isSymptomOnly, true);
  assert.equal(symptom.requiresOperatorConsent, true);

  const local = evaluateRootCauseGate({
    changedFiles: ["src/a.ts"],
    targetModule: "src",
    isSymptomFixOnly: false,
    symptomExplanation: "fixed initializer",
    otherModulesMatchingPattern: [],
  });
  assert.equal(local.isRootCause, true);
  assert.equal(local.requiresOperatorConsent, false);
  assert.equal(local.blastRadius, "low");
});

test("layer-0 slash commands early-exit and general code falls through", () => {
  assert.equal(routeLayer0("/audit").sector, "orchestration-quality");
  assert.equal(routeLayer0("/pentest").profile, "Pentest");
  assert.equal(routeLayer0("Refactor the database connection pool in TypeScript").matched, false);
});

test("routeTask hits the golden set at or above 90 percent", () => {
  const cases = JSON.parse(fs.readFileSync(path.join(root, "eval/golden-set-routing.json"), "utf8"));
  let correct = 0;
  for (const item of cases) {
    const routed = routeTask(item.prompt);
    const sectorOk = routed.sector === item.expectedSector;
    const complexityOk = routed.complexity === item.expectedComplexity;
    const profileOk = routed.profile === item.expectedProfile;
    if (sectorOk && complexityOk && profileOk) correct += 1;
    else console.error("mismatch", item.id, routed);
    const plan = planDispatch({ complexity: routed.complexity, sector: routed.sector });
    if (item.expectedComplexity === "Low") assert.equal(plan.subagents.length, 1);
    if (item.expectedComplexity === "High") assert.ok(plan.subagents.length > 1);
  }
  const accuracy = correct / cases.length;
  assert.ok(accuracy >= 0.9, `routing accuracy ${accuracy} < 0.9`);
});

test("reverse-engineering route never selects the offensive profile", () => {
  const routed = routeTask("Decompile this Android APK and inspect the native lib frida hooks");
  assert.equal(routed.profile, "ReAnalysis");
  assert.notEqual(routed.profile, "Pentest");
});

test("intent keys are unique inside each sector and ties resolve", () => {
  assert.equal(Object.keys(SECTOR_SKILL_REGISTRY).length, 11);
  for (const [sector, skills] of Object.entries(SECTOR_SKILL_REGISTRY)) {
    const keys = skills.map((skill) => skill.intentKey);
    assert.equal(new Set(keys).size, keys.length, sector);
  }
  assert.equal(resolveSkillInSector("motion-media", "react remotion video").skillId, "claude-remotion-skill");
  assert.equal(resolveSkillInSector("reverse-engineering", "android apk frida").skillId, "hypeking");
  assert.equal(resolveSkillInSector("unknown-sector", "anything").status, "manual_fallback");
});

test("triage parser keeps ReAnalysis and does not mark RE as pentest", () => {
  const parsed = parseTriageOutput(JSON.stringify({
    sector: "reverse-engineering",
    complexity: "High",
    profile: "Pentest",
    intentVsTask: { surfaceRequest: "apk", underlyingIntent: "inspect", isEmergencyPatch: false },
    reasoning: "test",
  }));
  assert.equal(parsed.profile, "ReAnalysis");
});

test("NFR11 rejects missing flag, example consent, expiry, and accepts a live file", () => {
  const live = path.join(os.tmpdir(), `consent-${Date.now()}.json`);
  fs.writeFileSync(live, JSON.stringify({
    authorization: { expires_at: "2099-01-01T00:00:00Z" },
    scope: { allowed_targets: ["127.0.0.1"] },
    signature_verification: { status: "APPROVED" },
  }));
  assert.equal(verifyPentestAuthorization({ args: ["scan"], consentFilePath: live }).allowed, false);
  assert.equal(verifyPentestAuthorization({
    args: ["--pentest"],
    consentFilePath: path.join(root, "consent/pentest-scope.example.json"),
  }).allowed, false);
  const expired = path.join(os.tmpdir(), `expired-${Date.now()}.json`);
  fs.writeFileSync(expired, JSON.stringify({
    authorization: { expires_at: "2000-01-01T00:00:00Z" },
    scope: { allowed_targets: ["127.0.0.1"] },
    signature_verification: { status: "APPROVED" },
  }));
  assert.equal(verifyPentestAuthorization({ args: ["--pentest"], consentFilePath: expired }).allowed, false);
  assert.equal(verifyPentestAuthorization({ args: ["--pentest"], consentFilePath: live }).allowed, true);
});

test("offensive gate matches executables and MCP actions, not search text", () => {
  assert.equal(isOffensiveInvocation("grep", ["sliver|caldera"]), false);
  assert.equal(isOffensiveInvocation("read", ["docs/sliver.md"]), false);
  assert.equal(isOffensiveInvocation("shell", ["rg -n sliver catalog.md"]), false);
  assert.equal(isOffensiveInvocation("shell", ["sliver-server"]), true);
  assert.equal(isOffensiveInvocation("caldera_list", ["*"]), true);
  const denied = evaluateRuntimePermission({
    agent: "sectors/security-pentest",
    action: "grep",
    resources: ["sliver|caldera"],
    directory: root,
  });
  assert.equal(denied.effect, null);
  const blocked = evaluateRuntimePermission({
    agent: "sectors/security-pentest",
    action: "shell",
    resources: ["sliver-server"],
    directory: root,
  });
  assert.equal(blocked.effect, "deny");
});

test("re-analysis servers are disjoint from offensive servers", () => {
  assertProfilesDisjoint();
});

test("plugin source does not substring-ban documentation searches", () => {
  const src = fs.readFileSync(path.join(root, ".opencode/plugins/superquantumagi/index.ts"), "utf8");
  assert.equal(src.includes('.includes("sliver")'), false);
  assert.equal(src.includes('.includes("caldera")'), false);
  assert.equal(src.includes("evaluateRuntimePermission"), true);
});

test("sector agent denies are not overridden by a later allow-all", () => {
  const coding = fs.readFileSync(path.join(root, ".opencode/agents/sectors/coding.md"), "utf8");
  const allowAt = coding.indexOf('resource: "*"');
  const denyAt = coding.lastIndexOf('resource: "*/task_plan.md"');
  assert.ok(allowAt > 0 && denyAt > allowAt, "specific deny must come after allow *");
});

test("bwrap runner executes inside the sandbox", () => {
  const result = runInSandbox("echo SANDBOX_FN_OK", { workspaceDir: root, allowNetwork: false, timeoutMs: 20000 });
  assert.equal(result.exitCode, 0, result.stderr);
  assert.match(result.stdout, /SANDBOX_FN_OK/);
});

if (failed > 0) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}
console.log("\nAll harness tests passed against the implementation modules.");
