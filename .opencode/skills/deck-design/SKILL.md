---
name: Deck Design
description: Designs a consulting-style slide deck from claims before any pptx file is written.
---

# Deck Design

Source: https://github.com/carnot-tech/consulting-pptx-skill
Pin: f50edac656d34636f026afec9e6dbb3697f4c6d4
Commit-Date: 2026-09-18
License: MIT. Local summary, not a vendored copy.

## Tujuan

Mengunci klaim tiap slide sebelum file pptx dibuat.

## Kapan dipakai

Pakai saat deck masih berupa argumen. Setelah outline dikunci, pptx-official boleh membuat file.

## Langkah

1. Satu slide, satu klaim.
2. Judul adalah kalimat klaim.
3. Bukti di slide harus sudah ada di catatan, bukan diasumsikan.
4. Jangan menulis byte pptx di langkah ini.
5. Serahkan outline ke data-doc-cad hanya jika file diminta.

## Input / output

Input: audiens dan klaim. Output: outline slide, belum tentu file pptx.

## Batasan

Bukan salinan template upstream.
