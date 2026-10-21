# SuperQ — Matriks Routing v1.1 (RAMPING: 2-Tahap / Model 2-Tingkat / Quality 2-Lapis / Lazy-load MCP)

> **Versi:** 1.1 · **Tanggal:** 21 Okt 2026 (WIB) · **Pemilik:** Fahmi (kuker24) · **Target harness:** **OpenCode** (routing & agent/subagent ikut konvensi OpenCode).
> Read-only / spec. Tidak ada repo diubah/di-commit/di-push. Nama komponen konsisten dengan `superq-master-catalog-v1.1.md`. Versi lama tetap di `superq-routing-matrix.md`.
>
> **Legenda:** `[FAKTA]` = dari file sumber · `[PENILAIAN]` = judgment routing. Angka SLA/latensi = `[PENILAIAN/target, belum dikalibrasi]`.

---

## 0. PRINSIP RAMPING `[PENILAIAN]`

Routing lama (skor 1-dari-120 skill) diganti **routing 2-tahap** + **early-exit zero-LLM**. Tujuan: minim token, latensi kecil, akurasi dijaga lewat **intent registry per-sektor** + **tie-break mirip→pemenang** + **fallback deterministik ke manual** (tidak menebak).

---

## A. ROUTING 2-TAHAP (ganti skor 1-dari-120)

### Layer-0 — Zero-LLM (0 token, instan) `[PENILAIAN]`
- **Slash-command eksplisit** (mis. `/audit`, `/pentest`, `commands/orchestration/*`) → langsung ke handler, **tanpa LLM**.
- **Keyword/regex match** → kalau pola kuat & unik cocok (mis. `re:/\bdecompile|ghidra|apk\b/i` → sektor RE; `re:/\b(order|refund|track)\b/`), langsung set sektor + profil.
- Kalau tak ada match kuat → turun ke Layer-1.
- **Target:** 0 token, < ~10 ms. `[PENILAIAN/target, belum dikalibrasi]`

### Layer-1 — Triage LLM (klasifikasi ringkas) `[PENILAIAN]`
Satu panggilan LLM kecil meng-klasifikasi ke **3 keluaran saja**:
1. **SEKTOR** → salah satu dari **11 sektor** (bukan 120 skill).
2. **complexity** → `Low` (fast-path 1 subagent) | `High` (fan-out per sektor).
3. **profile** → `Default` | `Pentest` (profil `offensive-c2`; butuh `--pentest` + consent/scope).
- **Target latensi** jauh lebih kecil dari skor 120-skill: p50 < ~600 ms, hanya butuh model `fast`. `[PENILAIAN/target, belum dikalibrasi]`

### Layer-2 — Subagent sektor memilih skill `[PENILAIAN]`
Subagent sektor terpilih memilih dari **maksimal 5–8 skill pemenang (Tier 1) di sektornya** via **intent registry per-sektor** (bukan global 120). Tie-break pakai tabel §12 katalog; seri tanpa aturan → **fallback deterministik ke `manual`**.

### 11 SEKTOR + daftar 5–8 skill aktif (Tier 1) `[PENILAIAN]`

| # | SEKTOR | Skill aktif (5–8 pemenang Tier 1) | Keyword Layer-0 (contoh) |
|---|---|---|---|
| 1 | **Orchestration & Quality** | dispatching-parallel-agents, parallel-agents, subagent-driven-development, planning-with-files, Unified Done-Gate, iFixAi, commands/orchestration/* | orchestrate, plan, fan-out, `/start` `/status` `/resume` |
| 2 | **Coding/Engineering/QA/Mobile** | codebase-design, diagnosing-bugs, matt-code-review, tdd, to-spec/to-tickets, playwright-qa, (ECC api-design), (pstack architect/interrogate) | bug, refactor, PR, test, API, build |
| 3 | **Reverse Engineering** | reverse-skill (router), hypeking (sub-modul), rea, universal-modder | decompile, ghidra, apk, binary, hook, mod |
| 4 | **Keamanan/Pentest/C2** | full-audit-keamanan, cli-pentestv1, strix, PentAGI, caldera, deepteam | pentest, exploit, c2, recon, scope |
| 5 | **OSINT/Geospatial** | geo-sleuth, leafmap | geolocate, osint, satellite, coordinates |
| 6 | **Desain/Motion/Media** | claude-motion-design, claude-remotion-skill, gsap-skills, manim, hyperframes, diagram-design, deck-design | animation, motion, video, diagram, slide |
| 7 | **Data/Dokumen/CAD/Otomasi** | markitdown, docx/pptx/xlsx/pdf-official, text-to-cad, n8n, pageindex | pdf, docx, excel, cad, workflow |
| 8 | **Riset** | deep-research, deep-research-team, nia-oracle | research, paper, arxiv, investigate |
| 9 | **Penulisan/Produktivitas** | humanizer, install-anti-slop, technical-writing, unslop, penulis-ilmiah, academic, antislop-sampler | write, humanize, de-slop, docs |
| 10 | **Karier** | ai-job-search | job, CV, resume, cover letter, interview |
| 11 | **DevOps/Infra/Finance** | full-performance-audit (+ MCP: github/kubernetes-mcp-server, OpenBB) | repo, CI, k8s, deploy, stock, finance |

### Menjaga akurasi `[PENILAIAN]`
1. **Intent registry per-sektor**: tiap skill Tier 1 punya `intent-key` unik dalam sektornya; tak ada 2 skill aktif berbagi intent-key.
2. **Tie-break** merujuk keputusan **"mirip→pemenang"** (katalog §12).
3. **Fallback deterministik ke manual**: seri + tanpa aturan → minta disambiguasi / subagent generik. Tidak menebak.
4. **Verifikasi**: Unified Done-Gate memastikan rute benar-benar menyelesaikan tugas; anti-spin memotong rute mandek.

---

## B. MODEL ROUTING 2 TINGKAT (buang jev-model-router)

| Tingkat | Komponen | Peran | Kapan |
|---|---|---|---|
| 1 — pemilih tier | **ninerouter** (`a99cf572…`) | Pilih **tier model**: `fast` / `coding` / `reasoning` sesuai complexity+sektor | Setiap tugas `[FAKTA: pemenang router §12]` |
| 2 — gateway eksekusi | **LiteLLM** (core-active) | Eksekusi panggilan + **fallback/retry/budget built-in**, cost-tracking, rate-limit | SELALU (core-active WAJIB) `[PENILAIAN]` |

**Urutan runtime:** `ninerouter (pilih tier) → LiteLLM (eksekusi + fallback provider + budget)`.
**jev-model-router DIBUANG** → arsip T3. Fallback kini ditangani built-in LiteLLM (bukan router kedua). `[PENILAIAN]`
**Kontradiksi diperbaiki:** LiteLLM sebelumnya "SELALU di jalur tapi profil on-demand" → sekarang **core-active** (enabled:true), konsisten. `[PENILAIAN]`

---

## C. QUALITY LOOP 2 LAPIS (5→2)

Loop lama (builder-reviewer, completion-contract, anti-spin, + Guardrails + iFixAi tiap request) → **diringkas jadi 2 lapis deterministik**:

### Lapis 1 — Unified Done-Gate (deterministik) `[PENILAIAN]`
Melebur **builder-reviewer-loop + completion-contract-loop** jadi satu gate berbasis cek konkret (bukan LLM):
```
DONE jika dan hanya jika:
  exit_code == 0            (perintah sukses)
  AND artefak target ada    (file/output yang dijanjikan)
  AND test hijau            (suite/relevant test pass)
Else → NOT DONE → kembali ke Orchestrator (re-plan), bukan klaim sukses.
```

### Lapis 2 — anti-spin (hardcoded counter) `[PENILAIAN]`
- **Loop counter hardcoded di harness**: `max_iterations = 3`, lalu **circuit breaker** (stop deterministik). BUKAN LLM loop.
- Memotong run mandek/flip-flop/budget habis.

### Di luar 2 lapis (bukan runtime per-request) `[PENILAIAN]`
- **iFixAi = Exception Auditor**: dipanggil **hanya** saat subagent **gagal 2x berturut** ATAU via `/audit` manual. Bukan tiap request. Target < 120 s per audit `[PENILAIAN/target, belum dikalibrasi]`.
- **promptfoo + deepteam = CI/offline eval periodik**: jalan di CI/offline, **bukan** runtime per-request.
- **Guardrails jailbreak/topik = DIMATIKAN**; validasi I/O runtime hanya **schema/Pydantic ringan** (struktur), karena workload RE/pentest sah milik operator.

---

## D. LAZY-LOAD MCP (Dynamic MCP Spawning)

| Profil | MCP/pointer | Trigger aktivasi | Syarat |
|---|---|---|---|
| **core-active** | codebase-memory-mcp, context7, shadcn, **LiteLLM** | enabled:true di `opencode.json` | — |
| **on-demand** | serena, markitdown(MCP), exa, crawl4ai, scrapling, searxng, jina-ai, arxiv, mcp-server-nia, n8n-mcp, elevenlabs, Postgres MCP Pro, github-mcp-server, kubernetes-mcp-server, OpenBB, mobile-mcp, stitch, ui-skills, Opik, E2B, Guardrails | intent sektor terkait (Layer-1/2) | lazy-load saat dibutuhkan |
| **`re-analysis`** (aman) | **ghidra, jshook, idapro** | **intent RE auto-nyalakan** (via reverse-skill) | tanpa `--pentest`; aman on-demand |
| **`offensive-c2`** (berbahaya) | sliver, AdaptixC2, PentAGI, strix, caldera, Mythic, Decepticon, bunkerweb | profile=`Pentest` di Layer-1 | **WAJIB flag `--pentest` + file consent/scope** (lihat NFR OTORISASI di PRD) |

**Pemisahan kritis:** profil `re-analysis` (RE non-ofensif) **terpisah** dari `offensive-c2`. Intent RE (decompile/hook/mod) hanya menyalakan ghidra/jshook/idapro — **tidak** menyalakan C2. `[PENILAIAN]`

---

## E. ORCHESTRATOR FLOW RAMPING

```
PERMINTAAN FAHMI
   │
   ▼
[Layer-0] ZERO-LLM  (slash-command? keyword/regex?)  ── match ──► set SEKTOR+profil ──┐
   │ no-match                                                                         │
   ▼                                                                                  │
[Layer-1] TRIAGE LLM (model fast)                                                     │
   │  → SEKTOR (1 dari 11) · complexity Low|High · profile Default|Pentest            │
   ▼                                                                                  │
[Layer-2] SUBAGENT SEKTOR ◄───────────────────────────────────────────────────────────┘
   │  pilih 5–8 skill pemenang (intent-registry per-sektor → tie-break §12 → fallback manual)
   │  MODEL: ninerouter (pilih tier) → LiteLLM (eksekusi+fallback+budget)
   │  MCP: lazy-load profil (core-active / on-demand / re-analysis / offensive-c2)
   │
   ├─ complexity=Low  → FAST-PATH 1 subagent
   └─ complexity=High → FAN-OUT per sektor (dispatching/parallel/subagent-driven)
         • tiap subagent tulis progress.{agent_id}.md (anti-race)
         • sandbox: bwrap/Docker lokal (E2B hanya bila isolasi cloud)
         • observability: trace JSONL / Phoenix-lokal (Opik hanya benchmark berat)
   │
   ▼
QUALITY LOOP 2 LAPIS
   [1] Unified Done-Gate (exit==0? artefak? test hijau?)  → gagal → re-plan
   [2] anti-spin (max_iterations=3, circuit breaker)
   (iFixAi hanya jika gagal 2x berturut / /audit ; promptfoo+deepteam di CI)
   │
   ▼
SYNTHESIZER  ── hanya Synthesizer tulis task_plan.md & findings.md ──►  jawaban final
```

### Anti-race (planning-with-files) `[PENILAIAN]`
- **Tiap subagent** hanya menulis `progress.{agent_id}.md` (file miliknya sendiri → tak ada tulis-bersamaan).
- **Hanya Synthesizer** yang menulis `task_plan.md` dan `findings.md` utama (single-writer → tak ada race condition).

---

## F. CATATAN FAKTA vs PENILAIAN
- `[FAKTA]`: nama skill/MCP, status profil MCP, keputusan pemenang §12, peran fungsional, catatan lisensi — dari `superq-master-catalog-v1.1.md` & sumber.
- `[PENILAIAN]`: struktur 2-tahap, 11 sektor & pemetaan skill, model routing 2 tingkat, quality loop 2 lapis, profil `re-analysis`/`offensive-c2`, anti-race single-writer.
- `[PENILAIAN/target, belum dikalibrasi]`: semua angka SLA/latensi (Layer-0 <10ms, Layer-1 p50<600ms, iFixAi <120s, max_iterations=3).
