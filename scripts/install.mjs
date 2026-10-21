#!/usr/bin/env node
/**
 * SuperQuantumAGI Installer & Global Configuration Synchronizer for OpenCode.
 *
 * Installs SuperQuantumAGI components into OpenCode user configuration directory (~/.config/opencode/)
 * using deterministic symlinks and non-destructive JSON merging.
 *
 * Usage:
 *   node scripts/install.mjs [--dry-run] [--uninstall] [--target-dir <path>] [--bin-dir <path>]
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

export const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function parseJsonc(content) {
  if (!content || !content.trim()) return {};
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

  const clean = result.replace(/,\s*([}\]])/g, "$1");
  return JSON.parse(clean);
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
    // Existing real file or directory not owned by us
    return { status: "skipped_existing_real_path", path: linkPath };
  }

  if (!dryRun) {
    fs.mkdirSync(path.dirname(linkPath), { recursive: true });
    fs.symlinkSync(target, linkPath);
  }
  if (managedList) managedList.push(linkPath);
  return { status: "created_symlink", path: linkPath };
}

export function install(options) {
  const { dryRun, targetDir, binDir } = options;
  const manifestPath = path.join(targetDir, "superquantumagi.json");
  const managedFiles = [];
  const report = [];

  console.log(`[SuperQuantumAGI Installer] Source: ${ROOT_DIR}`);
  console.log(`[SuperQuantumAGI Installer] Target: ${targetDir}`);
  console.log(`[SuperQuantumAGI Installer] Bin:    ${binDir}`);
  if (dryRun) console.log(`[SuperQuantumAGI Installer] Mode:   DRY RUN (no disk writes)\n`);

  // 1. Agents: orchestrator.md, synthesizer.md, and sectors/
  const agentsSrcDir = path.join(ROOT_DIR, ".opencode/agents");
  const agentsDstDir = path.join(targetDir, "agents");
  if (fs.existsSync(agentsSrcDir)) {
    const agents = fs.readdirSync(agentsSrcDir);
    for (const item of agents) {
      const srcItem = path.join(agentsSrcDir, item);
      const dstItem = path.join(agentsDstDir, item);
      const res = safeSymlink(srcItem, dstItem, dryRun, managedFiles);
      report.push(`agent: ${item} -> ${res.status}`);
    }
  }

  // 2. Skills: each individual skill directory
  const skillsSrcDir = path.join(ROOT_DIR, ".opencode/skills");
  const skillsDstDir = path.join(targetDir, "skills");
  if (fs.existsSync(skillsSrcDir)) {
    const skills = fs.readdirSync(skillsSrcDir);
    for (const item of skills) {
      const srcItem = path.join(skillsSrcDir, item);
      if (fs.statSync(srcItem).isDirectory()) {
        const dstItem = path.join(skillsDstDir, item);
        const res = safeSymlink(srcItem, dstItem, dryRun, managedFiles);
        report.push(`skill: ${item} -> ${res.status}`);
      }
    }
  }

  // 3. Commands: each command markdown file
  const commandsSrcDir = path.join(ROOT_DIR, ".opencode/commands");
  const commandsDstDir = path.join(targetDir, "commands");
  if (fs.existsSync(commandsSrcDir)) {
    const commands = fs.readdirSync(commandsSrcDir);
    for (const item of commands) {
      if (item.endsWith(".md")) {
        const srcItem = path.join(commandsSrcDir, item);
        const dstItem = path.join(commandsDstDir, item);
        const res = safeSymlink(srcItem, dstItem, dryRun, managedFiles);
        report.push(`command: ${item} -> ${res.status}`);
      }
    }
  }

  // 4. Rules: 01-verification.md, 02-engineering-principles.md, decision-log-protocol.md
  const rulesSrcDir = path.join(ROOT_DIR, ".opencode/rules");
  const rulesDstDir = path.join(targetDir, "rules");
  if (fs.existsSync(rulesSrcDir)) {
    const rules = fs.readdirSync(rulesSrcDir);
    for (const item of rules) {
      if (item.endsWith(".md")) {
        const srcItem = path.join(rulesSrcDir, item);
        const dstItem = path.join(rulesDstDir, item);
        const res = safeSymlink(srcItem, dstItem, dryRun, managedFiles);
        report.push(`rule: ${item} -> ${res.status}`);
      }
    }
  }

  // 5. Plugins: superquantumagi directory
  const pluginSrcDir = path.join(ROOT_DIR, ".opencode/plugins/superquantumagi");
  const pluginDstDir = path.join(targetDir, "plugins/superquantumagi");
  if (fs.existsSync(pluginSrcDir)) {
    const res = safeSymlink(pluginSrcDir, pluginDstDir, dryRun, managedFiles);
    report.push(`plugin: superquantumagi -> ${res.status}`);
  }

  // 6. Binaries: superq and smartdoc-cli
  const cliSrc = path.join(ROOT_DIR, "harness/smartdoc/cli.mjs");
  if (fs.existsSync(cliSrc)) {
    if (!dryRun) {
      try {
        fs.chmodSync(cliSrc, 0o755);
      } catch {}
    }
    const superqBin = path.join(binDir, "superq");
    const smartdocBin = path.join(binDir, "smartdoc-cli");
    const r1 = safeSymlink(cliSrc, superqBin, dryRun, managedFiles);
    const r2 = safeSymlink(cliSrc, smartdocBin, dryRun, managedFiles);
    report.push(`bin: superq -> ${r1.status}`);
    report.push(`bin: smartdoc-cli -> ${r2.status}`);
  }

  // 7. Config merging in opencode.json (or opencode.jsonc)
  let configPath = path.join(targetDir, "opencode.json");
  if (fs.existsSync(path.join(targetDir, "opencode.jsonc"))) {
    configPath = path.join(targetDir, "opencode.jsonc");
  }

  let existingConfig = {};
  let previousDefaultAgent = undefined;
  if (fs.existsSync(configPath)) {
    try {
      const raw = fs.readFileSync(configPath, "utf8");
      existingConfig = parseJsonc(raw);
      previousDefaultAgent = existingConfig.default_agent;
    } catch (err) {
      console.warn(`[WARN] Failed to parse existing config ${configPath}: ${err.message}`);
    }
  }

  // Read MCP servers template from repo
  let repoTemplate = {};
  const repoTemplatePath = path.join(ROOT_DIR, ".opencode/opencode.jsonc");
  if (fs.existsSync(repoTemplatePath)) {
    repoTemplate = parseJsonc(fs.readFileSync(repoTemplatePath, "utf8"));
  }

  const mergedConfig = { ...existingConfig };
  mergedConfig.default_agent = "orchestrator";
  mergedConfig.experimental = {
    ...(mergedConfig.experimental || {}),
    subagent_depth: 1,
  };

  // Merge instructions
  const requiredInstructions = [
    "~/.config/opencode/rules/01-verification.md",
    "~/.config/opencode/rules/decision-log-protocol.md",
  ];
  const currentInstructions = Array.isArray(mergedConfig.instructions)
    ? [...mergedConfig.instructions]
    : [];
  for (const inst of requiredInstructions) {
    if (!currentInstructions.includes(inst)) {
      currentInstructions.push(inst);
    }
  }
  mergedConfig.instructions = currentInstructions;

  // Merge MCP servers
  if (repoTemplate.mcp && repoTemplate.mcp.servers) {
    mergedConfig.mcp = mergedConfig.mcp || {};
    mergedConfig.mcp.timeout = mergedConfig.mcp.timeout || {
      startup: 30000,
      catalog: 30000,
      execution: 600000,
    };
    mergedConfig.mcp.servers = mergedConfig.mcp.servers || {};
    for (const [serverName, serverDef] of Object.entries(repoTemplate.mcp.servers)) {
      mergedConfig.mcp.servers[serverName] = serverDef;
    }
  }

  // Managed servers list for manifest
  const managedServers = Object.keys(repoTemplate.mcp?.servers || {});

  // Build manifest
  const manifest = {
    installedAt: new Date().toISOString(),
    repoRoot: ROOT_DIR,
    previousDefaultAgent,
    hadMcp: !!existingConfig.mcp,
    hadExperimental: !!existingConfig.experimental,
    configPath,
    managedFiles,
    managedServers,
  };

  if (!dryRun) {
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(mergedConfig, null, 2) + "\n", "utf8");
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  }
  report.push(`config: ${path.basename(configPath)} -> merged default_agent, instructions, mcp`);
  report.push(`manifest: superquantumagi.json -> recorded ${managedFiles.length} managed items`);

  console.log(`[PASS] Installation completed:`);
  for (const line of report) {
    console.log(`  - ${line}`);
  }
  console.log(`\nSuperQuantumAGI is now active globally. Default agent: orchestrator.`);
  return { success: true, manifest, report };
}

export function uninstall(options) {
  const { dryRun, targetDir, binDir } = options;
  const manifestPath = path.join(targetDir, "superquantumagi.json");
  const report = [];

  console.log(`[SuperQuantumAGI Uninstaller] Target: ${targetDir}`);
  if (dryRun) console.log(`[SuperQuantumAGI Uninstaller] Mode:   DRY RUN\n`);

  let manifest = null;
  if (fs.existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    } catch {}
  }

  // Remove symlinks recorded in manifest
  if (manifest && Array.isArray(manifest.managedFiles)) {
    for (const filePath of manifest.managedFiles) {
      if (fs.existsSync(filePath) || fs.lstatSync(filePath, { throwIfNoEntry: false })) {
        try {
          const stat = fs.lstatSync(filePath);
          if (stat.isSymbolicLink()) {
            if (!dryRun) fs.unlinkSync(filePath);
            report.push(`removed symlink: ${filePath}`);
          }
        } catch (err) {
          report.push(`failed removing ${filePath}: ${err.message}`);
        }
      }
    }
  }

  // Revert config
  const configPath = manifest?.configPath || path.join(targetDir, "opencode.json");
  if (fs.existsSync(configPath)) {
    try {
      const raw = fs.readFileSync(configPath, "utf8");
      const cfg = parseJsonc(raw);

      if (cfg.default_agent === "orchestrator") {
        if (manifest?.previousDefaultAgent) {
          cfg.default_agent = manifest.previousDefaultAgent;
        } else {
          delete cfg.default_agent;
        }
      }

      if (Array.isArray(cfg.instructions)) {
        cfg.instructions = cfg.instructions.filter(
          (i) => !i.includes("01-verification.md") && !i.includes("decision-log-protocol.md")
        );
        if (cfg.instructions.length === 0) delete cfg.instructions;
      }

      if (cfg.mcp && manifest?.managedServers) {
        if (cfg.mcp.servers) {
          for (const s of manifest.managedServers) {
            delete cfg.mcp.servers[s];
          }
          if (Object.keys(cfg.mcp.servers).length === 0) {
            delete cfg.mcp.servers;
          }
        }
        if (!manifest.hadMcp || Object.keys(cfg.mcp).length === 0) {
          delete cfg.mcp;
        }
      }

      if (cfg.experimental) {
        if (cfg.experimental.subagent_depth === 1) {
          delete cfg.experimental.subagent_depth;
        }
        if (!manifest?.hadExperimental || Object.keys(cfg.experimental).length === 0) {
          delete cfg.experimental;
        }
      }

      if (!dryRun) {
        fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2) + "\n", "utf8");
      }
      report.push(`restored config: ${path.basename(configPath)}`);
    } catch (err) {
      report.push(`error reverting config: ${err.message}`);
    }
  }

  // Remove manifest
  if (fs.existsSync(manifestPath)) {
    if (!dryRun) fs.unlinkSync(manifestPath);
    report.push(`removed manifest: superquantumagi.json`);
  }

  console.log(`[PASS] Uninstallation completed:`);
  for (const line of report) {
    console.log(`  - ${line}`);
  }
  return { success: true, report };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const options = parseArgs();
  if (options.uninstall) {
    uninstall(options);
  } else {
    install(options);
  }
}
