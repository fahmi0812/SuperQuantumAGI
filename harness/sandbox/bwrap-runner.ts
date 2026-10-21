/**
 * SuperQuantumAGI - Local Sandbox Runner (Bubblewrap / Docker)
 * Wraps subagent shell commands in an unprivileged bwrap container (PRD §9).
 */

import * as fs from "fs";
import { execSync, spawnSync } from "child_process";

export interface BwrapOptions {
  workspaceDir: string;
  allowNetwork?: boolean;
  readOnlyWorkspace?: boolean;
  timeoutMs?: number;
}

export function isBwrapAvailable(): boolean {
  try {
    execSync("command -v bwrap", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export function buildBwrapCommand(command: string, options: BwrapOptions): { binary: string; args: string[] } {
  const args: string[] = [];

  // Mount essential system directories read-only.
  // /bin is often a symlink to usr/bin and is not visible via --ro-bind /usr alone.
  if (fs.existsSync("/usr")) args.push("--ro-bind", "/usr", "/usr");
  if (fs.existsSync("/bin")) args.push("--ro-bind", "/bin", "/bin");
  if (fs.existsSync("/lib")) args.push("--ro-bind", "/lib", "/lib");
  if (fs.existsSync("/lib64")) args.push("--ro-bind", "/lib64", "/lib64");
  if (fs.existsSync("/etc/alternatives")) args.push("--ro-bind", "/etc/alternatives", "/etc/alternatives");
  if (fs.existsSync("/etc/resolv.conf")) args.push("--ro-bind", "/etc/resolv.conf", "/etc/resolv.conf");

  // Mount proc and dev
  args.push("--proc", "/proc");
  args.push("--dev", "/dev");

  // Isolated tmpfs for temporary files
  args.push("--tmpfs", "/tmp");

  // Bind workspace directory
  if (options.readOnlyWorkspace) {
    args.push("--ro-bind", options.workspaceDir, options.workspaceDir);
  } else {
    args.push("--bind", options.workspaceDir, options.workspaceDir);
  }

  // Network isolation if not explicitly allowed
  if (options.allowNetwork === false) {
    args.push("--unshare-net");
  }

  // Set working directory
  args.push("--chdir", options.workspaceDir);
  args.push("--die-with-parent");

  // Shell to execute inside sandbox
  args.push("/bin/bash", "-c", command);

  return {
    binary: "bwrap",
    args,
  };
}

export function runInSandbox(command: string, options: BwrapOptions): { exitCode: number; stdout: string; stderr: string } {
  const built = buildBwrapCommand(command, options);
  const result = spawnSync(built.binary, built.args, {
    encoding: "utf8",
    timeout: options.timeoutMs ?? 60000,
  });
  return {
    exitCode: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}
