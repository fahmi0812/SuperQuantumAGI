# BMAD — checklist fase (bukan agen)

Adapted from [bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) @ `61e01f82644c4bb533750cfa0d6d61ab61d2cc9b` (MIT). Methodology only. Do not import BMAD agents, installer, or ticket-tree runtime. SQAGI tetap orchestrator + synthesizer + 11 sektor, `subagent_depth=1`.

## Loop

Clarify → Plan → Build & verify → Learn.

Perubahan kecil boleh langsung Build. Kerja besar menempuh Clarify + Plan dulu.

## Mapping ke SQAGI

| Fase BMAD | Di SQAGI |
|-----------|----------|
| Clarify | Layer-1: sektor, kompleksitas, intent vs task. Opsional skill `brainstorming`. |
| Plan | `docs/spec/` + `writing-plans`. Bukan `task_plan.md` dari sektor. |
| Build & verify | Layer-2 satu sektor (atau parallel bernama). TDD / coding skills. Done-gate. |
| Learn | Anti-spin iterasi 2–3, root-cause-gate, synthesizer. |

## Checklist singkat

1. Keputusan produk/arsitektur tertulis sebelum kode lebar.
2. Satu slice yang bisa diuji, bukan spek raksasa.
3. Verifikasi = perintah + exit code, bukan “should pass”.
4. Jangan ganti 11 sektor dengan peran PM/architect/QA BMAD.
5. Jangan men-spawn subagent dari dalam sektor.
