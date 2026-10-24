# Tech: [NAMA FITUR]

**PRD:** [tautan prd.md]  
**Pin pola:** github/spec-kit `67e0f7294e6e728ab60bf7b4590deb470448bc2d`

## Ringkasan

[Syarat utama + pendekatan teknis]

## Konteks teknis

**Language/Version:** Node 22 (strip-types) atau [lain]  
**Primary dependencies:** [pustaka yang sudah ada]  
**Storage:** [jika ada]  
**Testing:** `npm test` / tes tertarget  
**Target platform:** Linux + OpenCode 2.x  
**Constraints:** layer `.opencode/` saja; 9router-only; bwrap fail-closed  
**Scale/Scope:** [batas]

## Constitution check (wajib lolos)

- Tidak memodifikasi runtime OpenCode.
- Routing model tetap 9router / ninerouter.
- `subagent_depth=1`; sektor tidak spawn subagent.
- Single-writer: progress file sektor, bukan `task_plan.md`.
- Done-gate + anti-spin `max_iterations = 3`.
- NFR11: pentest off by default.
- Tidak mengadopsi Design Bank / frontend-design body.

## Struktur

```text
.scratch/<fitur>/
  prd.md
  tech.md
  plan.md
```

Kode produk mengikuti layout repo yang sudah ada. Jangan menambah `vendor/`.
