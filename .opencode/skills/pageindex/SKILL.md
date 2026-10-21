---
name: PageIndex
description: Builds a page tree for a long document before answering questions from it.
---

# PageIndex

Source: https://github.com/VectifyAI/PageIndex
Pin: 6d23caf416858f2ca136840305d1f479a86f6ef7
Commit-Date: 2026-10-01
License: MIT. Tag/context v0.2.21 in the local catalog. Local summary, not a vendored copy.

## Tujuan

Membuat pohon halaman agar jawaban atas dokumen panjang mengutip bagian, bukan mengarang.

## Kapan dipakai

Pakai pada dokumen yang terlalu panjang untuk dibaca utuh dalam satu langkah. Jangan pakai untuk file pendek yang sudah muat.

## Langkah

1. Catat nama file, jumlah halaman, dan pertanyaan yang harus dijawab.
2. Bangun pohon bagian sebelum mengutip.
3. Setiap kutipan menyebut halaman atau node pohon.
4. Jika bagian tidak ditemukan, katakan tidak ditemukan.
5. Jangan vendor paket PageIndex ke repo ini.

## Input / output

Input: dokumen dan pertanyaan. Output: pohon bagian plus kutipan berhalaman, atau celah.

## Batasan

Indeks bukan izin menyimpan dokumen rahasia di git.
