import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
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
import { runQualityLoop } from "../harness/quality-loop.ts";
import { evaluateRootCauseGate } from "../harness/root-cause-gate.ts";
import { runInSandbox } from "../harness/sandbox/bwrap-runner.ts";
import { applyShellCreateBefore, decideSectorShell } from "../harness/sandbox/sector-shell.cjs";
import { createActiveModelCompleter, normalizeModelRef, resolveActiveModel } from "../routing/active-model.ts";
import { classifyDeterministic } from "../routing/classify.ts";
import { planDispatch } from "../routing/dispatch.ts";
import { SECTOR_SKILL_REGISTRY, resolveSkillInSector } from "../routing/intent-registry/index.ts";
import { buildTriagePrompt, parseTriageOutput } from "../routing/layer1-triage.ts";
import { routeLayer0 } from "../routing/layer0-zero-llm.ts";
import { routeTask } from "../routing/route-task.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let failed = 0;
const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
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

test("routeTask hits the golden set at or above 90 percent", async () => {
  const cases = JSON.parse(fs.readFileSync(path.join(root, "eval/golden-set-routing.json"), "utf8"));
  let correct = 0;
  for (const item of cases) {
    let calls = 0;
    const routed = await routeTask(item.prompt, {
      complete: async (triagePrompt) => {
        calls += 1;
        assert.match(triagePrompt, /Layer-1 Triage/);
        return JSON.stringify(classifyDeterministic(item.prompt));
      },
    });
    if (routed.layer === "layer0") assert.equal(calls, 0);
    if (routed.layer === "layer1") assert.equal(calls, 1);
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

test("reverse-engineering route never selects the offensive profile", async () => {
  let calls = 0;
  const routed = await routeTask("Decompile this Android APK and inspect the native lib frida hooks", {
    complete: async () => {
      calls += 1;
      return "{}";
    },
  });
  assert.equal(calls, 0);
  assert.equal(routed.layer, "layer0");
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
  assert.equal(resolveSkillInSector("unknown-sector", "anything").skillId, "manual");
  assert.equal(resolveSkillInSector("coding", "no-such-intent").skillId, "manual");
  assert.equal(resolveSkillInSector("coding", "no-such-intent").status, "manual_fallback");
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

test("layer-1 calls the injected completer once and does not embed a second router", async () => {
  const src = fs.readFileSync(path.join(root, "routing/route-task.ts"), "utf8");
  assert.equal(src.includes("classifyDeterministic"), false);
  assert.equal(src.includes("buildTriagePrompt"), true);
  let calls = 0;
  const routed = await routeTask("Refactor the database connection pool in TypeScript", {
    complete: async (prompt) => {
      calls += 1;
      assert.equal(prompt, buildTriagePrompt("Refactor the database connection pool in TypeScript"));
      return JSON.stringify({
        sector: "coding",
        complexity: "Low",
        profile: "Default",
        intentVsTask: { surfaceRequest: "refactor", underlyingIntent: "pool", isEmergencyPatch: false },
        reasoning: "test",
      });
    },
  });
  assert.equal(calls, 1);
  assert.equal(routed.layer, "layer1");
  assert.equal(routed.sector, "coding");
});

test("active-model completer uses the selected model exactly once", async () => {
  let generateCalls = 0;
  const complete = createActiveModelCompleter({
    model: { default: async () => ({ providerID: "9router", id: "active-fast" }) },
    generate: {
      text: async ({ model, prompt }) => {
        generateCalls += 1;
        assert.equal(model.providerID, "9router");
        assert.equal(model.id, "active-fast");
        assert.equal(prompt, "classify this");
        return { text: "{\"sector\":\"writing\",\"complexity\":\"Low\",\"profile\":\"Default\"}" };
      },
    },
  });
  const text = await complete("classify this");
  assert.equal(generateCalls, 1);
  assert.match(text, /writing/);
  await assert.rejects(() => complete("again"), /more than one model call/);
  assert.deepEqual(normalizeModelRef({ providerID: "9router", modelID: "session-model" }), {
    providerID: "9router",
    id: "session-model",
  });
  const resolved = await resolveActiveModel(
    { model: { default: async () => undefined }, generate: { text: async () => ({ text: "" }) } },
    { providerID: "9router", modelID: "from-session" },
  );
  assert.deepEqual(resolved, { providerID: "9router", id: "from-session" });
});

test("sector shell wraps echo inside bwrap and denies a missing engine", () => {
  const event = { command: "echo SANDBOX_FN_OK", cwd: root, timeout: 999999, env: {} };
  const decision = applyShellCreateBefore(event, { agent: "sectors/coding", bwrapAvailable: true, engine: "bwrap" });
  assert.equal(decision.effect, "wrap");
  assert.match(event.command, /^bwrap /);
  assert.ok(event.timeout <= 120000);
  const ran = spawnSync("bash", ["-c", event.command], { encoding: "utf8", timeout: 20000 });
  assert.equal(ran.status, 0, ran.stderr);
  assert.match(ran.stdout, /SANDBOX_FN_OK/);

  const missing = decideSectorShell({
    agent: "sectors/coding",
    command: "echo hi",
    cwd: root,
    bwrapAvailable: false,
    engine: "bwrap",
  });
  assert.equal(missing.effect, "deny");
  const orchestrator = decideSectorShell({
    agent: "orchestrator",
    command: "echo hi",
    cwd: root,
    bwrapAvailable: true,
    engine: "bwrap",
  });
  assert.equal(orchestrator.effect, "allow");
  assert.equal(orchestrator.command, "echo hi");
  const synthesizer = decideSectorShell({
    agent: "synthesizer",
    command: "echo hi",
    cwd: root,
    bwrapAvailable: false,
    engine: "bwrap",
  });
  assert.equal(synthesizer.effect, "allow");
});

test("plugin wraps sector shells and triages with the active model", () => {
  const src = fs.readFileSync(path.join(root, ".opencode/plugins/superquantumagi/index.ts"), "utf8");
  assert.equal(src.includes("applyShellCreateBefore"), true);
  assert.equal(src.includes("createActiveModelCompleter"), true);
  assert.equal(src.includes("session.generate"), true);
  assert.equal(src.includes("superq-triage]-error"), false);
  assert.equal(src.includes("classifyDeterministic"), false);
  assert.equal(src.includes("litellm"), false);
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  assert.equal(pkg.engines.node, ">=22");
  assert.equal(pkg.dependencies["@opencode/plugin"], "2.1.2");
});

test("pentest command no longer treats an example file as consent", () => {
  const pentest = fs.readFileSync(path.join(root, ".opencode/commands/pentest.md"), "utf8");
  assert.equal(pentest.includes("pentest-scope.example"), false);
  assert.match(pentest, /consent\/pentest-scope\.json/);
  assert.match(pentest, /--pentest/);
  assert.equal(fs.existsSync(path.join(root, "commands/orchestration")), false);
});

test("sector agents and synthesizer cannot spawn subagents", () => {
  const dir = path.join(root, ".opencode/agents/sectors");
  const files = fs.readdirSync(dir).filter((name) => name.endsWith(".md"));
  assert.equal(files.length, 11);
  for (const name of files) {
    const text = fs.readFileSync(path.join(dir, name), "utf8");
    assert.match(text, /action: subagent[\s\S]*effect: deny/, name);
  }
  const synthesizer = fs.readFileSync(path.join(root, ".opencode/agents/synthesizer.md"), "utf8");
  assert.match(synthesizer, /action: subagent[\s\S]*effect: deny/);
  const orchestrator = fs.readFileSync(path.join(root, ".opencode/agents/orchestrator.md"), "utf8");
  assert.match(orchestrator, /action: subagent[\s\S]*effect: allow/);
});

test("registry T1 skills exist as directories and fallback is manual", () => {
  const missing = [];
  for (const skills of Object.values(SECTOR_SKILL_REGISTRY)) {
    for (const skill of skills) {
      if (skill.tier !== "T1") continue;
      const file = path.join(root, ".opencode/skills", skill.id, "SKILL.md");
      if (!fs.existsSync(file)) missing.push(skill.id);
      else {
        const text = fs.readFileSync(file, "utf8");
        assert.match(text, /^---\nname:/, skill.id);
        assert.match(text, /description:/, skill.id);
      }
    }
  }
  assert.deepEqual(missing, []);
  assert.equal(fs.existsSync(path.join(root, ".opencode/skills/nia-oracle/SKILL.md")), true);
});

test("resolved pins are 40 hex and unresolved URLs stay honest", () => {
  const resolved = [
    "dispatching-parallel-agents",
    "humanizer",
    "rea",
    "diagram-design",
    "unslop",
    "api-design",
    "pageindex",
  ];
  for (const id of resolved) {
    const text = fs.readFileSync(path.join(root, ".opencode/skills", id, "SKILL.md"), "utf8");
    assert.match(text, /Pin: [0-9a-f]{40}/, id);
    assert.equal(text.includes("# TODO: resolve pin"), false, id);
  }
  const penulis = fs.readFileSync(path.join(root, ".opencode/skills/penulis-ilmiah/SKILL.md"), "utf8");
  const perf = fs.readFileSync(path.join(root, ".opencode/skills/full-performance-audit/SKILL.md"), "utf8");
  assert.match(penulis, /URL: TBD/);
  assert.match(penulis, /# TODO: resolve pin/);
  assert.match(perf, /URL: TBD/);
  assert.match(perf, /# TODO: resolve pin/);
  assert.equal(resolveSkillInSector("coding", "rest api design").skillId, "api-design");
  assert.equal(resolveSkillInSector("writing", "unslop this note").skillId, "unslop");
  assert.equal(resolveSkillInSector("data-doc-cad", "pptx briefing").skillId, "pptx-official");
  assert.equal(resolveSkillInSector("motion-media", "architecture diagram").skillId, "diagram-design");
});

test("node 20 is rejected by npm test and CI pins Node 22", () => {
  const denied = spawnSync(process.execPath, ["ci/require-node.mjs", "v20.11.1"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(denied.status, 1);
  assert.match(denied.stderr, /Node v20\.11\.1 is below 22/);
  assert.match(denied.stderr, /fails by design/);
  const workflow = fs.readFileSync(path.join(root, ".github/workflows/ci.yml"), "utf8");
  assert.match(workflow, /node-version: "22"/);
  assert.equal(workflow.includes("promptfoo"), false);
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  assert.match(pkg.scripts.test, /ci\/require-node\.mjs/);
});

test("offline eval configs exist and are not a fake green gate", () => {
  const promptfoo = fs.readFileSync(path.join(root, "ci/promptfoo-config.yaml"), "utf8");
  assert.match(promptfoo, /eval-sec-01/);
  assert.match(promptfoo, /eval-sec-13/);
  assert.match(promptfoo, /intent-registry-unique/);
  assert.match(promptfoo, /Not a default CI gate/);
  assert.match(promptfoo, /routing-provider\.sh/);
  const deepteam = fs.readFileSync(path.join(root, "ci/deepteam.yaml"), "utf8");
  assert.match(deepteam, /deepteam_target\.py/);
  assert.match(deepteam, /not a default CI gate/i);
  assert.equal(deepteam.includes("gpt-4"), false);
  const gates = fs.readFileSync(path.join(root, "ci/run-gates.mjs"), "utf8");
  assert.equal(gates.includes("promptfoo"), false);
  assert.equal(gates.includes("deepteam"), false);
  const routed = spawnSync("bash", ["ci/eval/routing-provider.sh", "unslop this release note and remove the robotic cadence"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(routed.status, 0, routed.stderr);
  const parsed = JSON.parse(routed.stdout);
  assert.equal(parsed.sector, "writing");
  assert.equal(parsed.liveModel, false);
});

test("quality loop calls root-cause gate only after done-gate passes", () => {
  const passed = runQualityLoop({
    taskId: "q-ok",
    done: { commandExitCode: 0, expectedArtifacts: [path.join(root, "NOTICE")], testsGreen: true },
    rootCause: {
      changedFiles: ["src/a.ts"],
      targetModule: "src",
      isSymptomFixOnly: false,
      symptomExplanation: "fixed initializer",
      otherModulesMatchingPattern: [],
    },
  });
  assert.equal(passed.done.isDone, true);
  assert.ok(passed.rootCause);
  assert.equal(passed.rootCause.isRootCause, true);

  const failedGate = runQualityLoop({
    taskId: "q-bad",
    done: { commandExitCode: 1, expectedArtifacts: [path.join(root, "NOTICE")], testsGreen: true },
    rootCause: {
      changedFiles: ["src/a.ts"],
      targetModule: "src",
      isSymptomFixOnly: true,
      symptomExplanation: "should not run",
      otherModulesMatchingPattern: ["pkg/b"],
    },
  });
  assert.equal(failedGate.done.isDone, false);
  assert.equal(failedGate.rootCause, null);
  assert.equal(typeof evaluateRootCauseGate, "function");
});

for (const item of tests) {
  try {
    await item.fn();
    console.log(`[PASS] ${item.name}`);
  } catch (err) {
    failed += 1;
    console.error(`[FAIL] ${item.name}`);
    console.error(err);
  }
}

if (failed > 0) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}
console.log("\nAll harness tests passed against the implementation modules.");
