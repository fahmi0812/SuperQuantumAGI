---
name: Unified Done-Gate
description: Enforce deterministic completion checks (exit code 0, target artifacts exist, and tests green) before marking any task as complete.
---

# Unified Done-Gate Protocol

This skill replaces subjective LLM self-evaluation with concrete, verifiable gate checks.

## The Rule of 3 (Deterministic Completion)

A task or subagent run is **DONE** if and only if all three conditions are satisfied:
1. `exit_code === 0` — The command or script executed without unhandled errors.
2. `artifacts_exist` — All promised output files are created and non-empty.
3. `tests_green` — Relevant unit, integration, or smoke test commands pass cleanly.

If any check fails:
- Do NOT claim success.
- Log the exact failure reasons (missing file, non-zero return code, test failure).
- Re-plan the iteration or hand off to the Anti-Spin circuit breaker.
