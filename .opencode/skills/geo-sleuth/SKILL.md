---
name: Geo Sleuth
description: Geolocates an image or coordinate from public cues and states the confidence of each cue.
---

# Geo Sleuth

Source: https://github.com/Oldcircle/geo-sleuth
Pin: 16e9429416e1151562836a613acefe74f3b8f0d5
Commit-Date: 2026-10-18
License: MIT, confirmed via GitHub API on 2026-10-21. Local summary only. Do not vendor.

## Method

1. Separate what is visible (signage, terrain, sun, architecture) from what is guessed.
2. Convert a supported coordinate into a map check. Do not invent a location from a weak cue.
3. Record confidence and the cue that supports it.
4. Use only public imagery and data the operator is allowed to query.
5. Do not copy upstream source into this repo.
