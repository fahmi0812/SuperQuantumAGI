# Format skill SQAGI

Ringkasan lokal dari [anthropics/skills](https://github.com/anthropics/skills) skill-creator / spec @ `dbd4588f9e1033efb41dad4bef2f7947c8993d44` (Apache-2.0 pada skill-creator). Bukan skill `skill-creator`. Bukan `frontend-design`.

## Layout

```text
.opencode/skills/<id>/
  SKILL.md        # wajib
  PROVENANCE.md   # wajib untuk skill yang diadaptasi wave ini
  scripts/        # opsional, deterministik
  references/     # opsional, dimuat on-demand
```

## SKILL.md frontmatter

Wajib:

```yaml
---
name: short-id-or-title
description: Apa yang dilakukan dan kapan dipakai. Satu atau dua kalimat.
---
```

Isi tubuh mengikuti pola SQAGI: Source/Pin/License, lalu Tujuan, Kapan dipakai, Langkah, Input/output, Batasan. Bahasa Indonesia teknis. Ringkas — summary lokal, bukan salinan penuh upstream.

`name` + `description` adalah metadata pemicu. Detail prosedur di tubuh.

Progressive disclosure: metadata selalu kecil; tubuh skill < ~500 baris; referensi dibaca hanya saat perlu.

## PROVENANCE.md

```text
Source: https://github.com/<org>/<repo>
Pin: <40-hex SHA>
Path: <path upstream atau first-party>
Upstream: <jika Pin adalah OCH>
Upstream-SHA: <40-hex atau # TODO: resolve pin>
License: <SPDX / teks singkat>
```

Adapt = ringkasan + SHA, bukan pohon vendor. `subagent_depth=1`: skill sektor tidak boleh menyuruh spawn subagent.

## Yang tidak diadopsi

- Body `frontend-design` (anthropics/skills dan anthropics/claude-code).
- Design Bank / impeccable UI skill bank.
