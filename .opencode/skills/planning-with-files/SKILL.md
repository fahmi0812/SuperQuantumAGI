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
