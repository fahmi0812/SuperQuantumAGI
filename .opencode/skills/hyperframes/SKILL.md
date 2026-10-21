---
name: Hyperframes
description: Generates frame-based programmatic motion when the output is an image sequence or frame graph.
---

# Hyperframes

Source: https://github.com/heygen-com/hyperframes
Pin: 6037d228441e23e50cd6713a464d6158941cfcae
License: Pointer to heygen-com/hyperframes at the pinned commit. Local summary, not a vendored copy.

## Method

1. Fix fps, frame count, and canvas size first.
2. Make each frame a pure function of the frame index when possible.
3. Write the sequence to an artifact directory, not into source control.
4. Hand the sequence to ffmpeg only after a single frame looks right.
5. Do not vendor the upstream package.
