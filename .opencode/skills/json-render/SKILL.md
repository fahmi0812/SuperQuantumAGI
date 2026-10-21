---
name: JSON Render
description: Renders UI from a declared JSON spec instead of freehand markup.
---

# JSON Render

Source: https://github.com/vercel-labs/json-render
Pin: c2600d73908ed505e6d726f5b6f969ba8f597ce7
Commit-Date: 2026-09-23
License: Apache-2.0. Local summary, not a vendored copy.

## Tujuan

Merender UI dari spec JSON yang dideklarasikan, bukan markup bebas.

## Kapan dipakai

Pakai saat bentuk UI harus bisa divalidasi sebagai data. Jangan pakai untuk animasi waktu.

## Langkah

1. Tetapkan spec: komponen yang diizinkan dan properti wajib.
2. Tolak kunci yang tidak ada di spec.
3. Render dari spec. Jangan menyisipkan HTML di luar spec.
4. Simpan spec di samping output agar bisa diulang.
5. Jangan vendor paket json-render.

## Input / output

Input: spec JSON. Output: render plus daftar kunci yang ditolak.

## Batasan

Apache-2.0 pointer, bukan salinan sumber.
