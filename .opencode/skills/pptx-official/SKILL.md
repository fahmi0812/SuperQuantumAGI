---
name: Pptx Official
description: Builds a pptx from an approved outline. Upstream Anthropic document-processing text is not copied.
---

# Pptx Official

Source: https://github.com/davila7/claude-code-templates
Pin: e7d17f93bb90d4f351733f06716fe92fdb25de28
Commit-Date: 2026-10-21
License: Pointer only. Path document-processing/pptx-official exists at this commit. LICENSE is Anthropic, all rights reserved. Do not vendor.

## Tujuan

Menyusun deck dari outline yang sudah disetujui, tanpa menyalin prompt atau skrip upstream.

## Kapan dipakai

Pakai saat struktur slide sudah ada. Untuk desain slide konsultasi sebelum byte pptx, pakai deck-design.

## Langkah

1. Satu slide, satu klaim.
2. Judul menyatakan klaim, bukan label kategori.
3. Jangan menyalin pptxgenjs notes atau skrip upstream.
4. Tulis file sebagai artefak.
5. Jika operator belum boleh memakai materi Anthropic, tetap di outline dan jangan membundel skripnya.

## Input / output

Input: outline slide. Output: path pptx atau penolakan jika bundling upstream diminta.

## Batasan

Tidak ada vendor GPL/AGPL dan tidak ada salinan teks Anthropic.
