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
   - The `re-analysis` profile (ghidra, jshook, idapro) may be enabled for inspection. It must never enable `offensive-c2`.

## Selection

1. Android package or Frida question: hand the inspection plan to `hypeking`. Do not write exploit payloads.
2. Native ELF, Mach-O, or PE question: hand disassembly notes to `rea`.
3. A patch is allowed only after inspection, only on an artifact the operator may modify, and only through `universal-modder`'s revertible plan.
4. Authorized security testing requires NFR11 consent. It is not selected by this router for ordinary reverse engineering.
5. Record format, architecture, and the question being answered in `runtime/progress.reverse-engineering.md`.

Source pointers live in the child skills. This router does not vendor their repositories.
