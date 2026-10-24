---
name: systematic-debugging
description: Adapter to diagnosing-bugs and root-cause-gate. Investigate cause before any patch. Not a second procedure.
---

# Systematic Debugging

Source: https://github.com/obra/superpowers
Pin: 2ce8aa15d05bd57213e6f746f953aafb7ded7a8b
License: MIT. Local adapter. Not a vendored copy.

## Tujuan

Menyalurkan debug ke skill yang sudah ada, bukan prosedur kedua.

## Kapan dipakai

Bug, tes merah, atau perilaku tak terduga, sebelum patch. Jika `diagnosing-bugs` sudah jalan, jangan ulangi.

## Langkah

1. Ikuti `.opencode/skills/diagnosing-bugs/SKILL.md`: reproduksi terkecil, telusuri nilai buruk ke penulisannya.
2. Ikuti `.opencode/skills/root-cause-gate/SKILL.md`: gejala vs sebab; grep pola lintas modul; stop jika blast radius melebar tanpa consent.
3. Baru usulkan patch setelah sebab tertulis. Tes merah yang benar dulu (skill `tdd`).
4. Jangan spawn subagent. Jangan menambah router. Jangan menelan error sebagai "fix".

## Input / output

Input: gejala + cara reproduksi. Output: rujukan ke diagnosing-bugs / root-cause-gate plus sebab.

## Batasan

Bukan salinan empat fase superpowers. Tubuh kanonik tetap diagnosing-bugs + root-cause-gate.
