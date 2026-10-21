# SuperQ — Katalog Master Skill + MCP (v1.1 — RAMPING / TIERED)

> **Versi:** 1.1 · **Tanggal:** 21 Okt 2026 (Asia/Jakarta, UTC+7) · **Pemilik:** Fahmi Harun (GitHub [`kuker24`](https://github.com/kuker24))
> **Target harness:** **OpenCode** (konfigurasi `opencode.json` + mcp block, folder skill OpenCode, agent/subagent & routing OpenCode). **BUKAN Claude Code.**
> Sumber komponen boleh dari ekosistem Claude (aitmpl/davila7, pstack, mattpocock dll) **tetapi ditandai "perlu port/adaptasi ke format OpenCode"** — lihat §P Catatan Portabilitas OpenCode.
> **Read-only / spec:** tidak ada repo yang diubah/di-commit/di-push. Semua URL/SHA diambil apa adanya dari file sumber; yang tak ada → `pin: TBD` / `URL: TBD`. Tidak dikarang.
> Versi lama tetap ada di `superq-master-catalog.md` (v1.0). File ini adalah tulis-ulang ramping bertiering.

**Legenda klaim:** `[FAKTA]` = dari file sumber. `[PENILAIAN]` = judgment penyusunan (termasuk penetapan TIER, profil aktif, dan angka target).

**Legenda TIER (baru di v1.1):**
- **T1 — Active Production** `[PENILAIAN]`: pemenang + inti yang dipasang aktif; lisensi permisif bersih (MIT/Apache-2.0/BSD; MPL file-level). Target ~65 komponen aktif.
- **T2 — External On-Demand** `[PENILAIAN]`: MCP/pointer/binary/endpoint yang di-*lazy-load* via CLI/endpoint (termasuk fondasi runtime on-demand & item copyleft eksternal). Tidak di-vendored.
- **T3 — Archive** `[PENILAIAN]`: dicatat di `docs/archive-alternatives.md`; mencakup semua `alternatif-digantikan` + item risiko tinggi/tanpa-lisensi. **Tidak dibuang** (hormati aturan Fahmi "tidak ada yang di-skip"), hanya nonaktif — tinggal diaktifkan.

**Aturan Fahmi yang tetap dipatuhi:** (1) semua komponen DIMASUKKAN, tidak ada yang di-skip (cuma beda TIER); (2) item mirip → satu pemenang + alasan + yang kalah dicatat; (3) Reverse Engineering WAJIB ada; (4) disusun per sektor (11 sektor).

---

## 0. ARSITEKTUR RAMPING (ringkas) `[PENILAIAN]`

SuperQ v1.1 = Orchestrator tipis OpenCode + **routing 2-tahap** + **model routing 2 tingkat** + **quality loop 2 lapis**, dengan **lazy-load MCP** (Dynamic MCP Spawning). Detail flow di `superq-routing-matrix-v1.1.md`.

```
PERMINTAAN
  → Layer-0 (Zero-LLM: slash-command + keyword/regex)          [0 token]
  → Layer-1 (Triage LLM: 11 SEKTOR + complexity Low|High + profile Default|Pentest)
  → Layer-2 (subagent sektor memilih 5–8 skill pemenang di sektornya)
  → Model routing: ninerouter (pilih tier model) → LiteLLM (gateway eksekusi + fallback/retry/budget)
  → Quality loop 2 lapis: [1] Unified Done-Gate deterministik  [2] anti-spin hardcoded counter (max_iterations=3)
       (iFixAi = Exception Auditor hanya saat gagal 2x berturut atau /audit; promptfoo+deepteam = CI/offline)
  → Synthesizer → jawaban final
```

11 SEKTOR: (1) Orchestration & Quality · (2) Coding/Engineering/QA/Mobile · (3) Reverse Engineering · (4) Keamanan/Pentest/C2 · (5) OSINT/Geospatial · (6) Desain/Motion/Media · (7) Data/Dokumen/CAD/Otomasi · (8) Riset · (9) Penulisan/Produktivitas · (10) Karier · (11) DevOps/Infra/Finance.

---

## §1 — SEKTOR: Orchestration & Quality

> Kolom: Nama · Tipe · Sumber (URL + pin) · Lisensi · Status/Pemenang · **TIER** · Port OpenCode · Catatan.
> Port OpenCode: `native-OC` (sudah cocok) · `port-OC` (perlu port/adaptasi dari format Claude ke OpenCode).

| Nama | Tipe | Sumber (URL + pin) | Lisensi | Status | TIER | Port OC | Catatan |
|---|---|---|---|---|---|---|---|
| dispatching-parallel-agents | skill | github.com/davila7/claude-code-templates; pin: TBD | MIT | pemenang (fan-out lepas) | **T1** | port-OC | Default fan-out tugas lepas |
| parallel-agents | skill | davila7/claude-code-templates; pin: TBD | MIT | pemenang (routing per-domain) | **T1** | port-OC | Peran beda dari dispatching |
| subagent-driven-development | skill | davila7/claude-code-templates; pin: TBD | MIT | pemenang (sekuensial+review) | **T1** | port-OC | Orchestrator + fresh worker |
| multi-agent-coordinator | agent | davila7/claude-code-templates `expert-advisors/`; pin: TBD | MIT | WAJIB-ADA | **T1** | port-OC | State bersama, sinkronisasi → subagent OpenCode |
| builder-reviewer-loop | loop | davila7/claude-code-templates `engineering/`; pin: TBD | MIT | **melebur → Unified Done-Gate** | **T1** | port-OC | Sumber pola gate; lihat §Q Quality |
| completion-contract-loop | loop | davila7/claude-code-templates `loops/`; pin: TBD | MIT | **melebur → Unified Done-Gate** | **T1** | port-OC | Sumber pola bukti; lihat §Q Quality |
| Unified Done-Gate | harness-native | (ditulis di harness SuperQ/OpenCode) | MIT (first-party) | **WAJIB-ADA (BARU)** | **T1** | native-OC | Gate deterministik: `exit==0? artefak ada? test hijau?` — melebur builder-reviewer + completion-contract |
| anti-spin (circuit breaker) | harness-native | (hardcoded di harness; `max_iterations=3`) | MIT (first-party) | **WAJIB-ADA (BARU)** | **T1** | native-OC | Loop counter + circuit breaker; BUKAN LLM loop. Menggantikan anti-spin-build-loop |
| ninerouter | skill/router | github.com/decolua/9router `a99cf57239ff778b61e434c2786009d5ed1c412c` / v0.5.95 | MIT | pemenang (pemilih tier model) | **T1** | port-OC | Tingkat-1 model routing: pilih tier fast/coding/reasoning |
| planning-with-files | skill | davila7/claude-code-templates `productivity/workflow-automation`; pin: TBD | MIT | WAJIB-ADA (anti-race) | **T1** | port-OC | Tiap subagent → `progress.{agent_id}.md`; **hanya Synthesizer** tulis `task_plan.md`/`findings.md` |
| context-window-management | skill | davila7/claude-code-templates `ai-research/`; pin: TBD | MIT | WAJIB-ADA | **T1** | port-OC | Ringkas/pangkas konteks = kecepatan |
| prompt-caching | skill | davila7/claude-code-templates `ai-research/`; pin: TBD | MIT | aktif (efisiensi) | **T1** | port-OC | Caching prompt lintas subagent |
| commands/orchestration/* (start,status,resume,sync,feature-pipeline,report) | command | davila7/claude-code-templates `commands/orchestration/`; pin: TBD | MIT | WAJIB-ADA | **T1** | port-OC | Jadi slash-command Layer-0 OpenCode |
| human-approval-loop | loop | davila7/claude-code-templates `loops/`; pin: TBD | MIT | aktif (gate ireversibel) | **T1** | port-OC | Approval manusia utk aksi berisiko |
| tdd-orchestrator | skill | davila7/claude-code-templates `development/`; pin: TBD | MIT | aktif (coding) | **T1** | port-OC | TDD multi-agent |
| schema/Pydantic I/O validator | harness-native | (ditulis di harness) | MIT (first-party) | **WAJIB-ADA (BARU)** | **T1** | native-OC | Validasi STRUKTUR I/O ringan; **menggantikan** peran filter berat Guardrails di runtime |
| iFixAi | agent/harness | github.com/ifixai-ai/iFixAi; pin: TBD | Apache-2.0 | **Exception Auditor (peran disempitkan)** | **T1** | port-OC | Hanya saat subagent gagal **2x berturut** atau `/audit` manual (bukan tiap request) |
| ⭐ LiteLLM | gateway/proxy (+MCP) | github.com/BerriAI/litellm; pin: TBD | MIT (core; dir `enterprise/` terpisah) | **core-active (WAJIB)** — kontradiksi diperbaiki | **T1** | native-OC | Tingkat-2 model routing: gateway eksekusi + fallback/retry/budget built-in. SELALU di jalur LLM |
| adversarial-review-loop | loop | davila7/claude-code-templates `loops/`; pin: TBD | MIT | alternatif-digantikan | **T3** | port-OC | Arsip; review adversarial berat |
| devils-advocate-loop | loop | davila7/claude-code-templates `loops/`; pin: TBD | MIT | alternatif | **T3** | port-OC | Arsip |
| quality-streak-loop | loop | davila7/claude-code-templates `loops/`; pin: TBD | MIT | opsional | **T3** | port-OC | Arsip |
| anti-spin-build-loop | loop | davila7/claude-code-templates `loops/`; pin: TBD | MIT | **digantikan** (circuit breaker harness) | **T3** | port-OC | Arsip; logikanya kini hardcoded |
| jev-model-router | mod (hook TS) | davila7/claude-code-templates `mods/productivity/`; pin: TBD | MIT | **DIBUANG** (model routing jadi 2 tingkat) | **T3** | port-OC | Arsip; ninerouter+LiteLLM cukup |
| workflow-orchestrator | agent | davila7/claude-code-templates `expert-advisors/`; pin: TBD | MIT | pendukung | **T3** | port-OC | Arsip |
| error-coordinator | agent | davila7/claude-code-templates `expert-advisors/`; pin: TBD | MIT | pendukung | **T3** | port-OC | Arsip |
| it-ops-orchestrator | agent | davila7/claude-code-templates `expert-advisors/`; pin: TBD | MIT | pendukung | **T3** | port-OC | Arsip |
| think-tank | skill | davila7/claude-code-templates `productivity/`; pin: TBD | MIT | opsional | **T3** | port-OC | Arsip |
| ai-maestro/* | skill | davila7/claude-code-templates; pin: TBD | MIT (cek per-item) | opsional | **T3** | port-OC | Arsip; butuh tool AI Maestro |
| loki-mode | skill | davila7/claude-code-templates `ai-research/`; pin: TBD | LICENSE sendiri (cek) ⚠️ | referensi-saja (RISIKO TINGGI) | **T3** | port-OC | Arsip; wajib `--dangerously-skip-permissions` |
| ⭐ Opik (Comet) | platform tracing+eval | github.com/comet-ml/opik; pin: TBD | Apache-2.0 | observability on-demand (benchmark berat) | **T2** | endpoint | Default harian = trace JSONL / Phoenix-lokal; Opik dinyalakan saat benchmarking |
| ⭐ E2B | sandbox SDK/infra | github.com/e2b-dev/E2B; pin: TBD | Apache-2.0 | sandbox cloud on-demand | **T2** | endpoint | Default sandbox = bwrap/Docker lokal; E2B saat butuh isolasi cloud |
| ⭐ promptfoo | CLI eval + red-team | github.com/promptfoo/promptfoo; pin: TBD | MIT | eval CI/offline (bukan runtime) | **T2** | CLI | Periodik di CI, bukan per-request |
| ⭐ Guardrails AI | framework validator | github.com/guardrails-ai/guardrails; pin: TBD | Apache-2.0 | **filter jailbreak/topik DIMATIKAN** | **T2** | endpoint | Hanya dipakai bila perlu validator eksternal berat; filter topik OFF (workload RE/pentest sah) |
| PentAGI | MCP/pointer (orchestrator) | github.com/vxcontrol/pentagi; pin: TBD | MIT | WAJIB-ADA (blueprint pentest) | **T2** | endpoint | Blueprint hierarki; aktif hanya profil `offensive-c2` + `--pentest` + consent |

**Catatan Phoenix-lokal:** observability default harian memakai trace JSONL dan/atau Arize Phoenix dijalankan lokal. Phoenix berlisensi Elastic License 2.0 (non-OSI ⚠️) → **jalankan sebagai layanan lokal, jangan vendor-in**. `[FAKTA: lisensi Phoenix ELv2 dari gap-analysis]`

---

## §2 — SEKTOR: Coding / Engineering / QA / Mobile

| Nama | Tipe | Sumber (URL + pin) | Lisensi | Status | TIER | Port OC | Catatan |
|---|---|---|---|---|---|---|---|
| mattpocock/skills (bundle: codebase-design, diagnosing-bugs, domain-modeling, grill-with-docs, matt-code-review, prototype, tdd, to-spec, to-tickets, research, improve-codebase-architecture, wizard, writing-for-agents) | skill/command (13) | github.com/mattpocock/skills `d81f3a183412e71a5b1e84ca21bc1a35eea03a60` / v1.3.0 | MIT | duplikat-OCH (inti engineering) | **T1** | port-OC | Engineering-stack OCH; format skill Claude → folder skill OpenCode |
| ECC (bundle: api-design, contract-first, agent-architecture-audit, automation-audit-ops, click-path-audit, code-tour, cost-aware-llm-pipeline, eval-harness, skill-stocktake) | skill (9) | github.com/affaan-m/ECC; pin: TBD | MIT | duplikat-OCH | **T1** | port-OC | `cost-aware-llm-pipeline` kini ditegakkan runtime oleh LiteLLM |
| pstack/plugins (bundle: architect, arena, blast-radius, create-verification-skill, decision-log, figure-it-out, interrogate, maintain-verification-skill, reflect, why) | manual command (10) | github.com/cursor/plugins `e43c7ee26e0038c6c1fa8380dd34ce86ff94cb2a` / v0.15.9 | MIT | duplikat-OCH | **T1** | port-OC | Slash-command Layer-0 (technical-writing & unslop → §9) |
| playwright-qa | skill | github.com/microsoft/playwright-cli `b85c7a736bb473bf55b584e54a09ffa698d6d871` | Apache-2.0 | duplikat-OCH | **T1** | port-OC | QA web/browser |
| codebase-memory-mcp | MCP | github.com/DeusData/codebase-memory-mcp v0.11.0; sha256 `1f9e8293eb2bc5c05cfa27a7e8fc033da6d729ffad525ccfcdaa3fd606306683` | — (cek) | **core-active** · duplikat-OCH | **T1** | mcp-OC | enabled:true di `opencode.json` mcp block |
| context7 | MCP | mcp.context7.com/mcp | — | **core-active** · duplikat-OCH | **T1** | mcp-OC | Docs live; enabled:true |
| shadcn | MCP | github.com/shadcn-ui/ui v4.21.1 | — | **core-active** · duplikat-OCH | **T1** | mcp-OC | enabled:true |
| mongodb-ops | skill | URL: TBD (first-party OCH) | MIT | duplikat-OCH | **T1** | port-OC | — |
| supabase-ops | skill | URL: TBD (first-party OCH) | MIT | duplikat-OCH | **T1** | port-OC | — |
| vercel-ops | skill | URL: TBD (first-party OCH) | MIT | duplikat-OCH | **T1** | port-OC | — |
| impeccable | skill | URL: TBD (GrokBestFriend snapshot); sources pin `cd12f8660e2d` / skill-v4.3.1 | Apache-2.0 | duplikat-OCH | **T1** | port-OC | — |
| browser-act | skill | URL: TBD (GrokBestFriend snapshot); sources pin `11c057b03f92101642cadc9f840564574120d184` | MIT | duplikat-OCH | **T1** | port-OC | — |
| chrome-devtools-axi | skill | URL: TBD (GrokBestFriend snapshot) | MIT | duplikat-OCH | **T1** | port-OC | — |
| gh-axi | skill | URL: TBD (GrokBestFriend snapshot) | MIT | duplikat-OCH | **T1** | port-OC | — |
| adhd | skill | URL: TBD (vendored OCH; tanpa URL/SHA) | MIT | duplikat-OCH | **T1** | port-OC | — |
| demo-video | manual command | URL: TBD (first-party OCH) | MIT | duplikat-OCH | **T1** | port-OC | — |
| id-demo-video | skill | URL: TBD (first-party OCH) | MIT | duplikat-OCH | **T1** | port-OC | — |
| serena | MCP | github.com/oraios/serena serena-agent v1.7.0 | — (cek) | on-demand · duplikat-OCH | **T2** | mcp-OC | Retrieval+editing kode semantik; enabled:false |
| mobile-mcp | MCP | github.com/mobile-next/mobile-mcp; pin: TBD | Apache-2.0 | on-demand (gap #9) | **T2** | mcp-OC | QA iOS+Android |
| stitch | MCP | stitch.googleapis.com/mcp | — | on-demand · duplikat-OCH | **T2** | mcp-OC | enabled:false |
| ui-skills | MCP | www.ui-skills.com/mcp | — | on-demand · duplikat-OCH | **T2** | mcp-OC | enabled:false |
| reticle | MCP | URL: TBD; `@reticlehq/server` v3.5.0 | FSL-1.1-ALv2 ⚠️ | eksternal saja (non-OSI) | **T2** | endpoint | Jangan vendor; pakai sbg endpoint |
| swarmvault | skill | davila7/claude-code-templates `development/`; pin: TBD | MIT | opsional | **T3** | port-OC | Arsip; vault local-first |

---

## §3 — SEKTOR: Reverse Engineering (WAJIB)

> **Deadlock RE diperbaiki:** `reverse-skill` = **router utama RE**; `hypeking` = **sub-modul** di bawahnya. **Dynamic MCP Spawning (lazy-load):** intent RE auto-nyalakan `ghidra`/`jshook` di profil **`re-analysis`** (aman, on-demand) — **PISAH** dari profil `offensive-c2` (lihat §4).

| Nama | Tipe | Sumber (URL + pin) | Lisensi | Status | TIER | Port OC | Catatan |
|---|---|---|---|---|---|---|---|
| reverse-skill | skill (router) | github.com/zhaoxuya520/reverse-skill; pin: TBD | MIT | **pemenang — ROUTER UTAMA RE** | **T1** | port-OC | Entry-point RE: klasifikasi → bootstrap toolchain → spawn MCP |
| hypeking | skill (sub-modul) | github.com/kuker24/cli-pentestv1 `fda8e627f43897884c6c9802619fe839fa149391` | MIT | WAJIB-ADA (**di bawah reverse-skill**) | **T1** | port-OC | Router `route.py` milik user; jadi sub-modul reverse-skill |
| rea | skill | github.com/morluto/rea; pin: TBD | MIT | WAJIB-ADA · duplikat-OCH | **T1** | port-OC | RE perilaku app → native binary |
| universal-modder | skill + MCP | github.com/rehan-remade/universal-modder; pin: TBD | MIT | WAJIB-ADA | **T1** | port-OC | Recon, RE, aset generatif, uji in-game |
| ghidra | MCP | cli-pentestv1 `fda8e627…` (http://127.0.0.1:8765/mcp) | MIT (bundle); Ghidra Apache-2.0 | profil **`re-analysis`** (lazy-load) | **T2** | mcp-OC | Auto-spawn saat intent RE; aman, tanpa `--pentest` |
| jshook | MCP | cli-pentestv1 `fda8e627…`; npm `@jshookmcp/jshook@0.3.4` | MIT | profil **`re-analysis`** (lazy-load) | **T2** | mcp-OC | Auto-spawn saat intent RE |
| idapro | MCP | cli-pentestv1 `fda8e627…` (http://127.0.0.1:13337/mcp) | MIT (bundle); IDA proprietary | profil **`re-analysis`** (lazy-load) | **T2** | mcp-OC | Perlu lisensi IDA |
| autogki-patcher | pointer | github.com/femmynuppu/autogki-patcher; pin: TBD | — (tidak ada) ⚠️ | referensi-saja (RISIKO TINGGI) | **T3** | endpoint | Arsip; tanpa README/lisensi. Alt permisif: mkbootimg/avbtool (Apache-2.0); Magisk binary eksternal |

---

## §4 — SEKTOR: Keamanan / Pentest / C2

> **Profil `offensive-c2` WAJIB flag `--pentest` + file consent/scope** sebelum aktif (lihat NFR OTORISASI di PRD). Item GPL/AGPL/NOASSERTION ⚠️ = pointer/MCP/binary eksternal, bukan vendored.

| Nama | Tipe | Sumber (URL + pin) | Lisensi | Status | TIER | Port OC | Catatan |
|---|---|---|---|---|---|---|---|
| cli-pentestv1 (bundle) | bundle (skills+MCP) | github.com/kuker24/cli-pentestv1 `fda8e627f43897884c6c9802619fe839fa149391` | MIT | WAJIB-ADA (milik user) | **T1** | port-OC | Sumber hypeking + MCP RE/C2 |
| full-audit-keamanan | skill | URL: TBD (OCH GrokBestFriend 1.3.1 snapshot) | MIT | duplikat-OCH | **T1** | port-OC | Audit keamanan |
| strix | pointer/harness | github.com/usestrix/strix; pin: TBD | Apache-2.0 | WAJIB-ADA | **T2** | endpoint | Pentest AI matang, permisif; profil `offensive-c2` |
| PentAGI | MCP/pointer | github.com/vxcontrol/pentagi; pin: TBD | MIT | WAJIB-ADA (blueprint) | **T2** | endpoint | Profil `offensive-c2` + `--pentest` + consent |
| caldera | pointer | github.com/apache/caldera; pin: TBD | Apache-2.0 | WAJIB-ADA | **T2** | endpoint | Emulasi adversary |
| deepteam | pointer/framework | github.com/confident-ai/deepteam; pin: TBD | Apache-2.0 | red-team CI/offline | **T2** | CLI | Red-team LLM SuperQ sendiri (bukan runtime) |
| sliver | MCP + pointer | github.com/BishopFox/sliver; juga cli-pentestv1 `fda8e627…` | GPL-3.0 ⚠️ | profil `offensive-c2` (eksternal) | **T2** | endpoint | C2; binary/layanan eksternal + `--pentest` + consent |
| AdaptixC2 | pointer | github.com/Adaptix-Framework/AdaptixC2; pin: TBD | GPL-3.0 ⚠️ | profil `offensive-c2` (eksternal) | **T2** | endpoint | Alt permisif native: Mythic (BSD-3) |
| bunkerweb | pointer | github.com/bunkerity/bunkerweb; pin: TBD | AGPL-3.0 ⚠️ | WAF on-demand (eksternal) | **T2** | endpoint | Alt permisif: OWASP Coraza (Apache-2.0) |
| Fieldwatch | pointer | github.com/OffGridPete/Fieldwatch; pin: TBD | MIT | on-demand | **T2** | endpoint | Observer receive-only Android (Wi-Fi/BLE OSINT) |
| Mythic | pointer | github.com/its-a-feature/Mythic; pin: TBD | BSD-3-Clause | alternatif permisif C2 (native) | **T2** | endpoint | Pengganti permisif sliver/AdaptixC2 |
| Decepticon | pointer | github.com/BitterSecurity/Decepticon; pin: TBD | Apache-2.0 | alternatif permisif (pengganti CyberStrike) | **T2** | endpoint | Red-team otonom |
| ARTEX | pointer | github.com/Hinln/ARTEX; pin: TBD | AGPL-3.0 ⚠️ | alternatif-digantikan (→ PentAGI) | **T3** | endpoint | Arsip |
| CyberStrike | pointer/harness | github.com/CyberStrikeus/CyberStrike; pin: TBD | AGPL-3.0 ⚠️ | alternatif-digantikan (→ Decepticon) | **T3** | endpoint | Arsip |

---

## §5 — SEKTOR: OSINT / Geospatial

| Nama | Tipe | Sumber (URL + pin) | Lisensi | Status | TIER | Port OC | Catatan |
|---|---|---|---|---|---|---|---|
| geo-sleuth | skill | github.com/Oldcircle/geo-sleuth; pin: TBD | MIT | WAJIB-ADA | **T1** | port-OC | Geolokasi foto (OSM/elevasi/satelit/street view) |
| leafmap | library/pointer | github.com/opengeos/leafmap; pin: TBD | MIT | alternatif permisif (pengganti gods-eye-view) | **T1** | port-OC | Spatial intelligence interaktif |
| TorchGeo | library/pointer | github.com/torchgeo/torchgeo; pin: TBD | MIT | opsional (ML citra satelit) | **T2** | endpoint | — |
| gods-eye-view | pointer/app | github.com/bilawalsidhu/gods-eye-view; pin: TBD | NOASSERTION ⚠️ | digantikan leafmap (RISIKO lisensi) | **T3** | endpoint | Arsip; cek LICENSE manual |

---

## §6 — SEKTOR: Desain / Motion / Media

> **Fix kontradiksi Motion:** pemenang Remotion lama `remotion-dev/skills` **tanpa LICENSE → DIGANTI** `claude-remotion-skill` (MIT). `klik-anim` (tanpa lisensi) → **T3** sampai ditulis ulang. **Konsolidasi Motion ~32 → 4 skill inti aktif:** `claude-motion-design`, `claude-remotion-skill` (Remotion MIT), `gsap-skills`, `manim`. Alt engine permisif: Revideo (MIT).

| Nama | Tipe | Sumber (URL + pin) | Lisensi | Status | TIER | Port OC | Catatan |
|---|---|---|---|---|---|---|---|
| claude-motion-design | skill | github.com/howseen-ai/claude-motion-design; pin: TBD | MIT | **pemenang** motion murni-kode | **T1** | port-OC | HTML+Playwright+ffmpeg; 1 dari 4 inti |
| claude-remotion-skill | skill | github.com/haidrrrry/claude-remotion-skill; pin: TBD | MIT | **pemenang Remotion (BARU)** | **T1** | port-OC | Menggantikan remotion-dev/skills (tanpa LICENSE); 1 dari 4 inti |
| gsap-skills | skill | github.com/greensock/gsap-skills; pin: TBD | MIT | WAJIB-ADA (1 dari 4 inti) | **T1** | port-OC | Resmi GSAP |
| manim | skill | davila7/claude-code-templates `skills/video/`; pin: TBD | MIT (cek upstream Manim) | WAJIB-ADA (1 dari 4 inti) | **T1** | port-OC | Animasi matematis |
| hyperframes | skill | github.com/heygen-com/hyperframes `6037d228441e23e50cd6713a464d6158941cfcae` / v0.8.122 | Apache-2.0 | WAJIB-ADA · duplikat-OCH | **T1** | port-OC | HTML→video |
| diagram-design | skill | github.com/cathrynlavery/diagram-design `f903933a534b` | MIT | WAJIB-ADA · duplikat-OCH | **T1** | port-OC | 44 tipe diagram HTML+SVG |
| deck-design | skill | github.com/carnot-tech/consulting-pptx-skill `f50edac656d34636f026afec9e6dbb3697f4c6d4` | MIT | duplikat-OCH | **T1** | port-OC | Slide/pptx |
| json-render | skill | github.com/vercel-labs/json-render `c2600d73908ed505e6d726f5b6f969ba8f597ce7` | Apache-2.0 | duplikat-OCH | **T1** | port-OC | Render data-driven |
| emil-design-eng | skill | URL: TBD (OCH snapshot); pin `e8a175de22ae1e49370fc144c1f3bb9aeedf988d` | MIT | duplikat-OCH | **T1** | port-OC | — |
| remotion | engine/pointer | github.com/remotion-dev/remotion; pin: TBD | NOASSERTION (khusus, non-OSI) ⚠️ | pointer (review komersial) | **T2** | endpoint | Berbayar korporat; alt: Revideo (MIT) |
| motion (library) | library/pointer | github.com/motiondivision/motion; pin: TBD | MIT | pointer pendukung | **T2** | endpoint | Library animasi React/JS |
| Revideo | engine/pointer | github.com/midrender/revideo; pin: TBD | MIT | alternatif permisif Remotion | **T2** | endpoint | Render video-as-code TS |
| elevenlabs | MCP | davila7/claude-code-templates `mcps/audio/`; pin: TBD | resmi ElevenLabs | on-demand | **T2** | mcp-OC | TTS/voice/SFX; enabled:false |
| remotion-dev/skills | skill | github.com/remotion-dev/skills; pin: TBD | — (tidak ada) ⚠️ | **digantikan** claude-remotion-skill | **T3** | — | Arsip; tanpa LICENSE, jangan salin |
| klik-anim-skill-creation | skill | github.com/t3knobox/klik-anim-skill-creation; pin: TBD | — (tidak ada) ⚠️ | **digantikan** (tulis ulang MIT) | **T3** | — | Arsip sampai ditulis ulang; prinsip animasi = publik |
| motion-graphics-skills | skill (13) | github.com/charlie947/motion-graphics-skills; pin: TBD | MIT | konsolidasi → arsip | **T3** | port-OC | Arsip (dilebur ke 4 inti) |
| hyperframes-motion-reel-skill | skill | github.com/Sunwood-ai-labs/hyperframes-motion-reel-skill; pin: TBD | MIT | konsolidasi → arsip | **T3** | port-OC | Arsip |
| product-launch-motion | skill | github.com/AbubakrChan/product-launch-motion; pin: TBD | MIT | alternatif-digantikan | **T3** | port-OC | Arsip |
| claude-motion | skill | github.com/whaleyxbt/claude-motion; pin: TBD | MIT | alternatif-digantikan | **T3** | port-OC | Arsip |
| motion-canvas | skill | davila7/claude-code-templates `skills/video/`; pin: TBD | MIT | konsolidasi → arsip | **T3** | port-OC | Arsip; alt engine |
| animata | komponen | github.com/codse/animata; pin: TBD | MIT | opsional | **T3** | port-OC | Arsip |
| lottie-web | library/pointer | github.com/airbnb/lottie-web; pin: TBD | MIT | opsional | **T3** | endpoint | Arsip |
| awesome-motion-design-agent-skills | kurasi | github.com/frankxai/awesome-motion-design-agent-skills; pin: TBD | CC0-1.0 | opsional (peta kurasi) | **T3** | — | Arsip |
| business-motion-film | skill | github.com/echris6/motion-video-kit `255562b04b1e5ecaa4ba98e5c9aa191d5ba7f6fa` | MIT | duplikat-OCH | **T3** | port-OC | Arsip |
| scroll-craft | skill | github.com/nateherkai/scroll-craft `75d81f74e83692add18cd7a8a8e078b8a887a579` | MIT | duplikat-OCH | **T3** | port-OC | Arsip |
| scroll-world | skill | github.com/oso95/scroll-world `71cc36d3bb150248ae36a2c552f9cbf88802a79c` | MIT | duplikat-OCH | **T3** | port-OC | Arsip |
| found-this-design | skill | URL: TBD (OCH snapshot) | MIT | duplikat-OCH | **T3** | port-OC | Arsip |
| visual-studio | skill | URL: TBD (OCH snapshot) | MIT | duplikat-OCH | **T3** | port-OC | Arsip |
| excalidraw / draw-io / mermaid-diagrams / c4-architecture / marp-slide | skill (5) | davila7/claude-code-templates `creative-design/`; pin: TBD | MIT | opsional (jika tak tercakup diagram/deck) | **T3** | port-OC | Arsip |

---

## §7 — SEKTOR: Data / Dokumen / CAD / Otomasi

| Nama | Tipe | Sumber (URL + pin) | Lisensi | Status | TIER | Port OC | Catatan |
|---|---|---|---|---|---|---|---|
| markitdown (skill) | skill | github.com/microsoft/markitdown `b8f79c57ebc0044be41323d89b2a45d3fda8460e` / v0.1.8 | MIT | WAJIB-ADA · duplikat-OCH | **T1** | port-OC | PDF/Office/gambar → Markdown |
| docx-official | skill | davila7/claude-code-templates `document-processing/`; pin: TBD | Anthropic-attribution ⚠️ | WAJIB-ADA | **T1** | port-OC | Cek ANTHROPIC_ATTRIBUTION |
| pptx-official | skill | davila7/claude-code-templates `document-processing/`; pin: TBD | Anthropic-attribution ⚠️ | WAJIB-ADA | **T1** | port-OC | — |
| xlsx-official | skill | davila7/claude-code-templates `document-processing/`; pin: TBD | Anthropic-attribution ⚠️ | WAJIB-ADA | **T1** | port-OC | — |
| pdf-official | skill | davila7/claude-code-templates `document-processing/`; pin: TBD | Anthropic-attribution ⚠️ | WAJIB-ADA | **T1** | port-OC | — |
| text-to-cad | skill | github.com/earthtojake/text-to-cad; pin: TBD | MIT | WAJIB-ADA | **T1** | port-OC | Teks → CAD |
| n8n / n8n-workflow-patterns | skill | davila7/claude-code-templates; pin: TBD | MIT | WAJIB-ADA | **T1** | port-OC | Pendamping n8n-mcp |
| pageindex | skill | github.com/VectifyAI/PageIndex `6d23caf416858f2ca136840305d1f479a86f6ef7` / v0.2.21 | MIT | duplikat-OCH | **T1** | port-OC | Index dokumen panjang |
| smartdoc | skill | URL: TBD (first-party OCH) | MIT | duplikat-OCH | **T1** | port-OC | — |
| smartbook-ingest | skill | URL: TBD (first-party OCH) | MIT | duplikat-OCH | **T1** | port-OC | — |
| markitdown (MCP) | MCP | github.com/microsoft/markitdown markitdown-mcp v0.1.8 `b8f79c57…` | MIT | on-demand · duplikat-OCH | **T2** | mcp-OC | enabled:false |
| n8n-mcp | MCP | davila7/claude-code-templates `mcps/integration/`; pin: TBD | MIT | on-demand | **T2** | mcp-OC | enabled:false |
| Postgres MCP Pro | MCP | github.com/crystaldba/postgres-mcp; pin: TBD | MIT | on-demand (gap #8) | **T2** | mcp-OC | Tugas DB/SQL |
| memory-integration | MCP | davila7/claude-code-templates `mcps/integration/`; pin: TBD | MIT | opsional | **T3** | mcp-OC | Arsip |

---

## §8 — SEKTOR: Riset

| Nama | Tipe | Sumber (URL + pin) | Lisensi | Status | TIER | Port OC | Catatan |
|---|---|---|---|---|---|---|---|
| deep-research | skill | davila7/claude-code-templates `skills/ai-research/`; pin: TBD | cek (MIT) | **pemenang** | **T1** | port-OC | Alur riset mendalam |
| deep-research-team | agent team | davila7/claude-code-templates; pin: TBD | MIT (cek) | WAJIB-ADA | **T1** | port-OC | Pipeline hierarki delegasi riset |
| nia-oracle | agent | davila7/claude-code-templates; pin: TBD | cek | WAJIB-ADA | **T1** | port-OC | Agen pasangan nia |
| arxiv-mcp-server | MCP | davila7/claude-code-templates `mcps/research/`; pin: TBD | MIT (cek) | on-demand | **T2** | mcp-OC | enabled:false |
| mcp-server-nia | MCP | davila7/claude-code-templates `mcps/deepresearch/`; pin: TBD | cek | on-demand | **T2** | mcp-OC | enabled:false |
| searxng | MCP | davila7/claude-code-templates `mcps/web/`; pin: TBD | cek | on-demand | **T2** | mcp-OC | Metasearch privat self-host |
| jina-ai | MCP | davila7/claude-code-templates `mcps/devtools/`; pin: TBD | cek | on-demand | **T2** | mcp-OC | — |
| crawl4ai | MCP | github.com/unclecode/crawl4ai v0.9.4 `133e1d92e37885dfccc03ea2e3687d06c98b7ceb` | — (cek) | on-demand · duplikat-OCH | **T2** | mcp-OC | endpoint lokal |
| scrapling | MCP | github.com/D4Vinci/Scrapling v0.4.15 `333fa22b7a5821194ce66b59b11f4b16a6484f02` | BSD-3-Clause | on-demand · duplikat-OCH | **T2** | mcp-OC | — |
| exa | MCP | mcp.exa.ai/mcp | — | on-demand · duplikat-OCH | **T2** | mcp-OC | enabled:false |
| deep-research-notebooklm | skill | davila7/claude-code-templates `skills/ai-research/`; pin: TBD | cek | alternatif-digantikan | **T3** | port-OC | Arsip |
| perplexity | skill | davila7/claude-code-templates `skills/ai-research/`; pin: TBD | cek | alternatif-digantikan | **T3** | port-OC | Arsip |

> Catatan: `research` (mattpocock) tercatat di §2 (engineering), juga melayani riset ringan.

---

## §9 — SEKTOR: Penulisan / Produktivitas

| Nama | Tipe | Sumber (URL + pin) | Lisensi | Status | TIER | Port OC | Catatan |
|---|---|---|---|---|---|---|---|
| humanizer | skill | github.com/blader/humanizer `225a6f39ac85` | MIT | **pemenang** · WAJIB-ADA | **T1** | port-OC | Versi OCH pinned |
| install-anti-slop | skill | github.com/dmmulroy/anti-slop `c44ef22ca116d0ba62a3ff663a0bd13a3f3fa40b` / v0.1.2 | MIT | WAJIB-ADA · duplikat-OCH | **T1** | port-OC | Anti-slop |
| technical-writing | manual command | github.com/cursor/plugins `e43c7ee2…` | MIT | duplikat-OCH | **T1** | port-OC | pstack |
| unslop | manual command | github.com/cursor/plugins `e43c7ee2…` | MIT | duplikat-OCH | **T1** | port-OC | pstack |
| penulis-ilmiah (skill) | skill | URL: TBD (first-party OCH) | MIT | duplikat-OCH | **T1** | port-OC | — |
| academic | skill | URL: TBD (first-party OCH) | MIT | duplikat-OCH | **T1** | port-OC | — |
| antislop-sampler | library/pointer | github.com/sam-paech/antislop-sampler; pin: TBD | Apache-2.0 | alternatif etis Turnitout (de-slop) | **T1** | endpoint | Tekan frasa klise LLM saat generasi |
| penulis-ilmiah (MCP) | MCP | URL: TBD (first-party OCH); npm penulis-ilmiah-mcp v0.1.0 | — | on-demand | **T2** | mcp-OC | enabled:false |
| avoid-ai-writing | skill | davila7/claude-code-templates; pin: TBD | MIT | alternatif-digantikan | **T3** | port-OC | Arsip |
| skill-judge / skill-creator / writing-skills | skill (3) | davila7/claude-code-templates; pin: TBD | MIT | opsional (kurasi) | **T3** | port-OC | Arsip |
| Turnitout-Humanizer | pointer | github.com/AhmadHassan-BTed/Turnitout-Humanizer; pin: TBD | NOASSERTION ⚠️ | digantikan antislop-sampler (RISIKO etika) | **T3** | endpoint | Arsip; evasi deteksi akademik — isu etika/lisensi |

---

## §10 — SEKTOR: Karier

| Nama | Tipe | Sumber (URL + pin) | Lisensi | Status | TIER | Port OC | Catatan |
|---|---|---|---|---|---|---|---|
| ai-job-search | framework/skill | github.com/MadsLorentzen/ai-job-search; pin: TBD | MIT | WAJIB-ADA | **T1** | port-OC | Evaluasi lowongan→CV→cover letter→prep interview |

---

## §11 — SEKTOR: DevOps / Infra / Finance

| Nama | Tipe | Sumber (URL + pin) | Lisensi | Status | TIER | Port OC | Catatan |
|---|---|---|---|---|---|---|---|
| full-performance-audit | skill | URL: TBD (OCH snapshot) | MIT | duplikat-OCH (audit lintas-sektor) | **T1** | port-OC | — |
| github-mcp-server | MCP | github.com/github/github-mcp-server; pin: TBD | MIT (resmi GitHub) | on-demand (gap #6) | **T2** | mcp-OC | Tugas repo/CI |
| kubernetes-mcp-server | MCP | github.com/containers/kubernetes-mcp-server; pin: TBD | Apache-2.0 (Red Hat) | on-demand (gap #7) | **T2** | mcp-OC | Ops cluster |
| OpenBB | platform (+MCP) | github.com/OpenBB-finance/OpenBB; pin: TBD | Apache-2.0 | on-demand (gap #10) | **T2** | endpoint | Data finansial pasar/fundamental |

---

## §12 — DAFTAR KEPUTUSAN "MIRIP → PEMENANG" (v1.1)

| Kelompok mirip | Pemenang (v1.1) | Yang kalah / arsip (T3) | Alasan |
|---|---|---|---|
| Fan-out paralel | **dispatching-parallel-agents** | parallel-agents & subagent-driven-development *disimpan T1* (peran beda) | dispatching=tugas lepas; parallel=domain; subagent-driven=sekuensial+review |
| Loop kontrol-mutu | **Unified Done-Gate** (melebur builder-reviewer + completion-contract) | adversarial-review-loop, devils-advocate-loop, quality-streak-loop, anti-spin-build-loop | Gate deterministik `exit==0?/artefak?/test hijau?` + anti-spin hardcoded |
| Router model | **ninerouter + LiteLLM** (2 tingkat) | jev-model-router **(dibuang)** | ninerouter pilih tier; LiteLLM gateway eksekusi+fallback built-in |
| Motion murni-kode | **claude-motion-design** | claude-motion, product-launch-motion | Pipeline HTML+Playwright+ffmpeg paling lengkap & MIT |
| Skill Remotion | **claude-remotion-skill (MIT)** | remotion-dev/skills (tanpa LICENSE), klik-anim (tanpa lisensi) | Fix kontradiksi: pemenang lama tanpa LICENSE |
| Motion (konsolidasi) | **4 inti: claude-motion-design, claude-remotion-skill, gsap-skills, manim** | ~28 skill motion lain → arsip | Ramping ~32→4 |
| Humanizer/anti-slop | **humanizer + install-anti-slop** | avoid-ai-writing; Turnitout (etika) → antislop-sampler | Versi OCH pinned + alternatif etis |
| Riset mendalam | **deep-research** | deep-research-notebooklm, perplexity | Alur umum |
| Router RE | **reverse-skill** (hypeking = sub-modul) | — | Fix deadlock RE |
| OSINT geospatial | **geo-sleuth + leafmap (MIT)** | gods-eye-view (NOASSERTION) | Lisensi bersih |
| C2 (permisif) | **Mythic (BSD-3), Decepticon (Apache-2.0)** | sliver/AdaptixC2 (GPL, eksternal), ARTEX/CyberStrike (AGPL, arsip) | Alt permisif native |
| WAF | **OWASP Coraza (Apache-2.0)** | bunkerweb (AGPL, eksternal T2) | Embeddable tanpa kontaminasi |
| markitdown skill vs MCP | **keduanya** (skill T1 core, MCP T2 on-demand) | — | Peran beda |

**Duplikat OCH (pakai versi OCH, jangan dobel):** rea, diagram-design, hyperframes. `[FAKTA]`

---

## §13 — STATUS MCP & PROFIL (v1.1)

- **core-active (enabled:true):** codebase-memory-mcp, context7, shadcn + **LiteLLM** (gateway, core-active WAJIB — kontradiksi diperbaiki). `[FAKTA core-3 + PENILAIAN LiteLLM]`
- **on-demand (enabled:false, lazy-load):** serena, markitdown(MCP), exa, crawl4ai, scrapling, searxng, jina-ai, arxiv-mcp-server, mcp-server-nia, n8n-mcp, elevenlabs, Postgres MCP Pro, github-mcp-server, kubernetes-mcp-server, OpenBB, mobile-mcp, stitch, ui-skills, Opik, E2B, Guardrails(eksternal), reticle(FSL eksternal), memory-integration.
- **profil `re-analysis` (lazy-load, aman — auto on intent RE):** ghidra, jshook, idapro.
- **profil `offensive-c2` (WAJIB `--pentest` + consent/scope):** sliver, AdaptixC2, PentAGI, strix, caldera, Mythic, Decepticon, bunkerweb.

---

## §14 — RINGKASAN HITUNGAN TIER (v1.1)

> `[PENILAIAN/target]` — angka ~65 Tier 1 adalah target desain; aktual dihitung dari tabel di atas (bundle mattpocock/ECC/pstack dihitung sebagai 1 baris agregat masing-masing).

Hitungan otomatis disisipkan di bawah (lihat §14.1).

### §14.1 Tally
| TIER | Baris katalog | Keterangan |
|---|---|---|
| **T1 — Active Production** | **74** | Target desain ~65 `[PENILAIAN/target]`; 74 baris aktif (3 baris agregat bundle — mattpocock ~13, ECC 9, pstack 10 — jika diurai per-skill, Tier 1 ~101 skill individual). Semua lisensi permisif bersih (MIT/Apache/BSD) kecuali docx/pptx/xlsx/pdf-official (Anthropic-attribution ⚠️, dicek sebelum bundel). |
| **T2 — External On-Demand** | **42** | MCP/pointer/binary/endpoint lazy-load (fondasi on-demand Opik/E2B/promptfoo/Guardrails, DevOps/Finance/SQL/mobile MCP, item copyleft eksternal sliver/AdaptixC2/bunkerweb, profil `re-analysis` ghidra/jshook/idapro, profil `offensive-c2`). |
| **T3 — Archive** | **38** | `docs/archive-alternatives.md`: semua `alternatif-digantikan` + konsolidasi Motion (~24) + risiko tinggi/tanpa-lisensi (autogki-patcher, klik-anim, remotion-dev/skills, Turnitout-Humanizer, gods-eye-view, loki-mode, ARTEX, CyberStrike) + jev-model-router (dibuang). |
| **TOTAL** | **154** | Tidak ada komponen di-skip; hanya beda TIER. |


### §14.2 Catatan
- Fondasi runtime: **LiteLLM = T1 core-active** (wajib); Opik/E2B/promptfoo/Guardrails = **T2 on-demand** (default digantikan alternatif lokal ringan: trace JSONL/Phoenix-lokal, bwrap/Docker, schema/Pydantic).
- Tidak ada komponen dibuang: T3 = arsip aktif-kembali di `docs/archive-alternatives.md`.
- Sisa `URL: TBD` & `pin: TBD` tidak diubah; dicatat apa adanya.

---

## §P — CATATAN PORTABILITAS OpenCode

Lihat bab khusus di `SuperQ-PRD-v1.1.md` (§15 "Catatan Portabilitas OpenCode"). Ringkas:
- **TARGET = OpenCode.** Konfigurasi via `opencode.json` (mcp block, agent/subagent, routing). Skill dipasang di folder skill OpenCode.
- Komponen asal ekosistem Claude (davila7/aitmpl, mattpocock, pstack, ECC) **ditandai `port-OC`**: SKILL.md/format frontmatter, hook, dan slash-command perlu di-port ke konvensi OpenCode (bukan `.claude/`).
- MCP (`mcp-OC`) dipasang di mcp block `opencode.json`; endpoint/binary eksternal (`endpoint`) dipanggil via CLI/REST/MCP tanpa vendor-in.
