---
name: API Design
description: Designs REST resources, status codes, pagination, and versioning before handlers are written.
---

# API Design

Source: https://github.com/affaan-m/ECC
Pin: 90606c8315ee09cafc303515c5f33024db6b9882
Commit-Date: 2026-10-20
License: MIT. Path .agents/skills/api-design. Local summary, not a vendored copy. ECC subset, not the whole bundle.

## Tujuan

Mengunci nama resource, kode status, pagination, dan versi sebelum handler ditulis.

## Kapan dipakai

Pakai saat endpoint baru atau review kontrak REST. Bukan untuk bug di dalam handler yang kontraknya sudah benar.

## Langkah

1. Namai resource sebagai benda, bukan kata kerja.
2. Tetapkan kode status untuk sukses, validasi, dan tidak ditemukan.
3. Tetapkan pagination dan filter sebelum menambah field bebas.
4. Versi hanya jika kontrak yang sudah terbit berubah.
5. Tulis contoh request dan response palsu, tanpa secret.

## Input / output

Input: resource dan operasi. Output: tabel endpoint, status, dan contoh payload.

## Batasan

Bukan implementasi. Bukan seluruh 9 skill ECC.
