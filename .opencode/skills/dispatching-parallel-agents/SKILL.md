---
name: Dispatching Parallel Agents
description: Dispatches independent tasks to separate agents and collects their isolated progress files.
---

# Dispatching Parallel Agents

Source: https://github.com/davila7/claude-code-templates
Pin: # TODO: resolve pin
License: MIT (davila7/claude-code-templates). Local summary, not a vendored copy. One SHA covers every davila7 row once resolved.

## Method

Use this when tasks do not share writable state.

1. Split the request into independent work items. If two items edit the same file, they are not independent.
2. Give each item one sector subagent, one progress file, and a concrete done check.
3. Do not let those subagents spawn further subagents.
4. Wait for each progress file, then hand aggregation to the synthesizer.
5. Stop at three failed iterations.
