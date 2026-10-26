---
name: Humanizer
description: Rewrites stiff AI-sounding prose into direct language without changing the facts.
---

# Humanizer

Source: https://github.com/blader/humanizer
Pin: 225a6f39ac85f76ee48dbad772ea4abe4ed6c9d8
Commit-Date: 2026-09-28
License: MIT (blader/humanizer). Prefix 225a6f39ac85 resolved to this commit. Local summary, not a vendored copy.

## Tujuan

Mengubah suara kalimat tanpa mengubah fakta, angka, atau nama.

## Kapan dipakai

Pakai pada draf yang kaku atau penuh pengisi. Jangan pakai untuk menambah bukti yang tidak ada. Menggantikan `unslop` dan `install-anti-slop`.

## Langkah

1. Simpan setiap fakta, angka, dan nama. Ubah hanya suara.
2. Hapus pengisi, antusiasme palsu, dan adjectiva bertumpuk.
3. Utamakan kalimat pendek dan kata kerja konkret.
4. Jangan mengarang anekdot agar terdengar manusiawi.
5. Baca ulang. Jika satu kalimat tidak mengubah klaim, potong.

## Input / output

Input: draf dan bahasa target. Output: revisi dengan fakta yang sama.

## Batasan

Bukan evasi detektor. Bukan izin untuk mengubah angka.
