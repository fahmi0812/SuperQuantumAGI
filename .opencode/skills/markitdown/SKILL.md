---
name: Markitdown
description: Converts office and web documents to Markdown for review, without storing the original secrets.
---

# Markitdown

Source: https://github.com/microsoft/markitdown
Pin: b8f79c57ebc0044be41323d89b2a45d3fda8460e
Commit-Date: 2026-09-21
License: MIT (microsoft/markitdown). Local summary, not a vendored copy.

## Tujuan

Mengubah salinan dokumen ke Markdown yang bisa ditinjau, tanpa menimpa sumber.

## Kapan dipakai

Pakai saat isi office atau web perlu dibaca sebagai teks. Jangan pakai untuk menghasilkan dokumen akhir.

## Langkah

1. Konversi salinan. Jangan menimpa dokumen sumber.
2. Cek tabel, heading, dan gambar yang hilang.
3. Hapus secret dan token dari output sebelum di-commit.
4. Pakai alat markitdown eksternal. Jangan vendor sumbernya ke repo ini.
5. Catat nama file sumber dan perintah konversi di progress file.

## Input / output

Input: path salinan dokumen. Output: markdown plus catatan bagian yang hilang.

## Batasan

Output konversi bukan izin menyimpan kredensial.
