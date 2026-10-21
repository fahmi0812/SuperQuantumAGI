---
name: Diagnosing Bugs
description: Investigates a defect to a root cause before any patch is applied.
---

# Diagnosing Bugs

Source: https://github.com/mattpocock/skills
Pin: d81f3a183412e71a5b1e84ca21bc1a35eea03a60
License: MIT (mattpocock/skills). Local summary, not a vendored copy.

## Method

1. Reproduce the failure with the smallest command or test.
2. Trace the bad value to the write that created it. Do not stop at the crash line.
3. State whether the proposed change fixes the cause or only the symptom.
4. Search for the same pattern in other modules. If it exists, stop and ask before expanding.
5. A passing local test is not done until the done-gate artifacts exist.
