# Changelog

## Unreleased

- High dispatch is serial for one sector. Parallel runs only the named sectors, at most 3, and no longer adds `orchestration-quality` automatically.
- The `[superq-triage]` line carries `dispatch` and `subagents` from `planDispatch`.
- The plugin records the planned sector against the subagent that actually ran in `runtime/triage-dispatch.json`.

## 0.2.0

Quality parity with OpenCodeHighEnd `30d394fb37bbe1ca64abe1a660aefd91ac7d99fc`. No OpenCode core changes.

- Verification profiles FAST, STANDARD, UI, SECURITY, PERFORMANCE, and RELEASE. `NOT_CONFIGURED` is not a silent PASS.
- Post-push gate: remote SHA and CI must be FACT rows. `gh-axi` is the GitHub operator. `commit push` stays Layer-0 Low and still requires the gate.
- Done-gate fails a push without remote or CI FACT, and fails RELEASE without a passing scanner.
- Evidence ledger distinguishes `FACT:` from `JUDGMENT:`.
- Slash-only manuals and coding skills ported from that OCH pin. Upstream SHAs that OCH did not record stay `# TODO: resolve pin`.
- CI adds gitleaks, semgrep 1.179.0, and osv-scanner 2.6.0. Node 22, bubblewrap, and the local gate runner stay.

## 0.1.0

Initial installable harness. Merged as PR #1.
