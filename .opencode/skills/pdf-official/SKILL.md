---
name: Pdf Official
description: Generates a paginated PDF report from reviewed content, with attribution still unresolved for upstream text.
---

# Pdf Official

Source: https://github.com/davila7/claude-code-templates
Pin: e7d17f93bb90d4f351733f06716fe92fdb25de28
Commit-Date: 2026-10-21
License: Pointer only. Upstream pdf-official LICENSE is Anthropic, all rights reserved. Do not vendor.

## Tujuan

Menghasilkan PDF berhalaman dari isi yang sudah ditinjau.

## Kapan dipakai

Pakai saat isi cukup final untuk dipaginasi. Jangan vendor sumber upstream.

## Langkah

1. Konfirmasi isi cukup final.
2. Tetapkan ukuran halaman, margin, dan style heading sebelum menggambar.
3. Jangan vendor sumber skill PDF upstream.
4. Cek teks bisa dipilih, kecuali sumbernya memang pindaian.
5. Catat perintah render di progress file.

## Input / output

Input: isi final dan ukuran halaman. Output: path PDF artefak.

## Batasan

Pin monorepo bukan izin menyalin teks Anthropic.
