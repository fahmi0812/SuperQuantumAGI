---
name: Dispatching Parallel Agents
description: Dispatches independent tasks to separate agents and collects their isolated progress files.
---

# Dispatching Parallel Agents

Source: https://github.com/davila7/claude-code-templates
Pin: e7d17f93bb90d4f351733f06716fe92fdb25de28
Commit-Date: 2026-10-21
License: MIT. Local summary of cli-tool/components/skills/ai-research/dispatching-parallel-agents. Not a vendored copy.

## Tujuan

Menjalankan pekerjaan yang tidak saling menulis ke file yang sama, lalu mengumpulkan bukti tiap agen.

## Kapan dipakai

Pakai saat dua atau lebih bagian tugas bisa selesai tanpa menunggu satu sama lain. Jangan pakai jika langkah berikutnya butuh hasil langkah sebelumnya.

## Langkah

1. Pecah permintaan menjadi item yang tidak mengedit file yang sama.
2. Satu item, satu subagent sektor, satu file `runtime/progress.{agent_id}.md`.
3. Tulis syarat selesai yang bisa dicek: exit code, artefak, atau tes.
4. Subagent sektor tidak boleh men-spawn subagent lagi.
5. Synthesizer membaca progress file setelah done-gate. Bukan sebaliknya.

## Input / output

Input: daftar item, sektor, dan batas file. Output: progress file per agen plus keputusan done atau halt.

## Batasan

Maksimum tiga iterasi gagal. Tidak menulis task_plan.md. Tidak menambah router model.
