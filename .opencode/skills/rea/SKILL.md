---
name: REA
description: Guides native binary inspection: format, symbols, and control-flow questions before patching.
---

# REA

Source: https://github.com/morluto/rea
Pin: 6d356b84344659085f2b912857b5e27fe0160c9b
Commit-Date: 2026-10-21
License: MIT, confirmed via GitHub API on 2026-10-21. Local summary only. Do not vendor.

## Method

1. Identify the file format and architecture before choosing a disassembler.
2. List imports, exports, and strings that explain the question being asked.
3. Use the re-analysis profile (ghidra, jshook, idapro) only when that profile is explicitly enabled. It must not enable offensive C2.
4. Write findings as observations. Do not publish a patch that changes security behavior without a separate authorized task.
5. If the upstream pin is still TODO, treat this file as a pointer, not as upstream source.
