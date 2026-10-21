---
name: Codebase Design
description: Designs modular boundaries before editing, using existing project structure as the constraint.
---

# Codebase Design

Source: https://github.com/mattpocock/skills
Pin: d81f3a183412e71a5b1e84ca21bc1a35eea03a60
License: MIT (mattpocock/skills). Local summary, not a vendored copy.

## Method

1. Read the existing module boundaries before proposing new ones.
2. Prefer a small interface over a new framework.
3. Name the owner of each new file and what it must not import.
4. Keep the change inside one blast radius unless the operator consents to widen it.
5. Record the design decision in the sector progress file, not in task_plan.md.
