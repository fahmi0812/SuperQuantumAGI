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
