# PRD: [NAMA FITUR]

**Cabang:** `[wave/…]`  
**Status:** Draft  
**Pin pola:** github/spec-kit `67e0f7294e6e728ab60bf7b4590deb470448bc2d`

## Skenario pengguna (wajib)

Setiap cerita harus bisa diuji sendiri (P1 dulu).

### User Story 1 — [judul] (P1)

[Perjalanan pengguna, bahasa biasa]

**Mengapa P1:** [nilai]  
**Uji mandiri:** [perintah / artefak]  
**Acceptance:**

1. **Given** [state], **When** [aksi], **Then** [hasil]

### Edge cases

- Batas [kondisi]?
- Error [skenario]?

## Requirements (wajib)

- **FR-001:** Sistem MUST [kapabilitas]
- **FR-002:** Sistem MUST [kapabilitas]

Tandai yang belum jelas dengan `NEEDS CLARIFICATION:`.

### Entitas (jika ada data)

- **[Entitas]:** [arti, atribut tanpa implementasi]

## Success criteria (wajib)

Ukuran yang bisa dicek, bukan selera.

- **SC-001:** [metrik]
- **SC-002:** [metrik]

Klaim selesai lewat done-gate (`FACT:`), bukan narasi.

## Asumsi

- [pengguna / cakupan / dependensi]

## Batasan SQAGI

- 11 sektor, `subagent_depth=1`, 9router-only.
- Bukan Design Bank. Bukan patch OpenCode core.
- `/pentest` tetap gated.
