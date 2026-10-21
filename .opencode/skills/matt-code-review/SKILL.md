---
name: Matt Code Review
description: Reviews a diff for correctness, type safety, and regressions without rewriting the change.
---

# Matt Code Review

Source: https://github.com/mattpocock/skills
Pin: d81f3a183412e71a5b1e84ca21bc1a35eea03a60
Commit-Date: 2026-09-29
License: MIT (mattpocock/skills). Local summary, not a vendored copy.

## Tujuan

Menilai diff yang ada untuk kebenaran, tipe, dan regresi, tanpa menulis ulang perubahan.

## Kapan dipakai

Pakai pada diff yang sudah ada. Jangan pakai untuk merapikan file yang tidak berubah.

## Langkah

1. Review diff yang ada. Jangan restyle file yang tidak terkait.
2. Cek tipe, jalur error, dan tes yang seharusnya ikut berubah.
3. Urutkan temuan menurut keparahan. Kutip file dan baris.
4. Bedakan bug dari selera.
5. Jangan menyetujui perubahan yang hanya menyembunyikan gejala.

## Input / output

Input: diff. Output: temuan berurutan, atau persetujuan yang menyebut tes yang dijalankan.

## Batasan

Bukan rewrite. Bukan daftar gaya tanpa dampak perilaku.
