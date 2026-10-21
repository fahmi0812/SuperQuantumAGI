---
name: Playwright QA
description: Runs browser end-to-end checks with Playwright against an explicit local or authorized target.
---

# Playwright QA

Source: https://github.com/microsoft/playwright-cli
Pin: b85c7a736bb473bf55b584e54a09ffa698d6d871
License: Apache-2.0 (microsoft/playwright-cli). Local summary, not a vendored copy.

## Method

1. Target only a URL the operator owns or has named for this task.
2. Prefer role and label selectors over brittle coordinates.
3. Assert the user-visible outcome, not only that a request returned 200.
4. Save a trace or screenshot path when a check fails.
5. Do not use the browser session to attack a third-party site.
