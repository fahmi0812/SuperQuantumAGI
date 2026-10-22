---
description: Start or initialize a SuperQuantumAGI orchestration workflow
agent: orchestrator
---

Initialize and execute the SuperQuantumAGI workflow for:
$ARGUMENTS

1. Run Layer-0 regex check.
2. Run Layer-1 triage (sector, complexity Low|High, profile, dispatch, subagents).
3. If dispatch is fast-path, call the one listed subagent.
4. If dispatch is serial, keep that one sector and run the steps in order. Do not fan out.
5. If dispatch is parallel, call only the listed subagents, at most 3. Do not add a companion sector.
6. Enforce Unified Done-Gate and call Synthesizer to update task_plan.md and findings.md.
