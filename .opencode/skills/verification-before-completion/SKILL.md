---
name: verification-before-completion
description: Run verification and defer to the done-gate before claiming work is complete. Does not invent FACT rows.
---

# Verification Before Completion

Source: https://github.com/obra/superpowers
Pin: 2ce8aa15d05bd57213e6f746f953aafb7ded7a8b
License: MIT. Local adapter. Not a vendored copy.

## Tujuan

Tidak ada klaim selesai tanpa bukti segar. Gerbang yang dipakai adalah **unified-done-gate**, bukan daftar `FACT:` karangan skill ini.

## Kapan dipakai

Sebelum bilang selesai, commit, atau pindah task. Jangan pakai sebagai pengganti tes.

## Langkah

1. Identifikasi perintah yang membuktikan klaim.
2. Jalankan perintah itu sekarang. Baca exit code dan output.
3. Cocokkan ke done-gate: `exit_code === 0`, artefak non-kosong, tes hijau. Push/RELEASE mengikuti `.opencode/rules/01-verification.md`.
4. Perintah yang tidak dijalankan = `UNRUN`, bukan PASS. `NOT_CONFIGURED` hanya jika baris `FACT:` yang sudah ada menamakan gerbang itu.
5. Jangan menulis baris `FACT:` baru dari skill ini. Ledger `FACT:`/`JUDGMENT:` tetap lewat decision-log / post-push harness.

## Input / output

Input: klaim. Output: perintah + exit code, atau status belum selesai.

## Batasan

Tidak melemahkan tes. Anti-spin tetap 3. `subagent_depth=1`.
