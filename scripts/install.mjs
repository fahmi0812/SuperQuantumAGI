#!/usr/bin/env node
/**
 * SuperQuantumAGI Installer & Global Configuration Synchronizer for OpenCode.
 *
 * Installs SuperQuantumAGI components into the OpenCode user config directory
 * (~/.config/opencode/) with symlinks and a non-destructive JSON merge.
 *
 * Reinstall reads superquantumagi.json as the restore baseline. It does not
 * treat the already-patched config as the user's original. Uninstall refuses
 * to guess when that manifest is missing or unreadable.
 *
 * Usage:
 *   node scripts/install.mjs [--dry-run] [--uninstall] [--target-dir <path>] [--bin-dir <path>]
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

export const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const MANAGED_INSTRUCTIONS = [
  "~/.config/opencode/rules/01-verification.md",
  "~/.config/opencode/rules/decision-log-protocol.md",
];

function hasOwn(obj, key) {
  return !!obj && Object.prototype.hasOwnProperty.call(obj, key);
}

function stable(value) {
  return JSON.stringify(value);
}

function fail(message, report = []) {
  console.error(`[FAIL] ${message}`);
  return { success: false, error: message, report };
}

function stripComments(content) {
  let insideString = false;
  let insideSingleLineComment = false;
  let insideMultiLineComment = false;
  let escaped = false;
  let result = "";

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (insideSingleLineComment) {
      if (char === "\n" || char === "\r") {
        insideSingleLineComment = false;
        result += char;
      }
      continue;
    }

    if (insideMultiLineComment) {
      if (char === "*" && nextChar === "/") {
        insideMultiLineComment = false;
        i++;
      }
      continue;
    }

    if (insideString) {
      result += char;
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        insideString = false;
      }
      continue;
    }

    if (char === '"') {
      insideString = true;
      escaped = false;
      result += char;
      continue;
    }

    if (char === "/" && nextChar === "/") {
      insideSingleLineComment = true;
      i++;
      continue;
    }

    if (char === "/" && nextChar === "*") {
      insideMultiLineComment = true;
      i++;
      continue;
    }

    result += char;
  }

  return result;
}

function stripTrailingCommas(content) {
  let insideString = false;
  let escaped = false;
  let result = "";

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (insideString) {
      result += char;
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        insideString = false;
      }
      continue;
    }

    if (char === '"') {
      insideString = true;
      escaped = false;
      result += char;
      continue;
    }

    if (char === ",") {
      let j = i + 1;
      while (j < content.length && /\s/.test(content[j])) j++;
      if (content[j] === "}" || content[j] === "]") {
        i = j - 1;
        continue;
      }
    }

    result += char;
  }

  return result;
}

export function parseJsonc(content) {
  if (!content || !content.trim()) return {};
  return JSON.parse(stripTrailingCommas(stripComments(content)));
}

export function parseArgs(argv = process.argv.slice(2)) {
  const options = {
    dryRun: false,
    uninstall: false,
    targetDir: process.env.OPENCODE_CONFIG_DIR || path.join(os.homedir(), ".config/opencode"),
    binDir: process.env.SUPERQ_BIN_DIR || path.join(os.homedir(), ".local/bin"),
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--uninstall") {
      options.uninstall = true;
    } else if (arg === "--target-dir" && argv[i + 1]) {
      options.targetDir = path.resolve(argv[++i]);
    } else if (arg === "--bin-dir" && argv[i + 1]) {
      options.binDir = path.resolve(argv[++i]);
    } else if (arg === "-h" || arg === "--help") {
      console.log(`Usage: node scripts/install.mjs [options]
Options:
  --dry-run             Preview changes without touching filesystem
  --uninstall           Remove SuperQuantumAGI symlinks and restore config
  --target-dir <path>   OpenCode config directory (default: ~/.config/opencode)
  --bin-dir <path>      CLI symlink directory (default: ~/.local/bin)
  -h, --help            Show this help message`);
      process.exit(0);
    }
  }

  return options;
}

function safeSymlink(target, linkPath, dryRun, managedList) {
  const relLink = path.relative(path.dirname(linkPath), target);
  if (fs.existsSync(linkPath) || fs.lstatSync(linkPath, { throwIfNoEntry: false })) {
    const stat = fs.lstatSync(linkPath);
    if (stat.isSymbolicLink()) {
      const existing = fs.readlinkSync(linkPath);
      if (existing === target || existing === relLink) {
        if (managedList) managedList.push(linkPath);
        return { status: "already_linked", path: linkPath };
      }
      if (!dryRun) {
        fs.unlinkSync(linkPath);
        fs.symlinkSync(target, linkPath);
      }
      if (managedList) managedList.push(linkPath);
      return { status: "updated_symlink", path: linkPath };
    }
    return { status: "skipped_existing_real_path", path: linkPath };
  }

  if (!dryRun) {
    fs.mkdirSync(path.dirname(linkPath), { recursive: true });
    fs.symlinkSync(target, linkPath);
  }
  if (managedList) managedList.push(linkPath);
  return { status: "created_symlink", path: linkPath };
}

function pointsIntoRepo(linkPath) {
  try {
    const stat = fs.lstatSync(linkPath);
    if (!stat.isSymbolicLink()) return false;
    const raw = fs.readlinkSync(linkPath);
    const resolved = path.resolve(path.dirname(linkPath), raw);
    const rootWithSep = ROOT_DIR.endsWith(path.sep) ? ROOT_DIR : `${ROOT_DIR}${path.sep}`;
    return resolved === ROOT_DIR || resolved.startsWith(rootWithSep);
  } catch {
    return false;
  }
}

function resolveConfigPath(targetDir) {
  const jsonc = path.join(targetDir, "opencode.jsonc");
  if (fs.existsSync(jsonc)) return jsonc;
  return path.join(targetDir, "opencode.json");
}

function readParsedConfig(configPath) {
  if (!fs.existsSync(configPath)) return { existed: false, config: {} };
  return { existed: true, config: parseJsonc(fs.readFileSync(configPath, "utf8")) };
}

function installLinks(targetDir, binDir, dryRun, managedFiles, report) {
  const linkChildren = (srcDir, dstDir, label, filter) => {
    if (!fs.existsSync(srcDir)) return;
    for (const item of fs.readdirSync(srcDir)) {
      const srcItem = path.join(srcDir, item);
      if (filter && !filter(item, srcItem)) continue;
      const res = safeSymlink(srcItem, path.join(dstDir, item), dryRun, managedFiles);
      report.push(`${label}: ${item} -> ${res.status}`);
    }
  };

  linkChildren(path.join(ROOT_DIR, ".opencode/agents"), path.join(targetDir, "agents"), "agent");
  linkChildren(
    path.join(ROOT_DIR, ".opencode/skills"),
    path.join(targetDir, "skills"),
    "skill",
    (_item, srcItem) => fs.statSync(srcItem).isDirectory(),
  );
  linkChildren(
    path.join(ROOT_DIR, ".opencode/commands"),
    path.join(targetDir, "commands"),
    "command",
    (item) => item.endsWith(".md"),
  );
  linkChildren(
    path.join(ROOT_DIR, ".opencode/rules"),
    path.join(targetDir, "rules"),
    "rule",
    (item) => item.endsWith(".md"),
  );

  const pluginSrcDir = path.join(ROOT_DIR, ".opencode/plugins/superquantumagi");
  if (fs.existsSync(pluginSrcDir)) {
    const res = safeSymlink(
      pluginSrcDir,
      path.join(targetDir, "plugins/superquantumagi"),
      dryRun,
      managedFiles,
    );
    report.push(`plugin: superquantumagi -> ${res.status}`);
  }

  const cliSrc = path.join(ROOT_DIR, "harness/smartdoc/cli.mjs");
  if (fs.existsSync(cliSrc)) {
    if (!dryRun) {
      try {
        fs.chmodSync(cliSrc, 0o755);
      } catch {
        // A read-only checkout can still be linked.
      }
    }
    const superq = safeSymlink(cliSrc, path.join(binDir, "superq"), dryRun, managedFiles);
    const smartdoc = safeSymlink(cliSrc, path.join(binDir, "smartdoc-cli"), dryRun, managedFiles);
    report.push(`bin: superq -> ${superq.status}`);
    report.push(`bin: smartdoc-cli -> ${smartdoc.status}`);
  }
}

function removeStaleRepoLinks(priorManifest, managedFiles, dryRun, report) {
  if (!priorManifest || !Array.isArray(priorManifest.managedFiles)) return;
  const keep = new Set(managedFiles);
  for (const oldPath of priorManifest.managedFiles) {
    if (keep.has(oldPath)) continue;
    if (!pointsIntoRepo(oldPath)) continue;
    if (!dryRun) fs.unlinkSync(oldPath);
    report.push(`removed stale symlink: ${oldPath}`);
  }
}

export function install(options) {
  const { dryRun, targetDir, binDir } = options;
  const manifestPath = path.join(targetDir, "superquantumagi.json");
  const report = [];

  console.log(`[SuperQuantumAGI Installer] Source: ${ROOT_DIR}`);
  console.log(`[SuperQuantumAGI Installer] Target: ${targetDir}`);
  console.log(`[SuperQuantumAGI Installer] Bin:    ${binDir}`);
  if (dryRun) console.log(`[SuperQuantumAGI Installer] Mode:   DRY RUN (no disk writes)\n`);

  const configPath = resolveConfigPath(targetDir);
  let existingConfig = {};
  try {
    existingConfig = readParsedConfig(configPath).config;
  } catch (err) {
    return fail(`Refusing to rewrite unparseable config ${configPath}: ${err.message}`, report);
  }

  let repoTemplate = {};
  const repoTemplatePath = path.join(ROOT_DIR, ".opencode/opencode.jsonc");
  if (fs.existsSync(repoTemplatePath)) {
    try {
      repoTemplate = parseJsonc(fs.readFileSync(repoTemplatePath, "utf8"));
    } catch (err) {
      return fail(`Refusing to install from unparseable template ${repoTemplatePath}: ${err.message}`, report);
    }
  }

  let priorManifest = null;
  if (fs.existsSync(manifestPath)) {
    try {
      priorManifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    } catch (err) {
      return fail(`Refusing to replace unreadable manifest ${manifestPath}: ${err.message}`, report);
    }
  }
  const hasPrior = priorManifest !== null;

  const previousDefaultAgent = hasPrior
    ? priorManifest.previousDefaultAgent ?? null
    : existingConfig.default_agent ?? null;
  const hadMcp = hasPrior ? !!priorManifest.hadMcp : !!existingConfig.mcp;
  const hadExperimental = hasPrior ? !!priorManifest.hadExperimental : !!existingConfig.experimental;
  const ownedSubagentDepth = hasOwn(priorManifest, "ownedSubagentDepth")
    ? !!priorManifest.ownedSubagentDepth
    : hasPrior
      ? !priorManifest.hadExperimental
      : existingConfig.experimental?.subagent_depth === undefined;
  const previousSubagentDepth = hasOwn(priorManifest, "previousSubagentDepth")
    ? priorManifest.previousSubagentDepth
    : hasPrior
      ? null
      : existingConfig.experimental?.subagent_depth ?? null;

  const managedInstructions = Array.isArray(priorManifest?.managedInstructions)
    ? priorManifest.managedInstructions
    : hasPrior
      ? [...MANAGED_INSTRUCTIONS]
      : MANAGED_INSTRUCTIONS.filter((item) => !(existingConfig.instructions || []).includes(item));

  const templateServers = repoTemplate.mcp?.servers || {};
  const templateTimeout = repoTemplate.mcp?.timeout || {
    startup: 30000,
    catalog: 30000,
    execution: 600000,
  };
  const priorSnapshot = hasOwn(priorManifest, "managedServerSnapshot")
    ? priorManifest.managedServerSnapshot
    : null;
  const currentServers = { ...(existingConfig.mcp?.servers || {}) };
  const nextSnapshot = {};
  for (const [name, def] of Object.entries(templateServers)) {
    const current = currentServers[name];
    const prior = priorSnapshot ? priorSnapshot[name] : undefined;
    if (priorSnapshot && current && prior && stable(current) !== stable(prior)) {
      nextSnapshot[name] = prior;
      report.push(`mcp: ${name} -> kept user override`);
      continue;
    }
    currentServers[name] = def;
    nextSnapshot[name] = def;
  }

  const currentTimeout = existingConfig.mcp?.timeout;
  const ownedMcpTimeout = hasOwn(priorManifest, "ownedMcpTimeout")
    ? !!priorManifest.ownedMcpTimeout
    : hasPrior
      ? !priorManifest.hadMcp
      : !currentTimeout;
  let timeout = currentTimeout;
  let managedTimeoutSnapshot = priorManifest?.managedTimeoutSnapshot;
  if (!timeout) {
    timeout = templateTimeout;
    managedTimeoutSnapshot = templateTimeout;
  } else if (
    ownedMcpTimeout &&
    (!managedTimeoutSnapshot || stable(timeout) === stable(managedTimeoutSnapshot))
  ) {
    timeout = templateTimeout;
    managedTimeoutSnapshot = templateTimeout;
  }

  const mergedConfig = { ...existingConfig };
  mergedConfig.default_agent = "orchestrator";
  mergedConfig.experimental = {
    ...(existingConfig.experimental || {}),
    subagent_depth: 1,
  };
  const currentInstructions = Array.isArray(existingConfig.instructions)
    ? [...existingConfig.instructions]
    : [];
  for (const inst of MANAGED_INSTRUCTIONS) {
    if (!currentInstructions.includes(inst)) currentInstructions.push(inst);
  }
  mergedConfig.instructions = currentInstructions;
  if (Object.keys(templateServers).length > 0 || existingConfig.mcp) {
    mergedConfig.mcp = {
      ...(existingConfig.mcp || {}),
      timeout,
      servers: currentServers,
    };
  }

  const managedFiles = [];
  installLinks(targetDir, binDir, dryRun, managedFiles, report);
  removeStaleRepoLinks(priorManifest, managedFiles, dryRun, report);

  const manifest = {
    installedAt: new Date().toISOString(),
    repoRoot: ROOT_DIR,
    previousDefaultAgent,
    previousSubagentDepth,
    ownedSubagentDepth,
    hadMcp,
    hadExperimental,
    ownedMcpTimeout,
    managedTimeoutSnapshot: managedTimeoutSnapshot || null,
    configPath,
    managedFiles,
    managedServers: Object.keys(templateServers),
    managedServerSnapshot: nextSnapshot,
    managedInstructions,
  };

  if (!dryRun) {
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(configPath, `${JSON.stringify(mergedConfig, null, 2)}\n`, "utf8");
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  }
  report.push(`config: ${path.basename(configPath)} -> merged default_agent, instructions, mcp`);
  report.push(`manifest: superquantumagi.json -> recorded ${managedFiles.length} managed items`);

  console.log(`[PASS] Installation completed:`);
  for (const line of report) console.log(`  - ${line}`);
  console.log(`\nSuperQuantumAGI is now active globally. Default agent: orchestrator.`);
  return { success: true, manifest, report };
}

function restoreConfig(cfg, manifest, report) {
  if (cfg.default_agent === "orchestrator") {
    if (manifest.previousDefaultAgent) {
      cfg.default_agent = manifest.previousDefaultAgent;
    } else {
      delete cfg.default_agent;
    }
  }

  const managedInstructions = new Set(
    Array.isArray(manifest.managedInstructions) && manifest.managedInstructions.length > 0
      ? manifest.managedInstructions
      : MANAGED_INSTRUCTIONS,
  );
  if (Array.isArray(cfg.instructions)) {
    cfg.instructions = cfg.instructions.filter((item) => !managedInstructions.has(item));
    if (cfg.instructions.length === 0) delete cfg.instructions;
  }

  if (cfg.mcp && Array.isArray(manifest.managedServers)) {
    if (cfg.mcp.servers) {
      for (const name of manifest.managedServers) {
        const current = cfg.mcp.servers[name];
        const snapshot = manifest.managedServerSnapshot?.[name];
        if (snapshot && current && stable(current) !== stable(snapshot)) {
          report.push(`kept customized mcp server: ${name}`);
          continue;
        }
        delete cfg.mcp.servers[name];
      }
      if (Object.keys(cfg.mcp.servers).length === 0) delete cfg.mcp.servers;
    }
    const ownedTimeout = hasOwn(manifest, "ownedMcpTimeout")
      ? !!manifest.ownedMcpTimeout
      : !manifest.hadMcp;
    if (ownedTimeout && cfg.mcp.timeout) {
      const snap = manifest.managedTimeoutSnapshot;
      const unchanged = !snap || stable(cfg.mcp.timeout) === stable(snap);
      const remaining = cfg.mcp.servers ? Object.keys(cfg.mcp.servers) : [];
      if (unchanged && remaining.length === 0) delete cfg.mcp.timeout;
    }
    if (cfg.mcp && Object.keys(cfg.mcp).length === 0) delete cfg.mcp;
  }

  if (cfg.experimental) {
    const ownedDepth = hasOwn(manifest, "ownedSubagentDepth")
      ? !!manifest.ownedSubagentDepth
      : !manifest.hadExperimental;
    if (ownedDepth && cfg.experimental.subagent_depth === 1) {
      delete cfg.experimental.subagent_depth;
    } else if (
      !ownedDepth &&
      manifest.previousSubagentDepth !== undefined &&
      manifest.previousSubagentDepth !== null
    ) {
      cfg.experimental.subagent_depth = manifest.previousSubagentDepth;
    }
    if (Object.keys(cfg.experimental).length === 0) delete cfg.experimental;
  }
}

export function uninstall(options) {
  const { dryRun, targetDir } = options;
  const manifestPath = path.join(targetDir, "superquantumagi.json");
  const report = [];

  console.log(`[SuperQuantumAGI Uninstaller] Target: ${targetDir}`);
  if (dryRun) console.log(`[SuperQuantumAGI Uninstaller] Mode:   DRY RUN\n`);

  if (!fs.existsSync(manifestPath)) {
    return fail(
      "Refusing to uninstall without superquantumagi.json. Config restore would be a guess.",
      report,
    );
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (err) {
    return fail(`Refusing to uninstall with unreadable manifest: ${err.message}`, report);
  }

  const configPath = manifest.configPath || path.join(targetDir, "opencode.json");
  let cfg = null;
  if (fs.existsSync(configPath)) {
    try {
      cfg = parseJsonc(fs.readFileSync(configPath, "utf8"));
    } catch (err) {
      return fail(`Refusing to rewrite unparseable config ${configPath}: ${err.message}`, report);
    }
  }

  if (Array.isArray(manifest.managedFiles)) {
    for (const filePath of manifest.managedFiles) {
      if (!(fs.existsSync(filePath) || fs.lstatSync(filePath, { throwIfNoEntry: false }))) continue;
      try {
        const stat = fs.lstatSync(filePath);
        if (!stat.isSymbolicLink()) continue;
        if (!dryRun) fs.unlinkSync(filePath);
        report.push(`removed symlink: ${filePath}`);
      } catch (err) {
        report.push(`failed removing ${filePath}: ${err.message}`);
      }
    }
  }

  if (cfg) {
    restoreConfig(cfg, manifest, report);
    if (!dryRun) fs.writeFileSync(configPath, `${JSON.stringify(cfg, null, 2)}\n`, "utf8");
    report.push(`restored config: ${path.basename(configPath)}`);
  }

  if (!dryRun) fs.unlinkSync(manifestPath);
  report.push("removed manifest: superquantumagi.json");

  console.log(`[PASS] Uninstallation completed:`);
  for (const line of report) console.log(`  - ${line}`);
  return { success: true, report };
}

function runCli() {
  const options = parseArgs();
  const result = options.uninstall ? uninstall(options) : install(options);
  if (!result?.success) process.exit(1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  runCli();
}
