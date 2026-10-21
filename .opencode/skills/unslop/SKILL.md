---
name: Unslop
description: Cuts AI writing tells from a draft while preserving meaning and the intended tone.
---

# Unslop

Source: https://github.com/cursor/plugins
Pin: e43c7ee26e0038c6c1fa8380dd34ce86ff94cb2a
Commit-Date: 2026-10-04
License: MIT. Path pstack/skills/unslop exists at this commit. Local summary, not a vendored copy.

## Tujuan

Memotong pola tulisan AI tanpa mengubah makna atau nada yang diminta.

## Kapan dipakai

Pakai pada teks yang sudah ada dan terdengar seperti templat model. Bukan untuk mengarang isi baru.

## Langkah

1. Tandai pola: pembuka kosong, triad adjectiva, transisi palsu, dan klaim tanpa benda.
2. Tulis ulang kalimat itu. Pertahankan makna dan nada yang diminta.
3. Jangan menambah fakta agar teks terasa kaya.
4. Bandingkan dengan draf. Setiap angka dan nama harus tetap.
5. Jika sebuah pola adalah istilah teknis yang memang tepat, biarkan.

## Input / output

Input: draf dan nada target. Output: revisi plus daftar pola yang dipotong.

## Batasan

Bukan humanizer untuk fakta baru. Bukan izin menyalin SKILL.md upstream.
