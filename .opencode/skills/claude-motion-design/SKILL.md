---
name: Claude Motion Design
description: Pure-code programmatic animation and video rendering using HTML5, CSS animations, Playwright, and FFmpeg.
---

# Claude Motion Design Protocol

## High-Performance Motion Rendering

1. **Architecture:**
   - Construct animation scenes using clean HTML5, CSS keyframes, and GSAP or Web Animations API.
   - Use headless Playwright to step through animation frames with deterministic precision (`page.evaluate` + virtual time clock).
   - Pipe frames directly into FFmpeg for crisp MP4/WebM encoding.

2. **Benefits over non-permissive frameworks:**
   - 100% Permissive MIT license.
   - Eliminates proprietary non-OSI engine licensing restrictions.
   - Zero vendor lock-in; runs completely locally with standard system packages (`playwright` + `ffmpeg`).

## Render sequence

1. Fix the canvas size, fps, and duration before writing keyframes.
2. Build the scene as HTML and CSS. Drive time from a frame index, not from `Date.now()`.
3. Open the page in headless Playwright. Seek to each frame, screenshot, and write `frame-0001.png` onward into an artifact directory.
4. Encode with ffmpeg only after one frame looks right. Keep the ffmpeg command in the sector progress file.
5. Honor `prefers-reduced-motion` when the same scene is also shown in a browser.
6. Do not vendor Remotion, GSAP club plugins, or other non-cleared animation packages into this repository.

This skill stays the HTML + Playwright + ffmpeg path. React video belongs to `claude-remotion-skill`. Math scenes belong to `manim`.
