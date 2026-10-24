---
name: Matt Code Review
description: Reviews a diff for correctness, type safety, and regressions without rewriting the change.
---

# Matt Code Review

Source: https://github.com/mattpocock/skills
Pin: 5beb35b040e3de97e54fa9e386d7e42d15c295c2
Commit-Date: 2026-10-19
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
