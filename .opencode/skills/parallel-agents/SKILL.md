---
name: Parallel Agents
description: Coordinates domain specialists in parallel when a task crosses more than one sector.
---

# Parallel Agents

Source: https://github.com/davila7/claude-code-templates
Pin: e7d17f93bb90d4f351733f06716fe92fdb25de28
Commit-Date: 2026-10-21
License: MIT. Local summary. Not a vendored copy.

## Tujuan

Mengumpulkan jawaban dari sektor yang benar-benar relevan, tanpa mengundang semua sektor.

## Kapan dipakai

Pakai saat satu pertanyaan butuh bukti dari lebih dari satu domain. Jangan pakai untuk tugas satu file.

## Langkah

1. Sebut sektor yang harus bicara dan bukti yang wajib kembali.
2. Tiap sektor menulis hanya ke progress file-nya.
3. Pertanyaan bersama tetap sama; jangan mengubah scope di tengah jalan.
4. Jika dua sektor bertentangan, simpan kedua klaim beserta buktinya.
5. Synthesizer menggabungkan. Jangan merata-ratakan klaim yang bertentangan.

## Input / output

Input: pertanyaan bersama dan daftar sektor. Output: progress file dan catatan kontradiksi.

## Batasan

Bukan fan-out untuk chore yang tidak terkait. Kedalaman subagent tetap satu.
