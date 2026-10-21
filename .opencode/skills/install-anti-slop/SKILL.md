---
name: Anti-Slop
description: Strips buzzwords and empty intensifiers from draft text while preserving technical meaning.
---

# Anti-Slop

Source: https://github.com/dmmulroy/anti-slop
Pin: c44ef22ca116d0ba62a3ff663a0bd13a3f3fa40b
Commit-Date: 2026-09-10
License: Pointer to dmmulroy/anti-slop. Local summary, not a vendored copy.

## Tujuan

Menghapus kata yang tidak mengubah klaim, sambil mempertahankan peringatan teknis.

## Kapan dipakai

Pakai setelah draf ada. Jangan pakai untuk melembutkan risiko yang memang harus keras.

## Langkah

1. Hapus kata yang tidak mengubah klaim: leverage, seamless, robust, cutting-edge, delve.
2. Ganti nomina samar dengan benda yang dimaksud.
3. Pertahankan peringatan dan kendala.
4. Baca keras. Kalimat yang tetap tidak berkata apa-apa dipotong.
5. Jangan vendor repo upstream.

## Input / output

Input: draf. Output: teks yang lebih pendek dengan makna teknis yang sama.

## Batasan

Kejelasan bukan pelunakan risiko.
