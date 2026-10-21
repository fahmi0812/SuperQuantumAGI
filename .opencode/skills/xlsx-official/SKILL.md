---
name: Xlsx Official
description: Generates a spreadsheet with named sheets, headers, and formulas rather than hardcoded totals.
---

# Xlsx Official

Source: https://github.com/davila7/claude-code-templates
Pin: e7d17f93bb90d4f351733f06716fe92fdb25de28
Commit-Date: 2026-10-21
License: Pointer only. Upstream xlsx-official material is Anthropic-attribution. Do not vendor.

## Tujuan

Membuat spreadsheet yang bisa diaudit: sheet bernama, header, dan formula.

## Kapan dipakai

Pakai saat angka harus bisa dihitung ulang. Jangan hardcode total jika formula bisa menyatakannya.

## Langkah

1. Satu sheet, satu tujuan. Namai baris header.
2. Utamakan formula untuk total.
3. Jangan vendor sumber upstream sampai atribusi dikonfirmasi.
4. Data contoh harus jelas palsu.
5. Simpan file sebagai artefak.

## Input / output

Input: nama sheet, header, dan rumus. Output: path xlsx.

## Batasan

Bukan salinan skrip office upstream.
