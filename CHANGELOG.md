# Changelog

## Unreleased

- Remove leftover `browser-act` skill. It is not installed in this harness; `playwright-qa` stays door 1.
- Gamedev coding tie-break no longer matches bare `unity` (use `unity3d` / `unity engine`, aligned with the `unity3d` classifier regex).
- Layer-1 coding prompt mentions game development / engines (Godot, Unity, Unreal, Phaser, pygame, Roblox).
- Golden-set routing adds Godot platformer, unity3d, and Unreal engine cases (coding, High, Default). eval-sec-02 (null pointer Jest) stays coding Low.
- Drop unused MCP stubs from runtime config: `bunkerweb`, `sliver`, `adaptixc2`, `caldera`, `mythic`, `decepticon`, `pentagi`, `strix`, and `shadcn`. Core MCP is `codebase-memory-mcp` + `context7`. RE MCP (`ghidra`, `jshook`, `idapro`) stay disabled/lazy.
- NFR11 policy still denies known offensive binaries. C2 servers are not shipped.
- Remove duplicate skills: `parallel-agents`, `systematic-debugging`, `unslop`, `install-anti-slop`, `deep-research-team`. Ghost registry entries `strix` and `deepteam` removed.
- Remove skills `cli-pentestv1` and `geo-sleuth` from registry and sector definitions; update sector routing.
- Import 76 game development skills and master `gamedev-router` from `gamedev-skills/awesome-gamedev-agent-skills` (Apache-2.0, pin `184b72be02884f782a0058f2eeae2ce4277453e4`). Dynamic hierarchical routing under Sector 2 (coding) with `metadata.opencode/autoinvoke: false` on leaf skills to prevent prompt bloat while allowing on-demand loading.

## 0.2.1

Wave `skill-repos-20261024`. Layer di atas OpenCode; tidak ada patch core.

- Dispatch high: serial untuk satu sektor. Parallel hanya sektor yang disebut, maks 3, tanpa menambah `orchestration-quality` otomatis.
- Baris `[superq-triage]` membawa `dispatch` dan `subagents` dari `planDispatch`.
- Plugin mencatat sektor terencana vs subagent yang benar-benar jalan di `runtime/triage-dispatch.json`.
- Root `AGENTS.md` (pola agents.md). Template spek di `docs/spec/`. Format skill, catatan BMAD, pola slim (9router-only), katalog Tier 3 pointer.
- Skill baru T2: `honey`, `brainstorming`, `writing-plans`, `verification-before-completion`, `systematic-debugging`. `demo-video` di-refresh dari nilbuild/video-demo (bukan stub `id-demo-video`).
- Pin: mattpocock/skills `5beb35b0…`; ECC `90606c83…` pada tiga PROVENANCE; MCP `codebase-memory-mcp@0.12.1`, `@jshookmcp/jshook@0.4.2` (tetap disabled).
- Design Bank / frontend-design / Ghidra source **tidak** diadopsi. `/pentest` tetap gated. Anti-spin `max_iterations = 3`.

Teks halaman GitHub (tempel manual, jangan `gh repo edit`):

- Description: `OpenCode harness: 11-sector orchestration, bwrap sandbox, done-gate, 9router-only. Layer on top — never patches OpenCode core.`
- Topics: `opencode, ai-agents, agent-skills, orchestration, bubblewrap, sdd, agents-md, indonesia`

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
