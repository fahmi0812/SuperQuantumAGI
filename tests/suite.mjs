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
import { postPushFactSatisfied } from "../harness/post-push.ts";
import { QUALITY_LOOP_ORDER, runQualityLoop } from "../harness/quality-loop.ts";
import { evaluateRootCauseGate } from "../harness/root-cause-gate.ts";
import { runInSandbox } from "../harness/sandbox/bwrap-runner.ts";
import { applyShellCreateBefore, decideSectorShell } from "../harness/sandbox/sector-shell.cjs";
import { createActiveModelCompleter, normalizeModelRef, resolveActiveModel } from "../routing/active-model.ts";
import { classifyDeterministic } from "../routing/classify.ts";
import { planDispatch, triagePayload } from "../routing/dispatch.ts";
import {
  DISPATCH_LEDGER_RELATIVE,
  compareDispatch,
  emptyLedger,
  noteInvoked,
  notePlanned,
  writeLedger,
} from "../routing/dispatch-ledger.ts";
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

test("done-gate rejects push and RELEASE claims without explicit FACT", () => {
  const base = {
    commandExitCode: 0,
    expectedArtifacts: [path.join(root, "NOTICE")],
    testsGreen: true,
  };
  const pushed = evaluateDoneGate({ ...base, pushRequested: true });
  assert.equal(pushed.isDone, false);

  const remoteOnly = evaluateDoneGate({
    ...base,
    pushRequested: true,
    remoteShaOk: true,
    facts: ["FACT: remote SHA abc"],
  });
  assert.equal(remoteOnly.isDone, false);

  const silentNotConfigured = evaluateDoneGate({
    ...base,
    pushRequested: true,
    remoteShaOk: true,
    ciStatus: "NOT_CONFIGURED",
    facts: ["FACT: remote SHA abc"],
  });
  assert.equal(silentNotConfigured.isDone, false);

  const judgment = evaluateDoneGate({
    ...base,
    pushRequested: true,
    remoteShaOk: true,
    ciStatus: "GREEN",
    facts: ["JUDGMENT: ci looks green", "FACT: remote SHA abc"],
  });
  assert.equal(judgment.isDone, false);

  const explicit = evaluateDoneGate({
    ...base,
    pushRequested: true,
    remoteShaOk: true,
    ciStatus: "NOT_CONFIGURED",
    facts: ["FACT: remote SHA abc", "FACT: ciStatus NOT_CONFIGURED"],
  });
  assert.equal(explicit.isDone, true);
  assert.equal(postPushFactSatisfied({
    remoteShaOk: true,
    ciStatus: "NOT_CONFIGURED",
    facts: ["FACT: remote SHA abc", "FACT: ciStatus NOT_CONFIGURED"],
  }), true);

  const releaseMissingScanner = evaluateDoneGate({
    ...base,
    verificationProfile: "RELEASE",
    releaseGates: { typecheck: "PASS", tests: "PASS", build: "PASS" },
  });
  assert.equal(releaseMissingScanner.isDone, false);

  const releaseScannerNotConfigured = evaluateDoneGate({
    ...base,
    verificationProfile: "RELEASE",
    scannerStatus: "NOT_CONFIGURED",
    releaseGates: { typecheck: "PASS", tests: "PASS", build: "PASS", scanner: "NOT_CONFIGURED" },
  });
  assert.equal(releaseScannerNotConfigured.isDone, false);

  assert.deepEqual(QUALITY_LOOP_ORDER, [
    "local-tests",
    "scanner-if-release",
    "commit",
    "push",
    "verify-remote-sha",
    "verify-ci",
    "fact-ledger",
    "done",
  ]);
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
  assert.equal(routeLayer0("commit push").sector, "coding");
  assert.equal(routeLayer0("commit push").complexity, "Low");
  assert.equal(routeLayer0("commit push").qualityObligation, "post-push");
  assert.equal(routeLayer0("git status").qualityObligation, "none");
  assert.equal(routeLayer0("/verify-push").qualityObligation, "post-push");
  assert.equal(routeLayer0("/blast-radius").slashOnly, true);
  assert.equal(routeLayer0("/why").matched, true);
  assert.equal(routeLayer0("/architect").matched, true);
  assert.equal(routeLayer0("/create-verification-skill").matched, true);
  assert.equal(routeLayer0("/smartdoc").sector, "data-doc-cad");
  assert.equal(routeLayer0("/smartdoc").slashOnly, true);
  assert.equal(routeLayer0("/smartbook").sector, "data-doc-cad");
  assert.equal(routeLayer0("/smartbook").slashOnly, true);
  assert.equal(routeLayer0("what is the blast radius of this diff").matched, false);
  assert.equal(routeLayer0("commit to a new design direction").matched, false);
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
    const plan = planDispatch({
      complexity: routed.complexity,
      sector: routed.sector,
      sectors: routed.sectors,
    });
    if (item.expectedComplexity === "Low") {
      assert.equal(plan.mode, "fast-path");
      assert.equal(plan.subagents.length, 1);
    }
    if (item.expectedComplexity === "High") {
      assert.equal(plan.mode, "serial");
      assert.deepEqual(plan.subagents, [`sectors/${routed.sector}`]);
    }
  }
  const accuracy = correct / cases.length;
  assert.ok(accuracy >= 0.9, `routing accuracy ${accuracy} < 0.9`);
});

test("high single-sector dispatch stays serial and does not add a companion", () => {
  const plan = planDispatch({ complexity: "High", sector: "coding" });
  assert.equal(plan.mode, "serial");
  assert.deepEqual(plan.subagents, ["sectors/coding"]);
  const payload = triagePayload({ sector: "coding", complexity: "High", profile: "Default" });
  assert.equal(payload.dispatch, "serial");
  assert.equal(payload.subagents.includes("sectors/orchestration-quality"), false);
});

test("parallel dispatch uses only named sectors and caps at 3", () => {
  const plan = planDispatch({
    complexity: "High",
    sector: "coding",
    sectors: ["security-pentest", "not-a-sector", "writing", "research", "osint"],
  });
  assert.equal(plan.mode, "parallel");
  assert.deepEqual(plan.subagents, ["sectors/coding", "sectors/security-pentest", "sectors/writing"]);
});

test("low dispatch ignores extra named sectors", () => {
  const plan = planDispatch({
    complexity: "Low",
    sector: "writing",
    sectors: ["coding", "research"],
  });
  assert.equal(plan.mode, "fast-path");
  assert.deepEqual(plan.subagents, ["sectors/writing"]);
});

test("triage parser keeps the primary sector first and at most three names", () => {
  const parsed = parseTriageOutput(
    JSON.stringify({
      sector: "coding",
      complexity: "High",
      profile: "Default",
      sectors: ["security-pentest", "nope", "coding", "research", "osint"],
    }),
  );
  assert.deepEqual(parsed.sectors, ["coding", "security-pentest", "research"]);
  const plan = planDispatch({ complexity: parsed.complexity, sector: parsed.sector, sectors: parsed.sectors });
  assert.equal(plan.mode, "parallel");
  assert.equal(plan.subagents.length, 3);
});

test("dispatch ledger records planned sector against the sector actually invoked", () => {
  const ledger = emptyLedger();
  notePlanned(
    ledger,
    "ses_1",
    {
      plannedSector: "coding",
      dispatch: "serial",
      planned: ["sectors/coding"],
      surface: "fix the pool",
    },
    "2026-10-22T00:00:00.000Z",
  );
  noteInvoked(ledger, "ses_1", "sectors/security-pentest", "2026-10-22T00:00:01.000Z");
  noteInvoked(ledger, "ses_1", "synthesizer", "2026-10-22T00:00:02.000Z");
  const row = ledger.sessions.ses_1;
  assert.match(row.fact, /^FACT: dispatch drift /);
  assert.match(row.fact, /extra=sectors\/security-pentest/);
  assert.equal(row.invoked.includes("synthesizer"), true);
  const compared = compareDispatch({ planned: ["coding"], invoked: ["coding"] });
  assert.match(compared.fact, /^FACT: dispatch planned=sectors\/coding invoked=sectors\/coding$/);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sqagi-dispatch-"));
  const file = path.join(dir, DISPATCH_LEDGER_RELATIVE);
  writeLedger(file, ledger);
  const read = JSON.parse(fs.readFileSync(file, "utf8"));
  assert.equal(read.sessions.ses_1.plannedSector, "coding");
  fs.rmSync(dir, { recursive: true, force: true });
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
  const allKeys = Object.values(SECTOR_SKILL_REGISTRY).flatMap((skills) => skills.map((s) => s.intentKey));
  assert.equal(new Set(allKeys).size, allKeys.length, "all intent keys must be globally unique");
  assert.equal(resolveSkillInSector("motion-media", "react remotion video").skillId, "claude-remotion-skill");
  assert.equal(resolveSkillInSector("reverse-engineering", "android apk frida").skillId, "hypeking");
  assert.equal(resolveSkillInSector("unknown-sector", "anything").status, "manual_fallback");
  assert.equal(resolveSkillInSector("unknown-sector", "anything").skillId, "manual");
  assert.equal(resolveSkillInSector("coding", "no-such-intent").skillId, "manual");
  assert.equal(resolveSkillInSector("coding", "no-such-intent").status, "manual_fallback");
  assert.equal(resolveSkillInSector("coding", "github_ci_ops").skillId, "gh-axi");
  assert.equal(resolveSkillInSector("devops-infra-finance", "github_actions_ci").skillId, "gh-axi");
  assert.equal(resolveSkillInSector("orchestration-quality", "agent_architecture_audit").skillId, "agent-architecture-audit");
  assert.equal(resolveSkillInSector("data-doc-cad", "smartdoc_job").skillId, "smartdoc");
  assert.equal(resolveSkillInSector("data-doc-cad", "smartbook_ingest").skillId, "smartbook-ingest");
  assert.equal(resolveSkillInSector("data-doc-cad", "pelajari modul").skillId, "smartbook-ingest");
  assert.equal(resolveSkillInSector("data-doc-cad", "kerjakan soal").skillId, "smartdoc");
  assert.equal(resolveSkillInSector("devops-infra-finance", "mongodb_ops").skillId, "mongodb-ops");
  assert.equal(resolveSkillInSector("devops-infra-finance", "supabase_ops").skillId, "supabase-ops");
  assert.equal(resolveSkillInSector("devops-infra-finance", "vercel_ops").skillId, "vercel-ops");
  assert.equal(resolveSkillInSector("devops-infra-finance", "automation_audit_ops").skillId, "automation-audit-ops");
  assert.equal(resolveSkillInSector("coding", "mongodb_schema_ops").skillId, "mongodb-ops");
  assert.equal(resolveSkillInSector("coding", "supabase_backend_ops").skillId, "supabase-ops");
  assert.equal(resolveSkillInSector("coding", "vercel_deploy_ops").skillId, "vercel-ops");
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

test("CI bwrap smoke uses the harness builder, not a partial bind", () => {
  const smoke = fs.readFileSync(path.join(root, "ci/bwrap-smoke.mjs"), "utf8");
  const workflow = fs.readFileSync(path.join(root, ".github/workflows/ci.yml"), "utf8");
  assert.match(smoke, /buildBwrapCommand/);
  assert.equal(smoke.includes("--ro-bind /usr /usr"), false);
  assert.match(workflow, /node ci\/bwrap-smoke\.mjs/);
  assert.equal(workflow.includes("bwrap --ro-bind /usr /usr --proc /proc"), false);
  const ran = spawnSync(process.execPath, [path.join(root, "ci/bwrap-smoke.mjs")], {
    cwd: root,
    encoding: "utf8",
    timeout: 20000,
  });
  assert.equal(ran.status, 0, ran.stderr);
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
  assert.equal(src.includes("triagePayload"), true);
  assert.equal(src.includes("noteInvoked"), true);
  assert.equal(src.includes("DISPATCH_LEDGER_RELATIVE"), true);
  assert.equal(fs.readFileSync(path.join(root, "routing/dispatch.ts"), "utf8").includes('"fan-out"'), false);
  assert.equal(src.includes("session.hook(\"context\""), true);
  assert.equal(src.includes("session.generate"), false);
  assert.equal(src.includes("event.prompt.text ="), false);
  assert.equal(src.includes("POST_PUSH_REMINDER"), true);
  assert.match(
    fs.readFileSync(path.join(root, "harness/post-push.ts"), "utf8"),
    /post-push verification pending/,
  );
  assert.equal(src.includes("superq-triage]-error"), false);
  assert.equal(src.includes("classifyDeterministic"), false);
  assert.equal(src.includes("litellm"), false);
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  assert.equal(pkg.engines.node, ">=22");
  assert.equal(pkg.dependencies["@opencode/plugin"], "2.1.2");
  const verification = fs.readFileSync(path.join(root, ".opencode/rules/01-verification.md"), "utf8");
  for (const profile of ["FAST", "STANDARD", "UI", "SECURITY", "PERFORMANCE", "RELEASE"]) {
    assert.match(verification, new RegExp(`## ${profile}`));
  }
  assert.match(verification, /NOT_CONFIGURED/);
  assert.match(verification, /Anti-test-weakening/);
  assert.equal(fs.existsSync(path.join(root, ".opencode/skills/gh-axi/SKILL.md")), true);
  assert.equal(fs.existsSync(path.join(root, ".opencode/commands/blast-radius.md")), true);
  assert.equal(fs.existsSync(path.join(root, ".opencode/commands/why.md")), true);
  assert.equal(fs.existsSync(path.join(root, ".opencode/commands/architect.md")), true);
  assert.equal(fs.existsSync(path.join(root, ".opencode/skills/decision-log/scripts/log.sh")), true);
  const logged = spawnSync("bash", [
    path.join(root, ".opencode/skills/decision-log/scripts/log.sh"),
    path.join(os.tmpdir(), `sqagi-decision-${Date.now()}.tsv`),
    "parity",
    "record fact",
    "test",
    "tests/suite.mjs",
    "FACT: exit 0",
  ], { encoding: "utf8" });
  assert.equal(logged.status, 0);
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
  for (const gone of ["parallel-agents", "systematic-debugging", "unslop", "install-anti-slop", "deep-research-team"]) {
    assert.equal(fs.existsSync(path.join(root, ".opencode/skills", gone, "SKILL.md")), false, gone);
  }
});

test("resolved pins are 40 hex and unresolved URLs stay honest", () => {
  const resolved = [
    "dispatching-parallel-agents",
    "humanizer",
    "rea",
    "diagram-design",
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
  assert.equal(resolveSkillInSector("writing", "unslop this note").skillId, "humanizer");
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

test("smartdoc root resolves explicit, SUPERQ_SMARTDOC, OPENCODE_SMARTDOC, and default", () => {
  const cli = path.join(root, "harness/smartdoc/cli.mjs");

  // 1. Explicit --root
  const explicit = spawnSync("node", [cli, "status", "--root", "/tmp/explicit-test", "--json"], { encoding: "utf8" });
  assert.equal(explicit.status, 0);
  const explicitJson = JSON.parse(explicit.stdout);
  assert.equal(explicitJson.root, "/tmp/explicit-test");

  // 2. SUPERQ_SMARTDOC env
  const superq = spawnSync("node", [cli, "status", "--json"], {
    encoding: "utf8",
    env: { ...process.env, SUPERQ_SMARTDOC: "/tmp/superq-test", OPENCODE_SMARTDOC: "/tmp/opencode-test" },
  });
  assert.equal(superq.status, 0);
  const superqJson = JSON.parse(superq.stdout);
  assert.equal(superqJson.root, "/tmp/superq-test");

  // 3. OPENCODE_SMARTDOC fallback
  const opencodeEnv = { ...process.env };
  delete opencodeEnv.SUPERQ_SMARTDOC;
  opencodeEnv.OPENCODE_SMARTDOC = "/tmp/opencode-fallback";
  const opencode = spawnSync("node", [cli, "status", "--json"], {
    encoding: "utf8",
    env: opencodeEnv,
  });
  assert.equal(opencode.status, 0);
  const opencodeJson = JSON.parse(opencode.stdout);
  assert.equal(opencodeJson.root, "/tmp/opencode-fallback");

  // 4. Default ~/SmartDoc
  const cleanEnv = { ...process.env, HOME: "/tmp/fake-home" };
  delete cleanEnv.SUPERQ_SMARTDOC;
  delete cleanEnv.OPENCODE_SMARTDOC;
  const def = spawnSync("node", [cli, "status", "--json"], {
    encoding: "utf8",
    env: cleanEnv,
  });
  assert.equal(def.status, 0);
  const defJson = JSON.parse(def.stdout);
  assert.equal(defJson.root, "/tmp/fake-home/SmartDoc");
  assert.equal(defJson.capabilities.TXT_WRITE, "READY");
});

test("install script creates symlinks, merges opencode config non-destructively, and uninstalls cleanly", async () => {
  const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), "sqagi-install-test-"));
  const targetDir = path.join(tmpBase, "config");
  const binDir = path.join(tmpBase, "bin");
  fs.mkdirSync(targetDir, { recursive: true });
  fs.mkdirSync(binDir, { recursive: true });

  const initialConfig = {
    provider: { "custom-provider": { url: "http://localhost:1234" } },
    model: "custom-provider/custom-model",
    permissions: [{ action: "custom", effect: "deny" }],
    agent: { custom_agent: { mode: "subagent" } },
    default_agent: "build",
    mcp: {
      servers: {
        sliver: { type: "local", command: ["sliver-server"], disabled: true },
        bunkerweb: { type: "remote", url: "http://127.0.0.1:8081/mcp", disabled: true },
      },
    },
  };
  fs.writeFileSync(path.join(targetDir, "opencode.json"), JSON.stringify(initialConfig, null, 2));

  const installMod = await import("../scripts/install.mjs");
  const installRes = installMod.install({ dryRun: false, targetDir, binDir });
  assert.equal(installRes.success, true);

  assert.equal(fs.existsSync(path.join(targetDir, "agents/orchestrator.md")), true);
  assert.equal(fs.existsSync(path.join(targetDir, "agents/sectors")), true);
  assert.equal(fs.existsSync(path.join(targetDir, "skills/smartdoc")), true);
  assert.equal(fs.existsSync(path.join(targetDir, "commands/blast-radius.md")), true);
  assert.equal(fs.existsSync(path.join(targetDir, "rules/01-verification.md")), true);
  assert.equal(fs.existsSync(path.join(targetDir, "plugins/superquantumagi-global")), true);
  assert.equal(fs.existsSync(path.join(targetDir, "plugins/superquantumagi")), false);
  assert.equal(fs.existsSync(path.join(binDir, "superq")), true);

  const merged = JSON.parse(fs.readFileSync(path.join(targetDir, "opencode.json"), "utf8"));
  assert.equal(merged.default_agent, "orchestrator");
  assert.equal(merged.provider["custom-provider"].url, "http://localhost:1234");
  assert.equal(merged.model, "custom-provider/custom-model");
  assert.equal(merged.agent.custom_agent.mode, "subagent");
  assert.equal(merged.mcp.servers["codebase-memory-mcp"].type, "local");
  assert.equal(merged.mcp.servers.context7.type, "remote");
  assert.equal(merged.mcp.servers.sliver, undefined);
  assert.equal(merged.mcp.servers.bunkerweb, undefined);
  assert.equal(merged.mcp.servers.shadcn, undefined);
  assert.equal(merged.experimental.subagent_depth, 1);

  const uninstallRes = installMod.uninstall({ dryRun: false, targetDir, binDir });
  assert.equal(uninstallRes.success, true);

  assert.equal(fs.existsSync(path.join(targetDir, "agents/orchestrator.md")), false);
  assert.equal(fs.existsSync(path.join(binDir, "superq")), false);

  const restored = JSON.parse(fs.readFileSync(path.join(targetDir, "opencode.json"), "utf8"));
  assert.equal(restored.default_agent, "build");
  assert.equal(restored.provider["custom-provider"].url, "http://localhost:1234");
  assert.equal(restored.model, "custom-provider/custom-model");
  assert.equal(restored.agent.custom_agent.mode, "subagent");
  assert.equal(restored.mcp, undefined);

  fs.rmSync(tmpBase, { recursive: true, force: true });
});

test("project plugin discovery skips the global duplicate inside this checkout", async () => {
  const { projectPluginDiscovered } = await import(
    "../.opencode/plugins/superquantumagi/discover.ts"
  );
  assert.equal(projectPluginDiscovered(root), true);
  assert.equal(projectPluginDiscovered(path.join(root, "scripts")), true);
  assert.equal(projectPluginDiscovered("/tmp"), false);
  assert.equal(projectPluginDiscovered(undefined), false);
  const globalSrc = fs.readFileSync(path.join(root, "harness/plugin-global/index.ts"), "utf8");
  assert.match(globalSrc, /id: "superquantumagi\.global"/);
  assert.match(globalSrc, /realpathSync/);
  assert.equal(/from ["']\.\.\/\.\.\/\.opencode/.test(globalSrc), false);
});

test("parseJsonc keeps commas and comment markers inside strings", async () => {
  const { parseJsonc } = await import("../scripts/install.mjs");
  const parsed = parseJsonc(`{
    "$schema": "https://opencode.ai/config.json",
    // comment with https://example.com
    "note": "see, } here and // not a comment",
    "arr": [1, 2,],
  }`);
  assert.equal(parsed.$schema, "https://opencode.ai/config.json");
  assert.equal(parsed.note, "see, } here and // not a comment");
  assert.deepEqual(parsed.arr, [1, 2]);
});

test("install refuses to rewrite an unparseable config and writes nothing", async () => {
  const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), "sqagi-install-bad-"));
  const targetDir = path.join(tmpBase, "config");
  const binDir = path.join(tmpBase, "bin");
  fs.mkdirSync(targetDir, { recursive: true });
  const configPath = path.join(targetDir, "opencode.json");
  const raw = "{ not json,\n";
  fs.writeFileSync(configPath, raw);

  const { install } = await import("../scripts/install.mjs");
  const result = install({ dryRun: false, targetDir, binDir });
  assert.equal(result.success, false);
  assert.equal(fs.readFileSync(configPath, "utf8"), raw);
  assert.equal(fs.existsSync(path.join(targetDir, "agents/orchestrator.md")), false);
  assert.equal(fs.existsSync(path.join(targetDir, "superquantumagi.json")), false);

  const cli = spawnSync(
    "node",
    ["scripts/install.mjs", "--target-dir", targetDir, "--bin-dir", binDir],
    { cwd: root, encoding: "utf8" },
  );
  assert.notEqual(cli.status, 0);
  assert.equal(fs.readFileSync(configPath, "utf8"), raw);
  fs.rmSync(tmpBase, { recursive: true, force: true });
});

test("install dry-run does not write config or symlinks", async () => {
  const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), "sqagi-install-dry-"));
  const targetDir = path.join(tmpBase, "config");
  const binDir = path.join(tmpBase, "bin");
  fs.mkdirSync(targetDir, { recursive: true });
  const configPath = path.join(targetDir, "opencode.json");
  const raw = JSON.stringify({ default_agent: "build", provider: { p: { url: "http://127.0.0.1:9" } } });
  fs.writeFileSync(configPath, raw);

  const { install } = await import("../scripts/install.mjs");
  const result = install({ dryRun: true, targetDir, binDir });
  assert.equal(result.success, true);
  assert.equal(fs.readFileSync(configPath, "utf8"), raw);
  assert.equal(fs.existsSync(path.join(targetDir, "agents")), false);
  assert.equal(fs.existsSync(path.join(binDir, "superq")), false);
  fs.rmSync(tmpBase, { recursive: true, force: true });
});

test("reinstall preserves restore baseline, user additions, and drops stale repo symlinks", async () => {
  const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), "sqagi-install-re-"));
  const targetDir = path.join(tmpBase, "config");
  const binDir = path.join(tmpBase, "bin");
  fs.mkdirSync(targetDir, { recursive: true });
  fs.mkdirSync(binDir, { recursive: true });
  const configPath = path.join(targetDir, "opencode.json");
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      default_agent: "build",
      provider: { p: { url: "http://127.0.0.1:9" } },
      instructions: ["keep-me", "notes/01-verification.md-local"],
      experimental: { keep: true, subagent_depth: 2 },
    }),
  );

  const { install, uninstall } = await import("../scripts/install.mjs");
  assert.equal(install({ dryRun: false, targetDir, binDir }).success, true);

  const stale = path.join(targetDir, "skills/stale-skill");
  fs.symlinkSync(path.join(root, ".opencode/skills/smartdoc"), stale);
  const manifestPath = path.join(targetDir, "superquantumagi.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  manifest.managedFiles.push(stale);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));

  const mid = JSON.parse(fs.readFileSync(configPath, "utf8"));
  mid.mcp.servers["user-extra"] = { type: "local", command: ["echo"] };
  mid.mcp.servers["codebase-memory-mcp"] = { type: "local", command: ["custom-memory"] };
  mid.experimental.extra = true;
  fs.writeFileSync(configPath, JSON.stringify(mid));

  assert.equal(install({ dryRun: false, targetDir, binDir }).success, true);
  assert.equal(fs.existsSync(stale), false);

  const again = JSON.parse(fs.readFileSync(configPath, "utf8"));
  assert.equal(again.default_agent, "orchestrator");
  assert.equal(again.provider.p.url, "http://127.0.0.1:9");
  assert.equal(again.mcp.servers["user-extra"].command[0], "echo");
  assert.equal(again.mcp.servers["codebase-memory-mcp"].command[0], "custom-memory");
  assert.equal(again.experimental.extra, true);
  assert.equal(again.experimental.keep, true);
  assert.equal(again.experimental.subagent_depth, 1);
  assert.ok(again.instructions.includes("keep-me"));
  assert.ok(again.instructions.includes("notes/01-verification.md-local"));

  const restoredManifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  assert.equal(restoredManifest.previousDefaultAgent, "build");
  assert.equal(restoredManifest.hadExperimental, true);
  assert.equal(restoredManifest.previousSubagentDepth, 2);

  assert.equal(uninstall({ dryRun: false, targetDir, binDir }).success, true);
  const restored = JSON.parse(fs.readFileSync(configPath, "utf8"));
  assert.equal(restored.default_agent, "build");
  assert.equal(restored.provider.p.url, "http://127.0.0.1:9");
  assert.equal(restored.mcp.servers["user-extra"].command[0], "echo");
  assert.equal(restored.mcp.servers["codebase-memory-mcp"].command[0], "custom-memory");
  assert.equal(restored.mcp.servers.sliver, undefined);
  assert.equal(restored.experimental.keep, true);
  assert.equal(restored.experimental.extra, true);
  assert.equal(restored.experimental.subagent_depth, 2);
  assert.ok(restored.instructions.includes("keep-me"));
  assert.ok(restored.instructions.includes("notes/01-verification.md-local"));
  assert.equal(
    restored.instructions.includes("~/.config/opencode/rules/01-verification.md"),
    false,
  );
  fs.rmSync(tmpBase, { recursive: true, force: true });
});

test("wave skill-repos-20261024 invariants", async () => {
  const agents = fs.readFileSync(path.join(root, "AGENTS.md"), "utf8");
  assert.match(agents, /9router/);
  assert.match(agents, /11 sektor|11 sector/i);
  assert.match(agents, /max_iterations\s*=\s*3|anti-spin[^\n]*3/i);

  const jsonc = fs.readFileSync(path.join(root, ".opencode/opencode.jsonc"), "utf8");
  assert.match(jsonc, /codebase-memory-mcp@0\.12\.1/);
  assert.match(jsonc, /@jshookmcp\/jshook@0\.4\.2/);

  const skillRoot = path.join(root, ".opencode/skills");
  for (const banned of ["design-bank", "impeccable", "frontend-design"]) {
    assert.equal(fs.existsSync(path.join(skillRoot, banned)), false, banned);
  }

  for (const id of [
    "honey",
    "brainstorming",
    "writing-plans",
    "verification-before-completion",
  ]) {
    assert.equal(fs.existsSync(path.join(skillRoot, id, "SKILL.md")), true, `${id} SKILL.md`);
    assert.equal(fs.existsSync(path.join(skillRoot, id, "PROVENANCE.md")), true, `${id} PROVENANCE.md`);
  }

  const demoProv = fs.readFileSync(path.join(skillRoot, "demo-video", "PROVENANCE.md"), "utf8");
  assert.match(demoProv, /767bfb818880c9f38bb02873d3d67141a3e62250/);

  const { parseJsonc } = await import("../scripts/install.mjs");
  const cfg = parseJsonc(jsonc);
  const keys = [];
  const walk = (value) => {
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      keys.push(key);
      walk(child);
    }
  };
  walk(cfg);
  const joined = keys.join("\n");
  assert.equal(/litellm/i.test(joined), false);
  assert.equal(/jev-model-router/i.test(joined), false);
  assert.equal(cfg.mcp.servers.sliver, undefined);
  assert.equal(cfg.mcp.servers.bunkerweb, undefined);
  assert.equal(cfg.mcp.servers.shadcn, undefined);
  assert.equal(cfg.mcp.servers.strix, undefined);
});

test("uninstall refuses to guess when the manifest is missing", async () => {
  const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), "sqagi-uninstall-missing-"));
  const targetDir = path.join(tmpBase, "config");
  const binDir = path.join(tmpBase, "bin");
  fs.mkdirSync(targetDir, { recursive: true });
  const configPath = path.join(targetDir, "opencode.json");
  fs.writeFileSync(configPath, JSON.stringify({ default_agent: "orchestrator", provider: { p: 1 } }));

  const { uninstall } = await import("../scripts/install.mjs");
  const result = uninstall({ dryRun: false, targetDir, binDir });
  assert.equal(result.success, false);
  const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
  assert.equal(cfg.default_agent, "orchestrator");
  assert.equal(cfg.provider.p, 1);
  fs.rmSync(tmpBase, { recursive: true, force: true });
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
