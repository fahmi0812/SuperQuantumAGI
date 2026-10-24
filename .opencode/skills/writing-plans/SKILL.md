---
name: writing-plans
description: Write a bite-sized implementation plan from a spec before touching product code.
---

# Writing Plans

Source: https://github.com/obra/superpowers
Pin: 2ce8aa15d05bd57213e6f746f953aafb7ded7a8b
License: MIT. Local summary. Not a vendored copy.

## Tujuan

Rencana untuk pelaksana yang belum melihat spek: file, tanda tangan, tes per task.

## Kapan dipakai

Ada spek/PRD multi-langkah, sebelum kode. Jangan pakai untuk satu baris atau saat spek belum ada (pakai `brainstorming` / `docs/spec/prd.md`).

## Langkah

1. Simpan rencana di `.scratch/<fitur>/plan.md` atau `docs/spec/plan.md`. Bukan `docs/superpowers/plans/`.
2. Pemetaan file dulu: siapa pemilik, apa yang tidak diimpor.
3. Satu task = satu siklus tes. Checkbox per aksi yang hasilnya bisa dicek.
4. Rujuk skill `tdd` dan `subagent-driven-development` yang sudah ada. Jangan menduplikasi tubuhnya. Jangan spawn subagent.
5. Selesai rencana ≠ selesai fitur. Eksekusi lewat sektor + done-gate.

## Input / output

Input: spek. Output: plan ber-task dengan path persis.

## Batasan

`subagent_depth=1`. Sektor tidak menulis `task_plan.md`.
