---
name: Anti-Slop
description: Strips buzzwords and empty intensifiers from draft text while preserving technical meaning.
---

# Anti-Slop

Source: https://github.com/dmmulroy/anti-slop
Pin: c44ef22ca116d0ba62a3ff663a0bd13a3f3fa40b
License: Pointer to dmmulroy/anti-slop at the pinned commit. Local summary, not a vendored copy.

## Method

1. Delete words that do not change the claim: leverage, seamless, robust, cutting-edge, delve.
2. Replace a vague noun with the thing it refers to.
3. Keep warnings and constraints. Clarity is not the same as softening a risk.
4. Read the result aloud. If a sentence still says nothing, cut it.
5. Do not vendor the upstream repository.
