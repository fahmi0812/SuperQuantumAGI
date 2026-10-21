# SuperQ — Product Requirements Document (PRD) v1.1 (RAMPING)

> **Produk:** SuperQ — harness agentik **OpenCode** (TARGET = OpenCode, BUKAN Claude Code), dominan orchestrator, ramping/cepat/efisien/ringan tapi powerful
> **Pemilik:** Fahmi Harun (GitHub [`kuker24`](https://github.com/kuker24)) — satu operator, harness lokal/self-host
> **Versi dokumen:** 1.1 · **Tanggal:** 21 Oktober 2026 (Asia/Jakarta, UTC+7)
> **Status:** Revisi ramping dari v1.0 — blueprint "The Best" (review Gemini+Claude, disetujui Fahmi). Versi lama `SuperQ-PRD.md` tetap ada.
> **Bahasa:** Indonesia teknis
>
> Legenda klaim: `[FAKTA]` = dari file sumber. `[PENILAIAN]` = judgment penyusunan. Angka SLA = `[PENILAIAN/target, belum dikalibrasi]`.
> **Aturan bukti:** tidak ada URL/SHA/benchmark dikarang; yang belum ada ditandai `URL: TBD` / `pin: TBD`. Tidak ada commit/push.

---

## Daftar Isi

1. [Ringkasan Eksekutif & Visi](#1-ringkasan-eksekutif--visi)
2. [Problem Statement / Latar Belakang](#2-problem-statement--latar-belakang)
3. [Tujuan & Non-Tujuan](#3-tujuan--non-tujuan)
4. [Persona & Use Case Utama](#4-persona--use-case-utama)
5. [Prinsip Desain](#5-prinsip-desain)
6. [Arsitektur Sistem (Ramping)](#6-arsitektur-sistem-ramping)
7. [Routing (2-Tahap, Model 2-Tingkat, Quality 2-Lapis)](#7-routing)
8. [Katalog Komponen (Tiered)](#8-katalog-komponen-tiered)
9. [Strategi Lisensi](#9-strategi-lisensi)
10. [Requirement Fungsional & Non-Fungsional](#10-requirement-fungsional--non-fungsional)
11. [Milestone / Roadmap (Fase 1–3)](#11-milestone--roadmap-fase-13)
12. [Risiko & Mitigasi](#12-risiko--mitigasi)
13. [Metrik Sukses / Acceptance](#13-metrik-sukses--acceptance)
14. [Lampiran](#14-lampiran)
15. [Catatan Portabilitas OpenCode](#15-catatan-portabilitas-opencode)
16. [Tier Katalog](#16-tier-katalog)

---

## 1. Ringkasan Eksekutif & Visi

**SuperQ** adalah harness agentik **OpenCode** yang **dominan orchestrator**: satu *Orchestrator Core* tipis mendelegasi subagent *secukupnya* (tugas mudah = *fast-path* 1 subagent; tugas kompleks = *fan-out* per sektor). `[FAKTA: konteks produk]`

**Visi v1.1 — "The Best, tapi RAMPING":** control plane multi-sektor yang mengoptimalkan **kecepatan · efisiensi · efektivitas · ringan · powerful** secara bersamaan, dengan:
- **Routing 2-tahap** (Layer-0 Zero-LLM + Layer-1 Triage LLM ke 11 sektor) menggantikan skor 1-dari-120 yang mahal.
- **Model routing 2 tingkat** (ninerouter pilih tier model → LiteLLM gateway eksekusi).
- **Quality loop 2 lapis** (Unified Done-Gate deterministik + anti-spin hardcoded).
- **Fondasi local-first ringan** (bwrap/Docker, trace JSONL/Phoenix-lokal, schema/Pydantic) dengan opsi cloud on-demand (E2B/Opik).
- **Katalog tiered** (T1 aktif / T2 external on-demand / T3 archive) — tidak ada yang dibuang, hanya beda status. `[PENILAIAN]`

Dokumen ini kontrak produk untuk bundle SuperQ berlisensi permisif bersih (MIT/Apache/BSD), dengan item copyleft/NOASSERTION sebagai pointer/MCP eksternal (tidak di-vendored).

## 2. Problem Statement / Latar Belakang

### 2.1 Dari OCH/omp ke SuperQ, lalu dirampingkan
SuperQ lahir dari **OpenCodeHighEnd (OCH)** (66 skill + 12 MCP, pinned `vendor/provenance.json`+`sources.json`, main `@ 30d394fb…` / v0.1.18). `[FAKTA: och-sources-list.md]` v1.0 PRD menambah cakupan multi-sektor + 5 fondasi runtime, namun review Gemini+Claude menemukan **over-engineering**: skor 120-skill mahal, model routing 3 tingkat berlebihan, 5 loop mutu tumpang tindih, kontradiksi LiteLLM ("SELALU" vs on-demand), serta beberapa pemenang bermasalah lisensi.

### 2.2 Keputusan v1.1 (blueprint ramping yang disetujui) `[FAKTA: blueprint user]`
1. Routing 2-tahap (Zero-LLM + triage 11 sektor).
2. Model routing 2 tingkat (buang jev-model-router).
3. Quality loop 5→2 (Unified Done-Gate + anti-spin hardcoded; iFixAi jadi Exception Auditor; promptfoo/deepteam ke CI).
4. Fondasi ringan local-first (LiteLLM core-active; sandbox lokal default; observability lokal default; Guardrails filter OFF).
5. Katalog tiered (T1/T2/T3, tidak ada di-skip).
6. Fix semua kontradiksi (Motion, RE deadlock, race condition, OTORISASI pentest, license CI ringan).

## 3. Tujuan & Non-Tujuan

### 3.1 Goals `[PENILAIAN]`

| ID | Tujuan |
|---|---|
| G1 | Orchestrator Core OpenCode: Layer-0/1 triage → Layer-2 subagent sektor → fan-out/fast-path → quality loop 2 lapis → synthesizer |
| G2 | Routing 2-tahap akurat (intent registry per-sektor, tie-break §12, fallback deterministik ke manual) |
| G3 | Model routing **2 tingkat**: ninerouter (pilih tier) → LiteLLM (gateway eksekusi + fallback/retry/budget built-in) |
| G4 | Bundle permisif bersih (MIT/Apache/BSD); copyleft/NOASSERTION hanya pointer/MCP eksternal |
| G5 | Fondasi ringan local-first: LiteLLM core-active + sandbox bwrap/Docker + trace JSONL/Phoenix-lokal + schema/Pydantic |
| G6 | Multi-sektor (11): Orchestration, Coding/QA/Mobile, RE, Pentest/C2, OSINT, Motion, Data/Dok/CAD, Riset, Penulisan, Karier, DevOps/Finance |
| G7 | Quality loop 2 lapis: Unified Done-Gate deterministik + anti-spin hardcoded; iFixAi Exception Auditor; promptfoo/deepteam CI |
| G8 | Fast-path untuk tugas mudah; fan-out hanya bila complexity=High |
| G9 | Katalog tiered (T1 ~65 aktif / T2 on-demand / T3 archive) — tidak ada komponen di-skip |

### 3.2 Non-Goals `[PENILAIAN]`

| ID | Non-tujuan |
|---|---|
| NG1 | Bukan IDE/GUI pesaing |
| NG2 | Bukan vendor-in source GPL/AGPL/NOASSERTION/tanpa-lisensi |
| NG3 | Bukan SaaS multi-tenant; SuperQ = harness lokal/self-host satu operator |
| NG4 | Bukan skor 120-skill lagi; bukan model routing 3 tingkat; bukan 5 loop mutu |
| NG5 | Bukan filter jailbreak/topik di runtime (workload RE/pentest sah milik operator) |
| NG6 | Bukan menargetkan Claude Code sebagai harness (TARGET = OpenCode) |

## 4. Persona & Use Case Utama

### 4.1 Persona

| Persona | Deskripsi | Kebutuhan |
|---|---|---|
| **Fahmi (Owner/Operator)** | Builder multi-domain: coding, RE/pentest, motion, riset, dokumen | Harness cepat, murah token, hasil terbukti (Done-Gate), ringan |
| **Subagent Specialist** | Worker terisolasi per sektor | Skill/MCP terfokus, sandbox lokal, model via LiteLLM |
| **Exception Auditor (iFixAi)** | Verifikator saat gagal | Pass/fail saat subagent gagal 2x / `/audit` |

### 4.2 Use Case `[PENILAIAN]`

| UC | Skenario | Alur ramping |
|---|---|---|
| UC1 | Fitur coding kompleks | Layer-1 (Coding/High) → fan-out → Unified Done-Gate → synthesizer |
| UC2 | Bug kecil | Layer-0 keyword / Layer-1 (Coding/Low) → fast-path 1 subagent → Done-Gate |
| UC3 | RE (decompile APK) | Layer-0 keyword RE → reverse-skill router → auto-spawn ghidra/jshook (profil `re-analysis`, tanpa --pentest) |
| UC4 | Pentest terstruktur | Layer-1 profile=Pentest → `--pentest` + consent/scope → `offensive-c2` (PentAGI/strix/sliver) → deepteam CI |
| UC5 | Motion/video | Layer-1 (Motion) → claude-motion-design / claude-remotion-skill / gsap-skills / manim |
| UC6 | Riset mendalam | deep-research (+team) → arxiv/searxng/nia on-demand → laporan |
| UC7 | Dokumen Office/PDF | markitdown + docx/pptx/xlsx/pdf-official |
| UC8 | Ops repo/K8s / Finance | github/kubernetes-mcp-server / OpenBB on-demand |

## 5. Prinsip Desain

| # | Prinsip | Penjelasan | Sumber |
|---|---|---|---|
| P1 | **Ramping = cepat+efisien+ringan** | Early-exit Zero-LLM, triage sektor (bukan 120 skill), model tier, local-first | `[PENILAIAN]` |
| P2 | **Delegasi secukupnya** | Fast-path 1 subagent; fan-out hanya complexity=High | `[FAKTA: arch + konteks]` |
| P3 | **Lisensi permisif bersih** | Vendor hanya MIT/Apache/BSD/(MPL file-level); copyleft = pointer eksternal | `[FAKTA: license-alternatives]` |
| P4 | **Done-Gate deterministik** | `exit==0? artefak? test hijau?` — bukan LLM loop | `[PENILAIAN]` |
| P5 | **Enforcement tipis** | LiteLLM core-active menegakkan budget/fallback; selebihnya ringan | `[PENILAIAN]` |
| P6 | **Routing deterministik + fallback manual** | Intent registry per-sektor, tie-break §12, seri→manual (tak menebak) | `[PENILAIAN]` |
| P7 | **Operator-trust** | Filter jailbreak/topik OFF (workload RE/pentest sah); otorisasi via consent/scope untuk C2 | `[PENILAIAN]` |
| P8 | **Pin apa adanya** | SHA/URL hanya dari sumber; sisanya TBD | `[FAKTA: aturan katalog]` |
| P9 | **Target OpenCode** | Konvensi harness ikut OpenCode; komponen Claude ditandai perlu port | `[FAKTA: konteks]` |

## 6. Arsitektur Sistem (Ramping)

Diagram lama: [`superq-arch.png`](./superq-arch.png) (v1.0; alur inti masih relevan, detail routing lihat §7 & `superq-routing-matrix-v1.1.md`).

### 6.1 Komponen inti (v1.1)

| Komponen | Peran |
|---|---|
| **Orchestrator Core** (OpenCode) | plan → fan-out/fast-path → gather |
| **Layer-0 Zero-LLM** | slash-command + keyword/regex (0 token) |
| **Layer-1 Triage LLM** | klasifikasi → 11 sektor + complexity Low\|High + profile Default\|Pentest |
| **Layer-2 Subagent sektor** | pilih 5–8 skill pemenang via intent registry per-sektor |
| **Model Router** | ninerouter (tier fast/coding/reasoning) → LiteLLM (gateway eksekusi) |
| **Pool Subagent** | per sektor, paralel secukupnya; sandbox lokal (E2B opsional) |
| **Quality Loop 2 lapis** | Unified Done-Gate + anti-spin hardcoded |
| **Exception Auditor** | iFixAi (hanya gagal 2x / `/audit`) |
| **Synthesizer** | gabung hasil; satu-satunya penulis `task_plan.md`/`findings.md` |

### 6.2 Alur end-to-end `[PENILAIAN]`
Lihat diagram flow di `superq-routing-matrix-v1.1.md §E`. Ringkas: `Layer-0 → Layer-1 → Layer-2 (ninerouter→LiteLLM, lazy-load MCP) → fan-out/fast-path → Unified Done-Gate → anti-spin → Synthesizer`. Done-Gate gagal → re-plan (bukan klaim sukses).

## 7. Routing

Ringkasan dari [`superq-routing-matrix-v1.1.md`](./superq-routing-matrix-v1.1.md). `[FAKTA struktur = dokumen itu]`

### 7.1 Routing 2-tahap `[PENILAIAN]`
- **Layer-0 Zero-LLM:** slash-command + keyword/regex → 0 token, instan (< ~10 ms `[PENILAIAN/target]`).
- **Layer-1 Triage LLM:** 11 sektor + complexity Low|High + profile Default|Pentest (p50 < ~600 ms `[PENILAIAN/target]`).
- **Layer-2:** subagent sektor pilih dari maks 5–8 skill pemenang (intent registry per-sektor) → tie-break §12 → fallback manual.

### 7.2 Model routing 2 tingkat `[PENILAIAN]`
`ninerouter (pilih tier model fast/coding/reasoning) → LiteLLM (eksekusi + fallback/retry/budget built-in)`. **jev-model-router dibuang** (arsip T3). **LiteLLM = core-active** (kontradiksi "SELALU vs on-demand" diperbaiki).

### 7.3 Quality loop 2 lapis `[PENILAIAN]`
1. **Unified Done-Gate** (melebur builder-reviewer + completion-contract): `exit==0? artefak? test hijau?`.
2. **anti-spin** (hardcoded `max_iterations=3` + circuit breaker; bukan LLM loop).
Di luar runtime: **iFixAi** Exception Auditor (gagal 2x / `/audit`); **promptfoo+deepteam** CI/offline.

### 7.4 Lazy-load MCP (Dynamic MCP Spawning) `[PENILAIAN]`
- **core-active:** codebase-memory-mcp, context7, shadcn, LiteLLM.
- **profil `re-analysis` (aman):** intent RE auto-nyalakan ghidra/jshook/idapro (tanpa --pentest).
- **profil `offensive-c2`:** sliver/AdaptixC2/PentAGI/strix/caldera dst — **WAJIB `--pentest` + consent/scope**.
- Selebihnya on-demand per sektor.

## 8. Katalog Komponen (Tiered)

> **Katalog tiered otoritatif & lengkap (154 komponen, 11 sektor, kolom link repo/lisensi/pin/profil/TIER/port-OpenCode) ada di [`superq-master-catalog-v1.1.md`](./superq-master-catalog-v1.1.md).** PRD ini menyajikan ringkasan Tier 1 per sektor; T2/T3 lihat master catalog.

### 8.1 Ringkasan Tier 1 (Active Production) per sektor `[PENILAIAN]`

| Sektor | Skill/komponen Tier 1 aktif |
|---|---|
| Orchestration & Quality | dispatching-parallel-agents, parallel-agents, subagent-driven-development, multi-agent-coordinator, builder-reviewer-loop→**Unified Done-Gate**, completion-contract-loop→**Unified Done-Gate**, planning-with-files, context-window-management, prompt-caching, ninerouter, commands/orchestration/*, human-approval-loop, tdd-orchestrator, **anti-spin (harness)**, **schema/Pydantic validator (harness)**, iFixAi, **LiteLLM (core-active)** |
| Coding/QA/Mobile | mattpocock/skills (13), ECC (9), pstack (10), playwright-qa, codebase-memory-mcp, context7, shadcn, mongodb/supabase/vercel-ops, impeccable, browser-act, chrome-devtools-axi, gh-axi, adhd, demo-video, id-demo-video |
| Reverse Engineering | **reverse-skill (router)**, **hypeking (sub-modul)**, rea, universal-modder |
| Keamanan/Pentest/C2 | cli-pentestv1, full-audit-keamanan |
| OSINT/Geospatial | geo-sleuth, leafmap |
| Desain/Motion/Media | **claude-motion-design, claude-remotion-skill, gsap-skills, manim** (4 inti), hyperframes, diagram-design, deck-design, json-render, emil-design-eng |
| Data/Dok/CAD/Otomasi | markitdown, docx/pptx/xlsx/pdf-official, text-to-cad, n8n, pageindex, smartdoc, smartbook-ingest |
| Riset | deep-research, deep-research-team, nia-oracle |
| Penulisan/Produktivitas | humanizer, install-anti-slop, technical-writing, unslop, penulis-ilmiah, academic, antislop-sampler |
| Karier | ai-job-search |
| DevOps/Infra/Finance | full-performance-audit (+MCP github/kubernetes/OpenBB di T2) |

### 8.2 Contoh tabel katalog berkolom (potongan; lengkap di master catalog) `[FAKTA nama/pin; PENILAIAN tier/profil]`

| Nama | Tipe | LINK REPO | Lisensi | Pin | Profil | TIER |
|---|---|---|---|---|---|---|
| ninerouter | router | https://github.com/decolua/9router | MIT | a99cf57239ff778b61e434c2786009d5ed1c412c | core (tingkat-1) | T1 |
| LiteLLM | gateway | https://github.com/BerriAI/litellm | MIT | TBD | **core-active** | T1 |
| reverse-skill | skill (router RE) | https://github.com/zhaoxuya520/reverse-skill | MIT | TBD | re-router | T1 |
| hypeking | skill (sub-modul) | https://github.com/kuker24/cli-pentestv1 | MIT | fda8e627f43897884c6c9802619fe839fa149391 | re-analysis | T1 |
| ghidra | MCP | https://github.com/kuker24/cli-pentestv1 | MIT(bundle);Apache-2.0 | fda8e627f43897884c6c9802619fe839fa149391 | re-analysis (lazy) | T2 |
| claude-remotion-skill | skill | https://github.com/haidrrrry/claude-remotion-skill | MIT | TBD | motion-inti | T1 |
| claude-motion-design | skill | https://github.com/howseen-ai/claude-motion-design | MIT | TBD | motion-inti | T1 |
| sliver | MCP/pointer | https://github.com/BishopFox/sliver | GPL-3.0 ⚠️ | TBD | offensive-c2 (eksternal) | T2 |
| PentAGI | MCP/pointer | https://github.com/vxcontrol/pentagi | MIT | TBD | offensive-c2 | T2 |
| github-mcp-server | MCP | https://github.com/github/github-mcp-server | MIT | TBD | on-demand | T2 |
| OpenBB | platform | https://github.com/OpenBB-finance/OpenBB | Apache-2.0 | TBD | on-demand | T2 |
| jev-model-router | mod | https://github.com/davila7/claude-code-templates | MIT | TBD | **dibuang** | T3 |
| remotion-dev/skills | skill | https://github.com/remotion-dev/skills | — (tdk ada) ⚠️ | TBD | digantikan | T3 |
| klik-anim-skill-creation | skill | https://github.com/t3knobox/klik-anim-skill-creation | — (tdk ada) ⚠️ | TBD | digantikan | T3 |
| autogki-patcher | pointer | https://github.com/femmynuppu/autogki-patcher | — (tdk ada) ⚠️ | TBD | referensi-saja | T3 |
| Turnitout-Humanizer | pointer | https://github.com/AhmadHassan-BTed/Turnitout-Humanizer | NOASSERTION ⚠️ | TBD | digantikan | T3 |

## 9. Strategi Lisensi

### 9.1 Target `[FAKTA: license-alternatives]`
- **Vendor-in:** MIT / Apache-2.0 / BSD / MPL-2.0 (file-level).
- **Jangan vendor-in:** GPL / AGPL / NOASSERTION / tanpa lisensi / FSL non-OSI.
- **Pola aman copyleft:** binary/proses eksternal atau layanan via MCP/REST (bukan derivative). AGPL §13: jalankan tak-dimodifikasi sebagai layanan terpisah.

### 9.2 Item bermasalah + penanganan (alternatif permisif) `[FAKTA]`

| Item | Lisensi | Penanganan | Alternatif permisif |
|---|---|---|---|
| sliver / AdaptixC2 | GPL-3.0 | pointer/binary eksternal via MCP (offensive-c2) | **Mythic (BSD-3)** |
| ARTEX | AGPL-3.0 | arsip T3 | **PentAGI (MIT)**; Decepticon; PentestGPT (MIT) |
| CyberStrike | AGPL-3.0 | arsip T3 | **Decepticon (Apache-2.0)** |
| bunkerweb | AGPL-3.0 | pointer eksternal T2 | **OWASP Coraza (Apache-2.0)**; ModSecurity |
| gods-eye-view | NOASSERTION | arsip T3 | **leafmap (MIT)** (T1); TorchGeo |
| remotion | non-OSI khusus | pointer T2; review komersial | **Revideo (MIT)**; Motion Canvas (MIT) |
| **remotion-dev/skills** | tanpa lisensi | **arsip T3 → GANTI claude-remotion-skill (MIT)** / tulis SKILL.md sendiri | claude-remotion-skill (MIT) |
| **klik-anim-skill-creation** | tanpa lisensi | **arsip T3 → tulis ulang MIT** (prinsip animasi publik) | — |
| Turnitout-Humanizer | NOASSERTION + etika | arsip T3 | **antislop-sampler (Apache-2.0)** (T1, de-slop etis) |
| autogki-patcher | tanpa lisensi | arsip T3; pointer saja | mkbootimg/avbtool (Apache); Magisk binary eksternal |
| docx/pptx/xlsx/pdf-official | Anthropic attribution | cek ANTHROPIC_ATTRIBUTION sebelum bundel | — |
| reticle / Sentry MCP | FSL-1.1 | endpoint eksternal saja | — |
| Opik vs Langfuse/Phoenix | — | **Opik (Apache-2.0)**; Phoenix (ELv2 non-OSI) = jalankan lokal, jangan vendor | Langfuse (MIT-core) |

### 9.3 License CI ringan (ganti SPDX enterprise) `[PENILAIAN]`
Scan SPDX enterprise-grade **DIGANTI** **checklist lisensi manual ringan** (niat sama: jangan vendor copyleft). Satu operator → checklist cukup; tidak perlu pipeline SPDX berat.

## 10. Requirement Fungsional & Non-Fungsional

### 10.1 Fungsional (FR) `[PENILAIAN]`

| ID | Requirement |
|---|---|
| FR1 | Orchestrator Core OpenCode menerima tugas → rencana delegasi |
| FR2 | **Layer-0 Zero-LLM** cocokkan slash-command/keyword sebelum LLM |
| FR3 | **Layer-1 Triage LLM** → sektor (11) + complexity Low\|High + profile Default\|Pentest |
| FR4 | **Layer-2** subagent sektor pilih ≤5–8 skill via intent registry per-sektor + tie-break §12 + fallback manual |
| FR5 | MCP lazy-load per profil (core-active/on-demand/re-analysis/offensive-c2) |
| FR6 | Model routing **2 tingkat**: ninerouter (tier) → LiteLLM (eksekusi) |
| FR7 | **Unified Done-Gate** deterministik: `exit==0? artefak? test hijau?` |
| FR8 | **anti-spin** hardcoded (`max_iterations=3` + circuit breaker) |
| FR9 | **iFixAi** Exception Auditor dipanggil hanya saat gagal 2x berturut atau `/audit` |
| FR10 | **promptfoo+deepteam** jalan di CI/offline, bukan runtime per-request |
| FR11 | Validasi I/O runtime = schema/Pydantic struktur; filter jailbreak/topik Guardrails OFF |
| FR12 | Profil `offensive-c2` menolak aktif tanpa flag `--pentest` + file consent/scope |
| FR13 | planning-with-files: subagent tulis `progress.{agent_id}.md`; hanya Synthesizer tulis `task_plan.md`/`findings.md` |
| FR14 | Sandbox default bwrap/Docker lokal; E2B opsional (isolasi cloud) |
| FR15 | Observability default trace JSONL/Phoenix-lokal harian; Opik on-demand benchmark |
| FR16 | Bundle tidak vendor-in GPL/AGPL/NOASSERTION/tanpa-lisensi |
| FR17 | Katalog tiered: T1 aktif, T2 external on-demand, T3 archive (tidak ada di-skip) |

### 10.2 Non-Fungsional (NFR) `[PENILAIAN]`

| ID | Aspek | Target |
|---|---|---|
| NFR1 | Latency Layer-0 | < ~10 ms, 0 token `[PENILAIAN/target, belum dikalibrasi]` |
| NFR2 | Latency Layer-1 triage | p50 < ~600 ms (model fast) `[PENILAIAN/target, belum dikalibrasi]` |
| NFR3 | Paralelisme | fan-out N subagent tanpa race (single-writer: progress.{agent_id}.md) |
| NFR4 | Biaya | semua LLM via LiteLLM; budget per-key + cost-tracking |
| NFR5 | Observability | trace JSONL/Phoenix-lokal default; Opik on-demand |
| NFR6 | Validasi I/O | schema/Pydantic struktur; **tanpa** filter jailbreak/topik |
| NFR7 | Eval | promptfoo hijau di CI sebelum merge skill |
| NFR8 | Audit | iFixAi < 120 s per sub-tugas yang diaudit `[PENILAIAN/target, belum dikalibrasi]` |
| NFR9 | Anti-spin | stop deterministik `max_iterations=3` |
| NFR10 | Keandalan tool-call | retry/fallback via LiteLLM built-in; tidak silent-fail |
| **NFR11** | **OTORISASI pentest (BARU)** | Profil `offensive-c2`/`--pentest`/C2 **wajib** ada **file consent/scope** valid sebelum aktif; tanpa itu → ditolak deterministik |
| NFR12 | Lisensi | **checklist lisensi manual ringan** (bukan SPDX CI berat): 0 source copyleft di vendor/ |
| NFR13 | Sandbox | eksekusi kode subagent di bwrap/Docker lokal (default) |

## 11. Milestone / Roadmap (Fase 1–3)

> Roadmap realistis 3 fase (saran review). `[PENILAIAN]`

### Fase 1 — Core Ramping (MVP harness)
- Orchestrator OpenCode + **routing 2-tahap** (Layer-0/1) + intent registry per-sektor (11 sektor).
- **Model routing 2 tingkat** (ninerouter + LiteLLM core-active).
- **Quality loop 2 lapis** (Unified Done-Gate + anti-spin hardcoded).
- planning-with-files anti-race (single-writer).
- Sektor inti: Orchestration + Coding (warisi engineering-stack OCH).
- Sandbox bwrap/Docker lokal; trace JSONL; schema/Pydantic.
- **Deliverable:** harness ramping jalan untuk coding + fast-path/fan-out.

### Fase 2 — Sektor RE/Pentest + Multi-sektor
- RE: reverse-skill (router) + hypeking (sub-modul) + rea + universal-modder; **profil `re-analysis` lazy-load** (ghidra/jshook/idapro).
- Pentest/C2: profil `offensive-c2` + **NFR11 OTORISASI** (consent/scope + `--pentest`); PentAGI/strix/caldera/sliver (eksternal); deepteam di CI.
- Motion (4 inti), Data/Dokumen/CAD, Riset, Penulisan, Karier, OSINT (geo-sleuth+leafmap).
- MCP on-demand: github/kubernetes-mcp-server, Postgres MCP Pro, OpenBB, mobile-mcp.
- **Deliverable:** cakupan 11 sektor usable, tiering T1/T2/T3 terpasang.

### Fase 3 — Hardening / Eval / Portabilitas
- promptfoo suite penuh + deepteam red-team di CI.
- iFixAi Exception Auditor di jalur gagal.
- **Checklist lisensi manual** final; resolve sisa pin/URL TBD seperlunya.
- Opik/E2B on-demand untuk benchmark/isolasi cloud.
- Finalisasi **port OpenCode** semua komponen `port-OC` (§15); tulis ulang skill tanpa-lisensi (klik-anim, skill Remotion) sebagai MIT.
- **Deliverable:** bundle production-ready, bersih lisensi, teruji.

## 12. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Copyleft/NOASSERTION masuk vendor | Bundle terkontaminasi | Pointer/MCP eksternal (T2/T3); checklist lisensi; alternatif §9 |
| Pin/URL TBD | Reproducibility rendah | Resolve bertahap (Fase 3); prioritaskan T1 |
| Konten offensive (C2) tanpa otorisasi | Penyalahgunaan/kebijakan | **NFR11**: consent/scope + `--pentest` wajib; profil terpisah dari `re-analysis` |
| Triage salah sektor | Subagent salah | Intent registry per-sektor + tie-break §12 + fallback manual |
| Routing 2-tahap turunkan akurasi vs skor 120 | Salah skill | Early-exit Zero-LLM untuk kasus kuat; Layer-2 tetap pakai tie-break; Done-Gate verifikasi |
| Skill tanpa lisensi (Motion/RE) | Risiko hukum | Arsip T3 + tulis ulang MIT / pointer |
| Over-reliance cloud (E2B/Opik) | Biaya/latensi | Default local-first; cloud hanya on-demand |
| Guardrails OFF → output tak aman | Risiko konten | Operator-trust (satu operator); schema/Pydantic tetap jaga struktur; human-approval-loop utk aksi ireversibel |
| Biaya fan-out berlebih | Boros token | Delegasi secukupnya; LiteLLM budget; anti-spin |

## 13. Metrik Sukses / Acceptance

| Metrik | Sukses |
|---|---|
| Done-Gate pass rate | ≥ 95% klaim selesai lolos Unified Done-Gate punya bukti (exit/artefak/test) `[PENILAIAN/target]` |
| Routing accuracy | Tidak ada 2 skill aktif berbagi intent-key per-sektor; golden set ≥ 90% top-1 sektor `[PENILAIAN/target]` |
| Zero-LLM hit-rate | % permintaan terselesaikan rutenya di Layer-0 (diukur) `[PENILAIAN]` |
| Latency triage | Layer-1 p50 < ~600 ms `[PENILAIAN/target, belum dikalibrasi]` |
| CI eval | promptfoo hijau di main; regresi skill blok merge |
| License clean | checklist manual: 0 source copyleft di vendor/ |
| Core MCP | codebase-memory-mcp, context7, shadcn + LiteLLM core-active hidup di default `[FAKTA core-3]` |
| OTORISASI | 0 aktivasi `offensive-c2` tanpa consent/scope valid |
| Anti-spin | 0 run melebihi `max_iterations=3` tanpa stop |
| Fast-path ratio | tugas Low tidak memicu fan-out >1 subagent |

## 14. Lampiran

### 14.1 File sumber & output di `/workspace/crush-port/`

| File | Peran |
|---|---|
| `SuperQ-PRD.md` | PRD v1.0 (dipertahankan) |
| `SuperQ-PRD-v1.1.md` | **PRD v1.1 ramping (file ini)** |
| `superq-master-catalog.md` / `-v1.1.md` | Katalog v1.0 / **v1.1 tiered** |
| `superq-routing-matrix.md` / `-v1.1.md` | Routing v1.0 / **v1.1 ramping** |
| `superq-gap-analysis.md` | TOP 10 gap permisif |
| `superq-sources-categorized.md` | Verifikasi repo |
| `superq-starred-candidates.md` | starred kuker24 |
| `superq-license-alternatives.md` | Alternatif permisif |
| `och-sources-list.md` | 66 skill + 12 MCP OCH + pin |
| `aitmpl-adoptables.md` | Komponen davila7 |
| `superq-arch.png` / `.mmd` | Diagram arsitektur (v1.0) |

### 14.2 Sumber upstream utama (link apa adanya)
OCH `https://github.com/kuker24/OpenCodeHighEnd` (main @ 30d394fb37bbe1ca64abe1a660aefd91ac7d99fc / v0.1.18) · davila7/claude-code-templates (MIT) · mattpocock/skills (`d81f3a18…`/v1.3.0) · cursor/plugins pstack (`e43c7ee2…`/v0.15.9) · affaan-m/ECC · kuker24/cli-pentestv1 (`fda8e627…`) · decolua/9router (`a99cf572…`/v0.5.95) · vxcontrol/pentagi · ifixai-ai/iFixAi · BerriAI/litellm · comet-ml/opik · guardrails-ai/guardrails · e2b-dev/E2B · promptfoo/promptfoo. `[FAKTA]`

### 14.3 Sisa URL TBD (tidak diubah)
mongodb-ops, supabase-ops, vercel-ops, adhd, browser-act, chrome-devtools-axi, gh-axi, impeccable, full-audit-keamanan, emil-design-eng, found-this-design, visual-studio, smartdoc, smartbook-ingest, penulis-ilmiah (skill+MCP), academic, full-performance-audit, reticle, demo-video, id-demo-video. `[FAKTA]`

### 14.4 Sisa pin TBD (tidak diubah)
Mayoritas komponen davila7/aitmpl (dispatching/parallel/subagent-driven/loops/planning/context-window/prompt-caching/commands dll), ECC (9), semua fondasi (LiteLLM/Opik/Guardrails/E2B/promptfoo), seluruh pointer pentest/C2 (strix/deepteam/caldera/PentAGI/AdaptixC2/ARTEX/CyberStrike/bunkerweb/Fieldwatch/Mythic/Decepticon), RE (reverse-skill/rea/universal-modder/autogki-patcher), seluruh Motion kecuali yang sudah ber-SHA (business-motion-film/scroll-craft/scroll-world/json-render), Data (text-to-cad/n8n/markitdown-MCP/Postgres), Riset (semua davila7 + exa), OSINT (geo-sleuth/leafmap/gods-eye-view/TorchGeo), DevOps/Finance (github/kubernetes-mcp-server/OpenBB), antislop-sampler, ai-job-search, Revideo. Pin yang SUDAH ada: OCH ber-SHA, cli-pentestv1 `fda8e627…`, ninerouter `a99cf572…`, mattpocock `d81f3a18…`, pstack `e43c7ee2…`, hyperframes `6037d228…`, diagram-design `f903933a534b`, deck-design `f50edac6…`, markitdown `b8f79c57…`, pageindex `6d23caf4…`, crawl4ai `133e1d92…`, scrapling `333fa22b…`, humanizer `225a6f39ac85`, install-anti-slop `c44ef22c…`, impeccable `cd12f8660e2d`, emil `e8a175de…`, browser-act `11c057b0…`, business-motion-film `255562b0…`, scroll-craft `75d81f74…`, scroll-world `71cc36d3…`, json-render `c2600d73…`. `[FAKTA]`

## 15. Catatan Portabilitas OpenCode

> **TARGET = OpenCode.** SuperQ bukan bundle Claude Code. Semua konvensi harness ikut OpenCode. `[FAKTA: konteks]`

### 15.1 Konvensi harness OpenCode
- **Konfigurasi:** `opencode.json` — termasuk **mcp block** (daftar MCP server, enabled true/false per profil), definisi **agent/subagent**, dan **routing**. Bukan `.claude/` atau `claude_desktop_config.json`.
- **Skill:** dipasang di **folder skill OpenCode** (struktur skill OpenCode), bukan `.claude/skills`.
- **Agent/subagent & routing:** definisi subagent sektor + aturan routing 2-tahap ditulis dalam konvensi OpenCode (Orchestrator → subagent).
- **Slash-command (Layer-0):** `commands/orchestration/*` dan `/audit`, `/pentest` dipetakan ke command OpenCode.

### 15.2 Komponen asal ekosistem Claude → perlu port
Sumber dari ekosistem Claude **boleh dipakai** tetapi **ditandai `port-OC`** di katalog (perlu port/adaptasi ke format OpenCode):
- **davila7/claude-code-templates (aitmpl):** orchestration skills/loops/agents/commands, riset, dokumen, motion (manim/motion-canvas), MCP wrappers — frontmatter SKILL.md, hook TS, dan struktur folder perlu disesuaikan ke OpenCode.
- **mattpocock/skills:** 13 engineering skills — format skill Claude → folder skill OpenCode.
- **cursor/plugins (pstack):** manual commands → command OpenCode.
- **affaan-m/ECC:** 9 skill → folder skill OpenCode.
- **GrokBestFriend/OCH snapshots:** sudah di OCH; pastikan manifes OpenCode.

### 15.3 MCP & endpoint
- MCP (`mcp-OC`) didaftarkan di **mcp block `opencode.json`** dengan `enabled` sesuai profil (core-active / on-demand / re-analysis / offensive-c2).
- Pointer/binary eksternal (`endpoint`) dipanggil via CLI/REST/MCP tanpa vendor-in (copyleft aman).

### 15.4 Yang sudah native-OpenCode
Komponen harness-native (Unified Done-Gate, anti-spin counter, schema/Pydantic validator, LiteLLM gateway) ditulis langsung di harness SuperQ/OpenCode (`native-OC`), tidak perlu port.

## 16. Tier Katalog

> Lengkap di `superq-master-catalog-v1.1.md §14`. Ringkas: `[PENILAIAN/target]`

| TIER | Definisi | Jumlah (baris katalog) |
|---|---|---|
| **T1 — Active Production** | Pemenang + inti aktif; lisensi permisif bersih. Target ~65 (74 baris aktif; 3 baris agregat bundle → ~101 skill individual) | **74** |
| **T2 — External On-Demand** | MCP/pointer/binary/endpoint lazy-load (fondasi on-demand, item copyleft eksternal, profil re-analysis & offensive-c2) | **42** |
| **T3 — Archive** (`docs/archive-alternatives.md`) | alternatif-digantikan + konsolidasi Motion + risiko tinggi/tanpa-lisensi + jev-model-router | **38** |
| **TOTAL** | Tidak ada di-skip; hanya beda status | **154** |

**Isi utama T3 (archive):** adversarial-review-loop, devils-advocate-loop, quality-streak-loop, anti-spin-build-loop, jev-model-router, workflow/error/it-ops-orchestrator, think-tank, ai-maestro/*, loki-mode, swarmvault, autogki-patcher, ARTEX, CyberStrike, gods-eye-view, remotion-dev/skills, klik-anim-skill-creation, motion-graphics-skills, product-launch-motion, claude-motion, motion-canvas, hyperframes-motion-reel-skill, animata, lottie-web, business-motion-film, scroll-craft/world, found-this-design, visual-studio, excalidraw/draw-io/mermaid/c4/marp, deep-research-notebooklm, perplexity, avoid-ai-writing, skill-judge/creator/writing-skills, memory-integration, Turnitout-Humanizer.

---

*Disusun dari file sumber read-only di `/workspace/crush-port/` pada 21 Okt 2026 (Asia/Jakarta). Tidak ada commit/push. Tidak ada SHA/URL/benchmark dikarang; angka SLA = [PENILAIAN/target, belum dikalibrasi].*
