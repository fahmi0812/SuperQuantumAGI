---
name: Playwright QA
description: Runs browser end-to-end checks with Playwright against an explicit local or authorized target.
---

# Playwright QA

Source: https://github.com/microsoft/playwright-cli
Pin: b85c7a736bb473bf55b584e54a09ffa698d6d871
Commit-Date: 2026-09-28
License: Apache-2.0 (microsoft/playwright-cli). Local summary, not a vendored copy.

## Tujuan

Membuktikan hasil yang terlihat pengguna pada target yang disebut operator.

## Kapan dipakai

Pakai untuk alur browser yang dimiliki atau diizinkan. Jangan pakai untuk menyerang situs pihak ketiga.

## Langkah

1. Target hanya URL yang operator miliki atau sebut untuk tugas ini.
2. Utamakan selector role dan label, bukan koordinat.
3. Assert hasil yang terlihat, bukan hanya status 200.
4. Simpan path trace atau screenshot saat cek gagal.
5. Catat perintah di progress file sektor.

## Input / output

Input: URL, langkah pengguna, hasil yang diharapkan. Output: lulus/gagal plus artefak kegagalan.

## Batasan

Bukan sesi browser untuk serangan. Bukan vendor paket Playwright ke repo ini.
