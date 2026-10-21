---
name: Hypeking
description: Routes Android APK inspection and Frida-ready static analysis without vendoring offensive tooling.
---

# Hypeking

Source: https://github.com/kuker24/cli-pentestv1
Pin: fda8e627f43897884c6c9802619fe839fa149391
License: Pointer to kuker24/cli-pentestv1. Do not vendor C2 or exploit payloads into this repo.

## Method

This skill is an inspection router, not a weaponization guide.

1. Confirm the APK is one the operator is allowed to inspect.
2. Prefer static unpack and decompilation (apktool, jadx) before any dynamic attach.
3. Record package name, entry points, native libraries, and permissions in the sector progress file.
4. Dynamic instrumentation stays inside an authorized lab target. Do not write exploit payloads here.
5. Never enable offensive-c2 MCP servers from this skill.
