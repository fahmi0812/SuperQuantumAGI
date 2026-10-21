---
name: Test-Driven Development
description: Writes a failing test first, then the smallest implementation that makes it pass.
---

# Test-Driven Development

Source: https://github.com/mattpocock/skills
Pin: d81f3a183412e71a5b1e84ca21bc1a35eea03a60
License: MIT (mattpocock/skills). Local summary, not a vendored copy.

## Method

1. Name the behavior in one sentence.
2. Add a test that fails for that reason, not for a missing import unrelated to the behavior.
3. Implement the smallest change that turns that test green.
4. Re-run the relevant suite. Do not claim done on an unread failure.
5. If the test passes by deleting the assertion, the step is not done.
