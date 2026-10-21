# Verification

Profiles and the post-push rule live in `.opencode/rules/01-verification.md`. OpenCode loads that file through `instructions` in `.opencode/opencode.jsonc`.

## Profiles

FAST, STANDARD, UI, SECURITY, PERFORMANCE, RELEASE.

A command that was not run is `UNRUN`. `NOT_CONFIGURED` counts only when a ledger row starts with `FACT:` and names the gate. A RELEASE scanner that is missing or `NOT_CONFIGURED` fails. `JUDGMENT:` cannot close a failed FACT.

Do not delete assertions, skip tests, or widen thresholds to force a pass.

## After a push

1. `git rev-parse HEAD` equals `git rev-parse origin/<branch>` or `git ls-remote`.
2. `npx -y gh-axi run list`, `pr checks`, or `run view --log-failed` until CI is green.
3. Write `runtime/post-push-fact.json` with `remoteShaOk`, `ciStatus`, and `facts`.

`/verify-push` runs that path. The plugin reminder `post-push verification pending` stays in system context until the fact file satisfies the done-gate. It is not written into the user prompt.

`commit push` is still a fast Layer-0 route. It is not done when the push returns.

## Ledger

Append rows with `.opencode/skills/decision-log/scripts/log.sh`. Result cells are `FACT:` or `JUDGMENT:`.
