---
name: Subagent Driven Development
description: Runs sector work in a reviewable sequence: implement, check, then synthesize.
---

# Subagent Driven Development

Source: https://github.com/davila7/claude-code-templates
Pin: e7d17f93bb90d4f351733f06716fe92fdb25de28
Commit-Date: 2026-10-21
License: MIT. Local summary of the sequential review workflow. Not a vendored copy.

## Tujuan

Menyelesaikan pekerjaan yang langkahnya bergantung pada hasil langkah sebelumnya, dengan cek di tiap langkah.

## Kapan dipakai

Pakai saat implementasi, tes, dan review harus berurutan. Jangan pakai untuk item yang benar-benar independen.

## Langkah

1. Satu subagent sektor per langkah. Kedalaman tetap satu.
2. Setiap langkah menyebut file yang boleh diubah dan tes yang membuktikan langkah itu.
3. Done-gate gagal berarti re-plan, bukan ditandai selesai.
4. Dua gagal berturut memanggil exception auditor. Tiga gagal menghentikan run.
5. Synthesize hanya setelah gate hijau atau halt eksplisit.

## Input / output

Input: urutan langkah dan tes tiap langkah. Output: diff yang lolos gate, atau alasan halt.

## Batasan

Jangan melewati tes yang gagal. Jangan memperlebar blast radius tanpa consent.
