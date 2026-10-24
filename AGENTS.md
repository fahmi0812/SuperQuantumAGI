# SuperQuantumAGI — agent notes

Operational notes for agents in this checkout. Not loaded every turn. Do not add this file to `.opencode/opencode.jsonc` `instructions`.

Layer on OpenCode only (`.opencode/`, `harness/`, `routing/`, `profiles/`). Never patch OpenCode core.

## Routing

- **11 sektor.** Orchestrator + synthesizer + 11 sector subagents.
- **Layer-0** slash/regex, zero LLM. Manual specialists (`/demo-video`, `/blast-radius`, `/why`, …) are slash-only.
- **Layer-1** triage: one sector, Low|High, Default|Pentest|ReAnalysis.
- **Layer-2** sector work. `experimental.subagent_depth=1`. Sector agents cannot spawn subagents.
- Model gateway is **9router** / ninerouter only. No LiteLLM, no jev-model-router, no model-mix.

## Quality

- **Done-gate:** exit 0 + non-empty artifacts + tests green. Missing gate is `UNRUN`, not PASS. `FACT:` is blocking; `JUDGMENT:` cannot close a task.
- **Anti-spin:** `max_iterations = 3`. Two consecutive failures → `/audit`. Third failure trips.
- **bwrap fail-closed** for sector shells. No bwrap → deny.
- **Single-writer:** sectors write only `runtime/progress.{agent_id}.md`. Synthesizer alone writes `task_plan.md` and `findings.md`.
- **/pentest gated.** Offensive profile off by default. Needs `--pentest` and live `consent/pentest-scope.json` (NFR11). Example consent files are rejected.

## Specs and skills

- Feature templates: `docs/spec/`.
- Skill layout: `docs/skill-format.md`.
- Tier-3 pointers only: `docs/catalog-tier3.md`. Design Bank is not adopted.
