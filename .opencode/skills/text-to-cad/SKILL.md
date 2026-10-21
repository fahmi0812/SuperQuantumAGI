---
name: Text-to-CAD
description: Turns a dimensioned text brief into a parametric CAD plan and a named output format.
---

# Text-to-CAD

Source: https://github.com/earthtojake/text-to-cad
Pin: 2f793659fb7bab537e2f00836e06448fc4087cb2
Commit-Date: 2026-10-20
License: MIT. Local summary, not a vendored copy.

## Tujuan

Mengubah brief berdimensi menjadi rencana parametrik dan satu format output.

## Kapan dipakai

Pakai saat satuan dan dimensi ada. Jika satuan hilang, tanya. Jangan mengasumsikan.

## Langkah

1. Ekstrak satuan, dimensi, dan toleransi.
2. Pilih satu output: STEP, STL, atau skrip, lalu namai.
3. Pertahankan nama parameter agar edit berikutnya tidak menggambar ulang.
4. Jangan vendor alat upstream.
5. Catat satuan di progress file.

## Input / output

Input: brief berdimensi. Output: rencana parametrik dan path artefak.

## Batasan

Satuan yang hilang bukan izin menebak milimeter.
