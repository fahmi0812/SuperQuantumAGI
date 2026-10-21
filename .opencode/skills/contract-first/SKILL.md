---
name: Contract First
description: Locks the request and response contract before implementation or client code starts.
---

# Contract First

Source: https://github.com/affaan-m/ECC
Pin: 90606c8315ee09cafc303515c5f33024db6b9882
Commit-Date: 2026-10-20
License: MIT. Path skills/contract-first exists at this commit. Local summary, not a vendored copy.

## Tujuan

Mengunci kontrak permintaan dan jawaban sebelum implementasi atau klien dimulai.

## Kapan dipakai

Pakai saat dua sisi harus sepakat sebelum kode. Jangan pakai untuk refactor internal tanpa konsumen.

## Langkah

1. Tulis skema permintaan, jawaban, dan error sebelum fungsi.
2. Contoh payload harus lolos skema.
3. Implementasi yang menyimpang dari skema adalah gagal, bukan skema yang diubah diam-diam.
4. Perubahan kontrak yang sudah terbit butuh versi atau catatan migrasi.
5. Jangan mengarang field agar tes kebetulan lolos.

## Input / output

Input: operasi dan konsumen. Output: skema plus contoh yang valid dan yang ditolak.

## Batasan

Subset ECC. Skill ECC lain tetap di upstream sampai dipilih.
