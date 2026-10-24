---
name: demo-video
description: Slash-only narrated web-app demo video. Films one scene at a time from a pinned build or a public URL. Do not auto-invoke.
compatibility: opencode
license: MIT
---

# Demo Video

Source: https://github.com/nilbuild/video-demo
Pin: 767bfb818880c9f38bb02873d3d67141a3e62250
License: MIT. Local procedure summary. Engine/scripts tree is not vendored.

Slash-only (`/demo-video`). Jangan auto-invoke dari kata kunci.

## Tujuan

Merekam walkthrough web app: satu adegan, gestur dulu, narasi sambil zoom ke hasil.

## Kapan dipakai

Operator mengetik `/demo-video`. Bukan untuk screenshot ad-hoc atau animasi Remotion/Manim.

## Langkah

1. Tentukan mode tanpa bertanya berulang: URL publik → `site`; repo dengan build web → `build`. Localhost/dev server tidak difilmkan.
2. `build`: pakai hasil build yang di-pin, mock request in-process, pin jam. Jangan unggah data akun nyata.
3. Satu adegan dulu. Gestur (klik/hover) selesai, baru narasi sambil kamera masuk. Satu subjek per kalimat.
4. Target 1080p60 video, still 2x. Baca setiap PNG; framing salah = gagal meski file mp4 ada.
5. Serahkan path klip, lalu berhenti. Re-film jika operator mengkoreksi naskah, zoom, atau suara. Jangan perluas jadi tur 10 adegan kecuali diminta.
6. Engine nilbuild tidak di-vendor di harness ini. Pakai Playwright + ffmpeg milik operator jika ada. Jika toolchain tidak ada, katakan demikian. Jangan mengarang pipeline `id-demo-video`.

## Input / output

Input: repo web atau URL publik + apa yang harus terlihat. Output: klip/still per adegan, atau pernyataan toolchain hilang.

## Batasan

`subagent_depth=1`. Jangan spawn subagent. Jangan `pkill` server orang lain. Jangan sudo. Jangan film halaman login.
