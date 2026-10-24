---
name: brainstorming
description: Explore approaches and missing intent before committing to a design or implementation plan.
---

# Brainstorming

Source: https://github.com/obra/superpowers
Pin: 2ce8aa15d05bd57213e6f746f953aafb7ded7a8b
License: MIT. Local summary. Not a vendored copy.

## Tujuan

Menemukan apa yang sebenarnya diminta, dan mengapa, sebelum kode atau spek panjang ditulis.

## Kapan dipakai

Fitur baru, arah desain belum terkunci, atau operator minta eksplorasi. Jangan pakai untuk typo, hotfix, atau tugas yang kontraknya sudah jelas.

## Langkah

1. Baca konteks yang sudah ada (spek, kode, PRD). Jangan bertanya hal yang file sudah jawab.
2. Jika semuanya ada di permintaan, kerjakan. Jika ada yang nontrivial hilang, sebut pendekatan (2–3 opsi) lalu satu pertanyaan yang paling mengubah bentuk.
3. Tulis catatan desain pendek (atau tunjuk `docs/spec/prd.md`). Dapatkan persetujuan operator sebelum `writing-plans`.
4. Spike hanya jika operator setuju. Opt-out ("langsung kerjakan") mengakhiri skill ini.
5. Jangan spawn subagent. Serahkan ke skill `writing-plans` di sesi yang sama, bukan nested agent.

## Input / output

Input: permintaan yang masih longgar. Output: opsi, keputusan, atau spek pendek — bukan diff.

## Batasan

`subagent_depth=1`. Bukan Design Bank. Bukan wawancara tanpa batas.
