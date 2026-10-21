---
name: Reverse Skill
description: Primary router and methodology for reverse engineering, binary analysis, Android APK decompilation, and disassembler workflows.
---

# Reverse Engineering Router Skill

## Triage & Tooling Dispatch

1. **Android APK & Frida:**
   - Delegate to `hypeking` submodule.
   - Decompile with `jadx` / `apktool`.
   - Dynamic instrumentation with Frida scripts.

2. **Native Binaries (ELF, Mach-O, PE):**
   - Delegate to `rea` and `universal-modder`.
   - Activate `re-analysis` lazy profile (ghidra, jshook, idapro).
   - Trace control flow, export symbols, and analyze function graphs.

3. **Defensive Boundary:**
   - Reverse engineering is strictly for inspection, compatibility, and vulnerability analysis.
   - Do NOT attempt to spawn offensive C2 frameworks from this workflow.
