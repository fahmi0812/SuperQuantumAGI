---
name: Diagram Design
description: Draws a named HTML/SVG diagram type from a list of nodes and edges.
---

# Diagram Design

Source: https://github.com/cathrynlavery/diagram-design
Pin: f903933a534ba92cde1c85a28186267b3a317bb2
Commit-Date: 2026-10-01
License: MIT. Short prefix f903933a534b resolved to this commit. Local summary, not a vendored copy.

## Tujuan

Menggambar satu tipe diagram HTML/SVG dari node dan sisi yang sudah disebut.

## Kapan dipakai

Pakai saat hubungan perlu dilihat, bukan diceritakan. Untuk video, serahkan ke skill motion.

## Langkah

1. Pilih satu tipe: alur, urutan, atau arsitektur. Jangan mencampur.
2. Daftar node dan sisi sebelum menulis SVG.
3. Label harus nama benda, bukan kata sifat.
4. Tulis HTML/SVG ke artefak. Jangan vendor repo upstream.
5. Cek bahwa setiap sisi punya dua ujung yang ada di daftar node.

## Input / output

Input: tipe diagram, node, sisi. Output: HTML/SVG artefak.

## Batasan

Bukan pengganti claude-motion-design untuk video.
