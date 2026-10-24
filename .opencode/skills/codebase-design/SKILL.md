---
name: Codebase Design
description: Designs modular boundaries before editing, using existing project structure as the constraint.
---

# Codebase Design

Source: https://github.com/mattpocock/skills
Pin: 5beb35b040e3de97e54fa9e386d7e42d15c295c2
Commit-Date: 2026-10-19
License: MIT (mattpocock/skills). Local summary, not a vendored copy.

## Tujuan

Menetapkan batas modul sebelum kode ditulis, memakai struktur yang sudah ada sebagai kendala.

## Kapan dipakai

Pakai sebelum menambah paket, lapisan, atau folder baru. Jangan pakai untuk typo satu baris.

## Langkah

1. Baca batas modul yang sudah ada sebelum mengusulkan yang baru.
2. Pilih antarmuka kecil, bukan framework baru.
3. Sebut pemilik tiap file baru dan apa yang tidak boleh diimpornya.
4. Jaga perubahan di satu blast radius kecuali operator menyetujui pelebaran.
5. Catat keputusan di progress file sektor, bukan di task_plan.md.

## Input / output

Input: struktur repo dan perubahan yang diinginkan. Output: batas modul, pemilik file, dan impor yang ditolak.

## Batasan

Jangan merombak arsitektur yang sudah lolos hanya karena gaya.
