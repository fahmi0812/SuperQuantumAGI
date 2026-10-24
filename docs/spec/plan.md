# Plan: [NAMA FITUR]

**Cabang:** `[wave/…]` | **PRD/Tech:** [tautan]  
**Pin pola:** github/spec-kit `67e0f7294e6e728ab60bf7b4590deb470448bc2d`

## Goal

[Satu kalimat]

## Architecture

[2–3 kalimat. Hormati 11 sektor dan `subagent_depth=1`.]

## Global constraints

- 9router-only. Tidak ada model-mix.
- bwrap fail-closed. Single-writer.
- Tes yang dihapus assertion-nya bukan hijau.

## Review focus

- [mode gagal yang spek diamkan]
- [input yang harus ditolak]

## Task N: [komponen]

**Files:**

- Create: `path`
- Modify: `path`
- Test: `tests/suite.mjs` atau tes lokal

**Interfaces:** Consumes / Produces (nama dan tipe persis)

- [ ] Tulis tes yang gagal karena perilaku yang dimaksud
- [ ] Implementasi terkecil
- [ ] Jalankan perintah verifikasi; catat exit code
- [ ] Done-gate: exit 0 + artefak + tes hijau. Jangan mengarang baris `FACT:`

Satu task = satu siklus tes. Parallel hanya jika file tidak bentrok dan orchestrator yang men-spawn.
