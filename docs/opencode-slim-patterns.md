# Pola oh-my-opencode-slim (selektif)

Adapted from [alvinunreal/oh-my-opencode-slim](https://github.com/alvinunreal/oh-my-opencode-slim) @ `3028039bf5acba0842e83f31142e75a6b50895f7` (MIT). Catatan pola saja. Jangan mengganti `.opencode/opencode.jsonc` secara wholesale.

## Yang dipakai

- Satu orchestrator merencanakan kerja, men-dispatch spesialis, lalu merekonsiliasi hasil.
- Spesialis bounded: satu sektor, satu progress file.
- Hook/payload: jangan menulis ulang prefix percakapan tiap giliran (cache-buster). SQAGI sudah menghindari router kedua.

## Yang ditolak

- **Model-mix.** Slim mempromosikan mix model, OmniRoute, ACP Claude sebagai subagent, council multi-LLM. SQAGI: **9router / ninerouter only**.
- Tidak ada LiteLLM, jev-model-router, atau oh-my-opencode-slim model preset sebagai config aktif.
- Tidak ada Designer/Fixer/Explorer sebagai agen baru. 11 sektor tetap.
- `subagent_depth=1` tetap. Sektor tidak spawn subagent. Parallel hanya lewat orchestrator dan daftar `subagents` triage.

## Konfigurasi model

Gateway hidup di config global operator (`~/.config/opencode/`), bukan di patch core dan bukan di plugin slim.
