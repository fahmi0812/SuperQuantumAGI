/**
 * Runtime policy shared by the OpenCode plugin and the test suite.
 * Offensive checks match MCP action names and shell executables only.
 * They must not match grep/read/edit resources that merely mention those names.
 */

const fs = require("fs");
const path = require("path");

const OFFENSIVE_SERVERS = [
  "sliver",
  "adaptixc2",
  "pentagi",
  "strix",
  "caldera",
  "mythic",
  "decepticon",
  "bunkerweb",
];

const RE_ANALYSIS_SERVERS = ["ghidra", "jshook", "idapro"];

const OFFENSIVE_BINARIES = new Set([
  "sliver",
  "sliver-server",
  "sliver-client",
  "adaptix-server",
  "adaptixc2",
  "caldera",
  "mythic-cli",
  "decepticon",
]);

const OFFENSIVE_MCP_ACTION = /^(sliver|adaptixc2|pentagi|strix|caldera|mythic|decepticon|bunkerweb)_/i;

function basename(targetPath) {
  const parts = String(targetPath).split(/[/\\]/);
  return parts[parts.length - 1] || String(targetPath);
}

function canonicalAgentId(agentId) {
  if (!agentId) return "";
  const parts = String(agentId).split("/");
  return parts[parts.length - 1] || String(agentId);
}

function assertProfilesDisjoint() {
  const overlap = RE_ANALYSIS_SERVERS.filter((name) => OFFENSIVE_SERVERS.includes(name));
  if (overlap.length > 0) {
    throw new Error(`re-analysis must not enable offensive servers: ${overlap.join(", ")}`);
  }
}

function checkWritePermission(agentId, targetPath) {
  const base = basename(targetPath);
  if (base === "task_plan.md" || base === "findings.md") {
    if (agentId === "synthesizer") return { allowed: true };
    return {
      allowed: false,
      reason: `ANTI-RACE VIOLATION: Agent '${agentId}' is not authorized to edit '${base}'. ONLY synthesizer is allowed.`,
    };
  }

  if (base.startsWith("progress.") && base.endsWith(".md")) {
    const expected = `progress.${canonicalAgentId(agentId)}.md`;
    if (base !== expected && agentId !== "synthesizer") {
      return {
        allowed: false,
        reason: `ISOLATION VIOLATION: Agent '${agentId}' cannot edit '${base}'.`,
      };
    }
  }

  return { allowed: true };
}

function commandInvokesOffensiveBinary(command) {
  return String(command)
    .split(/&&|\|\||;|\|/)
    .some((segment) => {
      const token = segment.trim().split(/\s+/)[0] || "";
      const executable = token.split(/[/\\]/).pop();
      return OFFENSIVE_BINARIES.has(executable);
    });
}

function isOffensiveInvocation(action, resources) {
  if (OFFENSIVE_MCP_ACTION.test(String(action || ""))) return true;
  if (action !== "shell") return false;
  return (resources || []).some(commandInvokesOffensiveBinary);
}

function verifyPentestAuthorization({ args, consentFilePath, now = Date.now() }) {
  const hasPentestFlag = Array.isArray(args) && args.includes("--pentest");
  if (!hasPentestFlag) {
    return { allowed: false, reason: "REJECTED: Missing mandatory '--pentest' flag." };
  }
  if (!consentFilePath || !fs.existsSync(consentFilePath)) {
    return { allowed: false, reason: `REJECTED: Consent file not found at '${consentFilePath}'.` };
  }
  if (String(consentFilePath).includes(".example.")) {
    return { allowed: false, reason: "REJECTED: Example consent templates are not live authorization." };
  }

  try {
    const data = JSON.parse(fs.readFileSync(consentFilePath, "utf8"));
    if (data.example_only === true) {
      return { allowed: false, reason: "REJECTED: example_only consent cannot authorize offensive execution." };
    }
    if (!data.authorization || !data.scope || !data.signature_verification) {
      return { allowed: false, reason: "REJECTED: Consent file is missing required authorization/scope/signature fields." };
    }
    if (data.signature_verification.status !== "APPROVED") {
      return { allowed: false, reason: "REJECTED: Consent file signature is not APPROVED." };
    }
    const expiresAt = Date.parse(data.authorization.expires_at || "");
    if (!Number.isFinite(expiresAt) || expiresAt <= now) {
      return { allowed: false, reason: "REJECTED: Consent file is expired." };
    }
    if (!Array.isArray(data.scope.allowed_targets) || data.scope.allowed_targets.length === 0) {
      return { allowed: false, reason: "REJECTED: Consent scope has no allowed targets." };
    }
    return { allowed: true, scope: data.scope };
  } catch (err) {
    return { allowed: false, reason: `REJECTED: Failed to parse consent file: ${err.message}` };
  }
}

function isPentestAuthorized(directory, now = Date.now()) {
  if (!directory) return false;
  const markerPath = path.join(directory, "runtime", "pentest.authorized.json");
  if (!fs.existsSync(markerPath)) return false;
  try {
    const marker = JSON.parse(fs.readFileSync(markerPath, "utf8"));
    if (marker.flag !== "--pentest") return false;
    if (marker.expiresAt && Date.parse(marker.expiresAt) <= now) return false;
    const consentPath = path.resolve(directory, marker.consentFile || "");
    return verifyPentestAuthorization({ args: ["--pentest"], consentFilePath: consentPath, now }).allowed === true;
  } catch {
    return false;
  }
}

function evaluateRuntimePermission({ agent, action, resources, directory, now }) {
  const list = Array.isArray(resources) ? resources : [];

  if (action === "edit" || action === "write") {
    for (const resource of list) {
      const decision = checkWritePermission(agent, resource);
      if (!decision.allowed) return { effect: "deny", message: decision.reason };
    }
  }

  if (isOffensiveInvocation(action, list) && !isPentestAuthorized(directory, now)) {
    return {
      effect: "deny",
      message:
        "NFR11: offensive execution rejected. Required: --pentest authorization marker and a valid non-example consent/scope file.",
    };
  }

  return { effect: null, message: null };
}

module.exports = {
  OFFENSIVE_SERVERS,
  RE_ANALYSIS_SERVERS,
  assertProfilesDisjoint,
  canonicalAgentId,
  checkWritePermission,
  commandInvokesOffensiveBinary,
  isOffensiveInvocation,
  verifyPentestAuthorization,
  isPentestAuthorized,
  evaluateRuntimePermission,
};
