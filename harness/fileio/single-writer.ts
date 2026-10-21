/**
 * SuperQuantumAGI - Single-Writer File Isolation
 * Enforces strict single-writer anti-race semantics across concurrent subagents (PRD §3.3).
 */

import * as fs from "fs";
import * as path from "path";
import { checkWritePermission as sharedCheck } from "../policy.cjs";

export interface WritePermissionDecision {
  allowed: boolean;
  reason?: string;
}

export class SingleWriterEnforcer {
  private runtimeDir: string;

  constructor(workspaceRoot: string) {
    this.runtimeDir = path.join(workspaceRoot, "runtime");
    if (!fs.existsSync(this.runtimeDir)) {
      fs.mkdirSync(this.runtimeDir, { recursive: true });
    }
  }

  /**
   * Evaluates if a given agent is permitted to write to the target file.
   * - Synthesizer: ONLY agent allowed to write task_plan.md and findings.md.
   * - Subagents: ONLY allowed to write runtime/progress.{agent_id}.md and normal project files.
   *   NEVER allowed to overwrite task_plan.md or findings.md.
   */
  public checkWritePermission(agentId: string, targetPath: string): WritePermissionDecision {
    return sharedCheck(agentId, targetPath);
  }

  /**
   * Helper to write subagent progress file safely.
   */
  public writeSubagentProgress(agentId: string, content: string): string {
    const filePath = path.join(this.runtimeDir, `progress.${agentId}.md`);
    fs.writeFileSync(filePath, content, "utf8");
    return filePath;
  }
}
