---
description: Start or initialize a SuperQuantumAGI orchestration workflow
agent: orchestrator
---

Initialize and execute the SuperQuantumAGI workflow for:
$ARGUMENTS

1. Run Layer-0 regex check.
2. Run Layer-1 triage (determine sector, complexity Low|High, profile Default|Pentest).
3. If complexity is Low, execute fast-path.
4. If complexity is High, fan-out to sector subagents.
5. Enforce Unified Done-Gate and call Synthesizer to update task_plan.md and findings.md.
