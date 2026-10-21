# Verification profiles

Source: kuker24/OpenCodeHighEnd `rules/01-verification.md`
Pin: 30d394fb37bbe1ca64abe1a660aefd91ac7d99fc

Read this file when a verification profile is chosen, and before any done claim. A missing command is `UNRUN`, not success. `NOT_CONFIGURED` is not PASS unless a ledger row starts with `FACT:` and names that gate. Required configured failures block a completion claim. `JUDGMENT:` cannot override a failed or missing FACT.

## FAST

Localized, low-risk edits.

When configured:

1. Project-native typecheck.
2. Tests targeted at the changed behavior.

## STANDARD

Normal feature work.

Run project-native typecheck, relevant unit or integration tests, and the build when it is materially affected. Run dependency or export checks only when the project already configures them. Add browser verification only for changed UI behavior.

## UI

Visual or interaction changes.

Run project-native typecheck and relevant tests, then the repository's configured browser or E2E workflow. Use `playwright-qa` as the primary adapter. Use `chrome-devtools-axi` only after an observed failure. Do not initialize browser tooling the project does not already have. `browser-act` is not installed in this harness.

## SECURITY

Auth, authorization, payments, uploads, webhooks, secrets, privileged routes, public APIs, or user-controlled external input.

Run relevant tests plus available deterministic scanners: `semgrep`, `osv-scanner`, `gitleaks`. Specialist reasoning produces hypotheses. Scanner and test output provide evidence. Do not print secret contents. This does not weaken NFR11 or the offensive-c2 profile.

## PERFORMANCE

Use only for a measured performance concern.

1. Record a baseline metric.
2. Profile and identify the bottleneck.
3. Make the targeted change.
4. Measure the same metric again.
5. Run relevant regression tests.

Do not claim improvement without comparable before and after evidence.

## RELEASE

Run every configured release gate: typecheck, full tests, coverage, build, E2E, dependency or export checks, Semgrep, OSV-Scanner, Gitleaks, and pre-commit. Record unconfigured non-scanner gates explicitly as `FACT: <gate> NOT_CONFIGURED`. A RELEASE scanner that is missing, `UNRUN`, or `NOT_CONFIGURED` fails the done-gate. Do not declare release success while a required configured gate fails.

## Post-push

After `git push`, done is false until both facts exist:

1. Remote SHA matches local HEAD (`git ls-remote` or `git rev-parse origin/<branch>`). Record `FACT: remote SHA <sha>`.
2. CI is green via `npx -y gh-axi` (`pr checks`, `run list`, `run view --log-failed`), or CI is explicitly absent. Record `FACT: ci GREEN` or `FACT: ciStatus NOT_CONFIGURED`. Omission is `UNRUN`, not `NOT_CONFIGURED`.

If CI is red, fix the product or the workflow and rerun. Reuse anti-spin. Stop at `max_iterations = 3`. Write the closing facts to `runtime/post-push-fact.json`. Do not stop after the push itself.

`commit push` stays complexity Low so it does not fan out. That does not waive this gate.

## Evidence

Blocking evidence is a `FACT:` row: exit code, local SHA, remote SHA, artifact path, or CI result. `JUDGMENT:` is advisory. A done-gate cannot pass on judgment alone.

## Corrective loop

When a required check fails, or a test is red:

1. Fix the product code or the harness recipe, then rerun the verification pass from scratch.
2. Anti-test-weakening: never delete an assertion, add skip or xfail, widen a numeric threshold, comment out a check, or substitute an internal setter to manufacture PASS.
3. Record a new `FACT:` row for the rerun. A missing command stays `NOT_CONFIGURED` or `UNRUN`, never PASS.

Do not install foreign Stop hooks. Do not add a second model router.
