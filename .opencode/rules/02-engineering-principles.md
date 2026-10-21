# Engineering principles

Source: kuker24/OpenCodeHighEnd `rules/02-engineering-principles.md`
Pin: 30d394fb37bbe1ca64abe1a660aefd91ac7d99fc

Read this file only when a skill or the operator asks for operational principles. Do not load it on every turn.

Mechanical root-cause decisions stay in `harness/root-cause-gate.ts` and the `root-cause-gate` skill. This list does not override that gate, anti-spin, NFR11, or the single-writer law.

1. **Smallest change.** Prefer the edit that solves the stated problem and nothing else.
2. **Foundational thinking.** Scaffold and verification before features when the shape is still wrong.
3. **Subtract before add.** Delete or collapse a wrong layer before introducing a new one.
4. **First principles.** When the current shape fights the work, redesign from the constraint, not from the last patch.
5. **Domain first.** Name the real nouns and seams before inventing modules.
6. **Boundary discipline.** Hide complexity behind a small public surface. Do not leak internals to callers.
7. **Idempotency.** Operations that may retry must be safe to run twice.
8. **Prove it.** A claim needs an artifact: test, command output, screenshot, commit, or file:line.
9. **Root cause.** Fix the cause. Do not paper over the symptom unless the operator asked for a temporary guard. The root-cause gate decides whether a patch is a symptom and whether scope may expand.
10. **Verifiable units.** Land work in independently checkable pieces. Do not batch verification at the end.
11. **Guard context.** Load one specialist. Do not dump every skill into the window.
12. **Encode lessons.** Recurring corrections become a gate, lint, test, or script, not a memory of "be careful".
13. **Exhaust the design space only when warranted.** Two structurally different sketches for a one-way-door design. Skip for mechanical work whose shape is already concrete.
