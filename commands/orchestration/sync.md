---
description: Trigger Synthesizer subagent to aggregate all progress files into task_plan.md and findings.md
agent: orchestrator
---

Execute synchronization across subagents:
1. Scan runtime/progress.*.md for all sector subagent updates.
2. Delegate to the 'synthesizer' subagent.
3. Verify that task_plan.md and findings.md are cleanly updated.
