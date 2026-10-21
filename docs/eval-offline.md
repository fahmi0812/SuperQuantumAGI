# Eval offline

Default merge gate tetap `node ci/run-gates.mjs`. File di halaman ini **bukan** gate hijau. Kalau promptfoo atau deepteam tidak terpasang, atau model live tidak ada, statusnya `not run`. Jangan dicatat sebagai lulus.

## Routing (promptfoo)

Config: `ci/promptfoo-config.yaml`.

Provider `ci/eval/routing-provider.sh` memakai baseline deterministik (Layer-0, lalu `classifyDeterministic` sebagai pengganti satu panggilan Layer-1). Itu menguji golden set dan keunikan intent-key. Itu **bukan** panggilan 9router.

```bash
# Node >= 22. promptfoo tidak di-vendor.
npx promptfoo eval -c ci/promptfoo-config.yaml
```

Target akurasi di config: ≥ 90%. Kalau `npx` tidak bisa mengunduh promptfoo, eval ini tidak dijalankan. Suite `npm test` tetap bisa memanggil provider langsung untuk satu kasus; itu bukan pengganti promptfoo.

Live Layer-1 tidak dikonfigurasi di file ini. Jangan mengisi provider model tebakan.

## Red-team (deepteam)

Config: `ci/deepteam.yaml`.

Paket `confident-ai/deepteam` adalah pointer T2. Tidak di-vendor. `models` sengaja kosong. Callback `ci/eval/deepteam_target.py` menolak jalan dan tidak mengarang endpoint.

```bash
# Akan gagal sampai model simulator/evaluasi diisi di override lokal yang tidak di-commit.
deepteam run ci/deepteam.yaml
```

Kegagalan itu status jujur, bukan regresi gate. Jangan menulis hasil palsu ke `runtime/deepteam/`.

## Yang tidak dilakukan CI

`.github/workflows/ci.yml` hanya menjalankan `node ci/run-gates.mjs` pada Node 22. Workflow itu tidak memanggil promptfoo atau deepteam.
