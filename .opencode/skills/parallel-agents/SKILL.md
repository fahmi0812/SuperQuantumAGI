---
name: Parallel Agents
description: Coordinates domain specialists in parallel when a task crosses more than one sector.
---

# Parallel Agents

Source: https://github.com/davila7/claude-code-templates
Pin: # TODO: resolve pin
License: MIT (davila7/claude-code-templates). Local summary, not a vendored copy.

## Method

Use this for domain fan-out, not for unrelated chores.

1. Name the sectors that must speak. Do not invite every sector.
2. Write a shared question and the evidence each sector must return.
3. Keep writes isolated to runtime/progress.{agent_id}.md.
4. The synthesizer is the only writer of task_plan.md and findings.md.
5. If two sectors disagree, record both claims and the evidence. Do not average them.
