---
name: Matt Code Review
description: Reviews a diff for correctness, type safety, and regressions without rewriting the change.
---

# Matt Code Review

Source: https://github.com/mattpocock/skills
Pin: d81f3a183412e71a5b1e84ca21bc1a35eea03a60
License: MIT (mattpocock/skills). Local summary, not a vendored copy.

## Method

1. Review the diff that exists. Do not restyle unrelated files.
2. Check types, error paths, and tests that should have changed with the behavior.
3. Order findings by severity. Cite file and line.
4. Distinguish a bug from a preference.
5. Do not approve a change that only hides a symptom.
