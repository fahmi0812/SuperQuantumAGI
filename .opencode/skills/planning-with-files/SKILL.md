---
name: Planning With Files
description: Maintain single-writer anti-race file-based coordination with task_plan.md, findings.md, and per-agent progress files.
---

# Planning With Files Protocol

## File Responsibilities

1. **`task_plan.md`:**
   - Global progress, phase statuses, checkboxes, and milestone tracking.
   - **SOLE WRITER:** Synthesizer subagent.

2. **`findings.md`:**
   - Technical discoveries, architecture observations, and persistent knowledge.
   - **SOLE WRITER:** Synthesizer subagent.

3. **`runtime/progress.{agent_id}.md`:**
   - Isolated, per-agent log of execution, command outputs, and intermediate decisions.
   - **SOLE WRITER:** The specific subagent assigned that `agent_id`.
   - Never modified by other subagents.

## Single-Writer Invariant

Under no circumstances should any sector subagent attempt to write to `task_plan.md` or `findings.md`. Doing so violates the anti-race constraint and risks overwriting concurrent progress.

Source: https://github.com/davila7/claude-code-templates
Pin: # TODO: resolve pin
License: MIT. This file is a local protocol summary, not a vendored copy.

## Working sequence

1. The orchestrator names the sector and the progress file before work starts.
2. The sector appends status, commands, and evidence only to `runtime/progress.{agent_id}.md`.
3. A sector that needs another sector asks the orchestrator. It does not spawn a subagent.
4. The synthesizer reads every progress file after the done-gate, then updates `task_plan.md` and `findings.md`.
5. If two progress files disagree, keep both claims. Do not merge them by editing the other agent's file.

## Progress file shape

- Goal
- Commands run and exit codes
- Files changed
- Done-gate result
- Open questions

Do not put secrets, live consent tokens, or raw credentials in any of these files.
