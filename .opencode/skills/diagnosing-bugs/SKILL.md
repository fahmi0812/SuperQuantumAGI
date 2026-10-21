---
name: Diagnosing Bugs
description: Investigates a defect to a root cause before any patch is applied.
---

# Diagnosing Bugs

Source: https://github.com/mattpocock/skills
Pin: d81f3a183412e71a5b1e84ca21bc1a35eea03a60
Commit-Date: 2026-09-29
License: MIT (mattpocock/skills). Local summary, not a vendored copy.

## Tujuan

Menemukan penulisan yang menghasilkan nilai buruk, bukan hanya baris yang meledak.

## Kapan dipakai

Pakai sebelum patch apa pun. Jangan pakai untuk menambah fitur yang belum gagal.

## Langkah

1. Reproduksi kegagalan dengan perintah atau tes terkecil.
2. Telusuri nilai buruk ke penulisan yang membuatnya.
3. Nyatakan apakah perubahan memperbaiki sebab atau hanya gejala.
4. Cari pola yang sama di modul lain. Jika ada, berhenti dan minta consent sebelum melebar.
5. Tes lokal hijau belum selesai sampai artefak done-gate ada.

## Input / output

Input: gejala dan cara reproduksi. Output: penyebab, file yang menulis nilai buruk, dan keputusan gejala vs sebab.

## Batasan

Jangan menyembunyikan gejala dengan menelan error. Jangan memperlebar patch diam-diam.
