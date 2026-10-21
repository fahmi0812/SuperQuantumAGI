---
name: Subagent Driven Development
description: Runs sector work in a reviewable sequence: implement, check, then synthesize.
---

# Subagent Driven Development

Source: https://github.com/davila7/claude-code-templates
Pin: # TODO: resolve pin
License: MIT (davila7/claude-code-templates). Local summary, not a vendored copy.

## Method

Use this when the next step depends on the previous result.

1. One sector subagent per step. Depth stays at one.
2. Each step names the files it may change and the test that proves the step.
3. A failed done-gate returns to re-plan. It is not marked done.
4. After two consecutive failures, call the exception auditor. After three, stop.
5. Synthesize only after the sequence has a green gate or an explicit halt.
