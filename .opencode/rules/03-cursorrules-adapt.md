# Engineering principles (cursorrules adapt)

Source: https://github.com/PatrickJS/awesome-cursorrules
Pin: b044f956f021b6e8877f16781bcfc466a6a120e9
License: CC0-1.0. Selective generic principles mapped to `.opencode/rules/`. Not a `.cursorrules` dump. Not loaded every turn — do not add this file to `opencode.jsonc` `instructions`.

Does not override root-cause-gate, anti-spin (`max_iterations = 3`), NFR11, or the single-writer law.

1. **Scope to the ask.** Change only what was requested. Simplest working edit first. No extra abstraction, dependency, or file rewrite for a one-line fix.
2. **Names that reveal purpose.** Prefer named constants over magic numbers. Avoid private abbreviations.
3. **One job per function.** Small, focused units. Repeated logic gets one source of truth, not a new framework.
4. **Comments explain why.** Do not narrate readable code. Document side effects and non-obvious constraints.
5. **Hide internals.** Expose a small interface. Callers should not depend on private structure.
6. **Verify before claiming.** Check the repo, the diff, and a command. Do not invent APIs or assume a test passed.
7. **Preserve unrelated code.** Do not restyle, reflow, or “clean up” files outside the blast radius.
8. **Fail closed on trust boundaries.** Validate untrusted input. Do not weaken auth, sandbox, or pentest gates in the name of brevity.
