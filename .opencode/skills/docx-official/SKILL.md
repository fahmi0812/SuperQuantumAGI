---
name: Docx Official
description: Generates a Word document from a structured outline. Attribution must be checked before any upstream copy.
---

# Docx Official

Source: https://github.com/davila7/claude-code-templates
Pin: e7d17f93bb90d4f351733f06716fe92fdb25de28
Commit-Date: 2026-10-21
License: Pointer only. Upstream document-processing/docx-official LICENSE is Anthropic, all rights reserved. Do not vendor scripts or prompts.

## Tujuan

Menghasilkan dokumen Word dari outline, dengan style, bukan spasi manual.

## Kapan dipakai

Pakai saat outline sudah cukup final. Jangan menyalin sumber upstream sebelum atribusi Anthropic dikonfirmasi untuk bundling.

## Langkah

1. Mulai dari outline: judul, bagian, dan tabel.
2. Pakai style untuk heading dan isi.
3. Jangan menempelkan sumber document-processing Anthropic.
4. Tulis file hasil sebagai artefak. Jangan commit dokumen klien.
5. Catat bahwa pin menunjuk monorepo, bukan izin menyalin LICENSE Anthropic.

## Input / output

Input: outline. Output: path docx artefak, di luar git jika berisi data klien.

## Batasan

Teks dan skrip upstream tidak di-vendor.
