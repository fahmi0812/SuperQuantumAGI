---
description: Verify a push. Remote SHA must match HEAD, then CI must be green or explicitly NOT_CONFIGURED. Slash-only.
agent: orchestrator
---

Post-push verification. Do not treat the push itself as done.

Target: $ARGUMENTS

1. Load `.opencode/skills/gh-axi/SKILL.md` and `.opencode/rules/01-verification.md`.
2. FACT: `git rev-parse HEAD` and `git rev-parse origin/<branch>` or `git ls-remote`. They must match.
3. FACT: `npx -y gh-axi run list` and `npx -y gh-axi pr checks` or `run view --log-failed` until CI is green.
4. If CI is red, fix and rerun. Reuse anti-spin. Stop at 3 failures. Do not delete assertions, skip tests, or widen thresholds.
5. If this repo has no GitHub Actions workflow for the branch, record `FACT: ciStatus NOT_CONFIGURED`. Omission is not that fact.
6. Write `runtime/post-push-fact.json` with `remoteShaOk`, `ciStatus`, and `facts`. JUDGMENT cannot close the gate.
