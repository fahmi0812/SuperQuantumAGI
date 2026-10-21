---
name: Deep Research Team
description: Splits a research question across roles and merges only sourced findings.
---

# Deep Research Team

Source: https://github.com/davila7/claude-code-templates
Pin: # TODO: resolve pin
License: MIT (davila7/claude-code-templates). Local summary, not a vendored copy.

## Method

1. Split roles: search, read, contradict, synthesize. Do not spawn nested subagents from a sector agent.
2. Each role writes runtime/progress.research.md sections or its own progress file if dispatched by the orchestrator.
3. A contradiction stays visible. Do not delete the weaker source without saying why.
4. The synthesizer merges the final notes.
5. Pin remains TODO.
