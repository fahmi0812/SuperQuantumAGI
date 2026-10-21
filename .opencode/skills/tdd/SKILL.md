---
name: Test-Driven Development
description: Writes a failing test first, then the smallest implementation that makes it pass.
---

# Test-Driven Development

Source: https://github.com/mattpocock/skills
Pin: d81f3a183412e71a5b1e84ca21bc1a35eea03a60
Commit-Date: 2026-09-29
License: MIT (mattpocock/skills). Local summary, not a vendored copy.

## Tujuan

Mengunci perilaku dengan tes yang gagal karena alasan yang benar, lalu implementasi terkecil.

## Kapan dipakai

Pakai saat perilaku bisa dinyatakan sebagai tes. Jangan pakai untuk spike yang belum punya kontrak.

## Langkah

1. Namai perilaku dalam satu kalimat.
2. Tambah tes yang gagal karena perilaku itu, bukan karena impor yang tidak terkait.
3. Implementasi perubahan terkecil yang membuat tes itu hijau.
4. Jalankan suite yang relevan. Jangan klaim selesai pada kegagalan yang belum dibaca.
5. Tes yang lolos karena assertion dihapus bukan selesai.

## Input / output

Input: kalimat perilaku. Output: tes merah lalu hijau, plus perintah yang dijalankan.

## Batasan

Jangan menulis implementasi dulu lalu menyesuaikan tes agar cocok.
