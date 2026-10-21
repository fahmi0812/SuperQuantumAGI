# SuperQuantumAGI

> **SuperQuantumAGI** — Lean, powerful, multi-sector Agentic Orchestrator harness installed as a **pure non-invasive layer on top of OpenCode**.
> **Target:** OpenCode (V2) | **Operator:** Fahmi Harun ([kuker24](https://github.com/kuker24)) | Self-hosted / Local-first.

---

## Safety Rule #1: OpenCode Remains 100% Vanilla

SuperQuantumAGI does **NOT** modify, patch, replace, or wrap the OpenCode binary or runtime. It installs exclusively through standard OpenCode extension points:
1. `.opencode/opencode.jsonc` (project configuration & MCP registration)
2. `.opencode/agents/` (Orchestrator Core + 11 Sector Subagents + Synthesizer)
3. `.opencode/skills/` (Domain-specific skills)
4. `.opencode/commands/` (Slash commands: `/start`, `/status`, `/resume`, `/sync`, `/audit`, `/pentest`, `/verify-push`, plus slash-only manuals)
5. `.opencode/plugins/` (Local plugin for bwrap sandboxing & single-writer enforcement)

OpenCode can be updated or upgraded cleanly at any time without conflict.

---

## Attributions & Third-Party Credits

- **Crawl4AI Attribution:** This product includes software developed by UncleCode (https://github.com/unclecode/crawl4ai).
- **Serena / SolidLSP:** External MCP interface to Serena (GPL-3.0-or-later) by Jain & Panchenko IT-Berater Partnerschaft (Oraios AI). Not vendored.
- **DeusData Codebase Memory MCP:** MIT License, Copyright (c) 2025 DeusData.
- **Context7:** MIT License, Copyright (c) 2021 Upstash, Inc.
- **shadcn:** MIT License, Copyright (c) 2023 shadcn.
- **Claude Code Templates:** MIT License, Copyright (c) 2025 Daniel (San) Ávila.

See `NOTICE` and `THIRD_PARTY_LICENSES` for full details.

---

## Architecture Overview

```
User Prompt
    │
    ▼
[Layer-0 Zero-LLM]  (Slash command / regex keyword match, 0 tokens)
    │
    ▼
[Layer-1 Triage]     (Classify to 1 of 11 sectors + complexity Low|High + profile Default|Pentest)
    │
    ├─ complexity: Low  ──► Fast-Path (1 subagent)
    └─ complexity: High ──► Fan-Out (Multi-subagent per sector)
          │
          ▼
   [Layer-2 Sector Subagent] (Picks 5-8 Tier 1 skills via 1-to-1 Intent Registry)
          │  • Sandbox: local bwrap / Docker
          │  • Anti-race: subagents write strictly to `runtime/progress.{agent_id}.md`
          ▼
   [Quality Loop (2 Lapis)]
          1. Unified Done-Gate: exit==0 AND artifacts exist AND tests green AND post-push/RELEASE FACT gates when they apply
          2. Anti-Spin: hardcoded max_iterations=3 + circuit breaker
          3. Root-Cause Gate (RCG) + Scope Guard (SCG) + Consent Checkpoint (CCP)
          │
          ▼
   [Synthesizer]
          Sole authorized writer of `task_plan.md` and `findings.md`
          │
          ▼
     Final Result
```

### The 11 Sectors

1. **Orchestration & Quality** (`sectors/orchestration-quality`)
2. **Coding, Engineering & Mobile** (`sectors/coding`)
3. **Reverse Engineering** (`sectors/reverse-engineering`)
4. **Keamanan, Pentest & C2** (`sectors/security-pentest`)
5. **OSINT & Geospatial** (`sectors/osint`)
6. **Desain, Motion & Media** (`sectors/motion-media`)
7. **Data, Dokumen, CAD & Otomasi** (`sectors/data-doc-cad`)
8. **Riset & Ideasi** (`sectors/research` — includes `hackathon-winner-thinking`)
9. **Penulisan & Produktivitas** (`sectors/writing`)
10. **Karier** (`sectors/career`)
11. **DevOps, Infra & Finance** (`sectors/devops-infra-finance`)

---

## Verification

Profiles, the post-push rule, and the FACT ledger are in [docs/verification.md](docs/verification.md). A push is not done until the remote SHA matches and CI is green, or CI is an explicit `FACT: ciStatus NOT_CONFIGURED`.

## Model Routing: Native 9router

All model requests are handled natively by OpenCode via **9router** (configured globally in `~/.config/opencode/opencode.json`).
There is **no custom proxy, no LiteLLM gateway, and no custom router layer**.
LiteLLM and jev-model-router have been completely removed and archived (Tier 3).

---

## MCP Profiles

- **Core-Active (Enabled by default):**
  - `codebase-memory-mcp` (Local graph code intelligence)
  - `context7` (Live documentation endpoint)
  - `shadcn@4.22.1` (Component generation & design system). Pinned in `.opencode/opencode.jsonc`. Historical notes that mention v4.21.1 are not the runtime pin.
- **`re-analysis` (Safe RE profile, lazy on-demand, disabled by default):**
  - `ghidra`, `jshook`, `idapro`
- **`offensive-c2` (Offensive profile, disabled by default):**
  - `sliver`, `adaptixc2`, `pentagi`, `strix`, `caldera`, `mythic`, `decepticon`, `bunkerweb`
  - **MANDATORY:** Requires an explicit `--pentest` authorization marker and a valid non-example consent file (`consent/pentest-scope.json`). `consent/*.example.*` is rejected. Without both, offensive MCP servers stay disabled and offensive executables are denied (NFR11). A search or read that merely mentions those tool names is not an offensive launch.

---

## Getting Started & Multi-PC Setup

### 1. Prerequisites on Target Machine

- **Linux** (Ubuntu, Debian, Fedora, Arch, etc.)
- **OpenCode V2**: `opencode --version`
- **Node.js**: >= 22.x (native TypeScript strip-types). `npm test` and `node ci/run-gates.mjs` hard-fail below 22 with an explicit message. A machine whose default is Node 20 fails by design. There is no transpile fallback.
- **Bubblewrap**: for local sandboxing (`sudo apt install bubblewrap` or `sudo pacman -S bubblewrap`)
- **9router**: Connected natively in `~/.config/opencode/opencode.json` (OpenCode handles inference directly)

### 2. Fresh Installation on Another PC

Clone the repository and prepare the local environment:

```bash
git clone https://github.com/kuker24/SuperQuantumAGI.git
cd SuperQuantumAGI

# Copy local environment template
cp .env.example .env

# Verify CI gates, license checks, and sandbox functionality.
# npm test refuses Node < 22 before the suite starts.
npm test
node ci/run-gates.mjs
```

Launch OpenCode inside the repository root:

```bash
opencode
```

Verify MCP server connection statuses:

```bash
opencode mcp list
```

Expected output:
- `✓ codebase-memory-mcp  connected`
- `✓ context7             connected`
- `✓ shadcn               connected`
- All other profiles (`ghidra`, `sliver`, `caldera`, `adaptixc2`, etc.) remain `disabled`.

---

## Maintenance & Evolution Guide

### 1. Updating the Harness
When pulling changes from the repository:
```bash
git pull origin main
node ci/run-gates.mjs
```

### 2. Adding / Updating Skills
1. Add new skill definitions to `.opencode/skills/<skill-id>/SKILL.md`.
2. Register the skill's 1-to-1 intent key in `routing/intent-registry/index.ts` under its sector.
3. Ensure no two active skills in the same sector share the same intent key.
4. If adding new routing test cases, add them to `eval/golden-set-routing.json`.
5. Run `node ci/run-gates.mjs` to verify routing accuracy (must remain >= 90%).

### 3. Safety & Hygiene Invariants
- **Vanilla OpenCode**: Never patch OpenCode binaries or runtime files. Keep all custom logic in `.opencode/`, `harness/`, `routing/`, and `profiles/`.
- **License Hygiene**: Never vendor copyleft (GPL/AGPL) code directly into the repository. Keep external tools as external pointers or detached network endpoints.
- **Single-Writer Law**: Subagents write exclusively to `runtime/progress.{agent_id}.md`. Only the `synthesizer` subagent writes to `task_plan.md` and `findings.md`.
- **NFR11 Authorization**: Offensive pentest operations require `--pentest` authorization and a non-example consent file (`consent/pentest-scope.json`). Do not commit live consent tokens or sensitive target scopes.
- **Published docs**: `README.md`, `NOTICE`, `THIRD_PARTY_LICENSES`, and `docs/archive-alternatives.md` are the docs that belong in git. Local PRD/catalog dumps stay on disk and are gitignored.
- **P2 skills now installed** (pointers, not vendored copies): `diagram-design`, `deck-design`, `json-render`, `pptx-official`, `pageindex`, `unslop`, and an ECC subset (`api-design`, `contract-first`, `eval-harness`). The other six ECC catalog names are not installed.
- **Pins still unresolved:** `penulis-ilmiah` and `full-performance-audit` stay `URL: TBD` / `# TODO: resolve pin`. First-party OCH items that were never given a repository (`mongodb-ops`, `supabase-ops`, `vercel-ops`, and the other OCH TBD rows) were not invented.
- **Offline eval:** `ci/promptfoo-config.yaml` and `ci/deepteam.yaml` are real caller configs. They are not the default CI gate. See `docs/eval-offline.md`. A missing promptfoo/deepteam install or a missing live model is `not run`, not a pass.

