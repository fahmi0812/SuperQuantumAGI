# SuperQuantumAGI

Harness orkestrasi multi-agen untuk [OpenCode](https://github.com/opencode-ai/opencode) yang menambahkan pemisahan tugas berbasis sektor, isolasi proses sandbox, dan gerbang verifikasi kualitas deterministik—tanpa memodifikasi runtime inti OpenCode.

---

## Prinsip Desain

1. **Non-Invasif:** Berjalan murni di atas ekstensi resmi OpenCode (`.opencode/agents/`, `.opencode/skills/`, `.opencode/commands/`, `.opencode/plugins/`). Biner dan runtime OpenCode tetap 100% bawaan pabrik dan bebas diperbarui kapan saja.
2. **Routing Bertingkat (Zero-LLM First):** Perintah slash dan pola instruksi umum diproses langsung oleh Layer-0 tanpa membuang token LLM. Tugas kompleks diklasifikasikan ke sektor yang relevan dengan intent 1-ke-1.
3. **Isolasi Proses (Sandbox):** Eksekusi perintah shell lokal dibatasi menggunakan Linux Bubblewrap (`bwrap`) untuk membatasi akses filesystem dan network sesuai kebutuhan tugas.
4. **Koordinasi Single-Writer:** Sub-agen hanya menulis laporan progres ke berkas masing-masing (`runtime/progress.<subagent>.md`). Penggabungan hasil ke dokumen utama (`task_plan.md` dan `findings.md`) hanya dikerjakan oleh Synthesizer untuk mencegah race condition.
5. **Verifikasi Terukur (Done-Gate):** Tugas baru dianggap selesai jika memenuhi fakta konkret: exit code 0, artifak terbukti ada, dan pengujian hijau. Setelah `git push`, status CI diperiksa langsung sebelum klaim selesai.

---

## Alur Kerja Sistem

```text
Instruksi Pengguna
    │
    ▼
[Layer-0: Deterministic Router]  ── (Slash command / keyword regex, 0 token)
    │
    ▼
[Layer-1: Triage Sektor]         ── (Klasifikasi ke 1 dari 11 sektor + kompleksitas)
    │
    ├─ Rendah ──► Jalur Cepat (1 sub-agen)
    └─ Tinggi ──► Pembagian Tugas Antar Sektor
          │
          ▼
   [Layer-2: Sub-agen Sektor]    ── (Memilih skill Tier-1 sesuai kebutuhan)
          │  • Dijalankan dalam sandbox bwrap lokal
          │  • Menulis berkas progres independen
          ▼
   [Loop Verifikasi Kualitas]
          • Done-Gate: Exit code 0 + pengujian unit lulus
          • Anti-Spin Circuit Breaker: Maksimal 3 iterasi perbaikan
          • Root-Cause Gate: Mencegah tambal-sulam gejala bug
          ▼
   [Synthesizer]
          Mengagregasikan seluruh temuan ke task_plan.md & findings.md
```

---

## Cakupan 11 Sektor

| Sektor | Fokus Tugas | Kemampuan Utama |
|---|---|---|
| **01. Orchestration & Quality** | Perencanaan, evaluasi loop, done-gate | Multi-agent fanout, anti-spin, quality gates |
| **02. Coding & Engineering** | Pengembangan software, bug fixing, review | TDD, API design, contract-first, code review, debugging |
| **03. Reverse Engineering** | Analisis biner dan aplikasi lokal | Format inspeksi, dekompilasi native, analisis APK |
| **04. Keamanan & Pentest** | Audit keamanan lokal berbasis izin (NFR11) | Pemetaan kerentanan statis, sanitasi input, audit dependensi |
| **05. OSINT & Geospasial** | Analisis data spasial dan citra terbuka | Pengolahan koordinat, metadata citra, peta vektor/raster |
| **06. Motion & Media** | Pembuatan media dan animasi terprogram | Render HTML/CSS motion, diagram SVG/HTML, infografis |
| **07. Dokumen, Data & CAD** | Pemrosesan dokumen terstruktur dan CAD | Ekstraksi PDF/DOCX (SmartDoc), SmartBook ingest, Text-to-CAD |
| **08. Riset & Analisis** | Sintesis multi-sumber dan tinjauan literatur | Pemetaan studi, pembobotan bukti, perbandingan teknis |
| **09. Penulisan Teknis** | Dokumentasi teknis dan panduan sistem | Panduan API, perbaikan tata bahasa langsung tanpa filler |
| **10. Karier** | Penyesuaian CV dan panduan teknis | Penataan portofolio teknis dan persiapan teknis |
| **11. DevOps, Infra & Finansial** | Infrastruktur, pipeline CI/CD, dan basis data | GitHub Actions (gh-axi), MongoDB, Supabase, Vercel, audit performa |

---

## Mesin Mandiri (Deterministic Tools)

Selain pemodelan LLM, repositori ini memuat harness mandiri yang berjalan secara lokal:

* **SmartDoc & SmartBook (`harness/smartdoc/`)**: Ekstraksi teks native (DOCX, PDF, gambar), audit kemiripan n-gram lokal terhadap korpus dokumen, serta penyusunan basis pengetahuan lokal tanpa modifikasi global.
* **Codebase Memory (`codebase-memory-mcp`)**: Pengindeksan graf arsitektur kode lokal untuk membaca dependensi, modul, dan call graph.
* **Context7**: Pencarian referensi sintaks dokumentasi pustaka langsung dari sumber terverifikasi.

---

## Keamanan & Sandboxing

* **Isolasi Eksekusi:** Perintah kerja dijalankan di lingkungan Linux Bubblewrap (`bwrap`) untuk mencegah modifikasi sistem yang tidak disengaja.
* **Gerbang Izin Khusus (NFR11):** Perangkat uji keamanan ofensif berada dalam profil non-aktif secara default. Penggunaannya mewajibkan token izin eksplisit dan dokumen batasan cakupan (`consent/pentest-scope.json`). File contoh (`.example.json`) otomatis ditolak oleh sistem.
* **Perlindungan Kredensial:** Seluruh konfigurasi dan skill dilarang mencetak rahasia produksi atau connection string.

---

## Persyaratan Sistem

* **OS:** Linux (Ubuntu, Debian, Fedora, Arch, dll.)
* **Node.js:** Versi 22.x atau lebih baru (menggunakan native TypeScript strip-types).
* **OpenCode:** Versi 2.x
* **Bubblewrap:** Terpasang pada sistem (`sudo apt install bubblewrap` / `sudo pacman -S bubblewrap`).
* **Koneksi Model:** Konfigurasi gateway model (mis. 9router) pada `~/.config/opencode/opencode.json`.

---

## Memulai Cepat

1. **Kloning repositori dan persiapkan berkas lingkungan:**
   ```bash
   git clone https://github.com/kuker24/SuperQuantumAGI.git
   cd SuperQuantumAGI
   cp .env.example .env
   ```

2. **Jalankan verifikasi gerbang lokal:**
   ```bash
   npm test
   node ci/run-gates.mjs
   ```

3. **Jalankan OpenCode di dalam direktori repositori:**
   ```bash
   opencode
   ```

4. **Verifikasi status koneksi MCP:**
   ```bash
   opencode mcp list
   ```
   Server utama (`codebase-memory-mcp`, `context7`, `shadcn`) akan berstatus `connected`.

---

## Verifikasi Kualitas & CI

SuperQuantumAGI menerapkan aturan verifikasi berbasis bukti:
* Setiap pengujian dijalankan lokal melalui `npm test` dan `node ci/run-gates.mjs`.
* Riwayat keputusan dicatat secara terstruktur untuk audit operasional.
* Detail profil verifikasi dan aturan pasca-push tersedia di [docs/verification.md](docs/verification.md).

---

## Atribusi & Lisensi

Repositori ini menyertakan dan mengintegrasikan perangkat pihak ketiga dengan atribusi resmi:
- **Crawl4AI Attribution:** Menggunakan komponen yang dikembangkan oleh UncleCode (https://github.com/unclecode/crawl4ai).
- **Serena / SolidLSP:** Antarmuka eksternal MCP untuk Serena (GPL-3.0-or-later) oleh Jain & Panchenko IT-Berater Partnerschaft (Oraios AI). Tidak di-vendor ke dalam repositori.
- **DeusData Codebase Memory MCP:** Hak Cipta (c) 2025 DeusData (Lisensi MIT).
- **Context7:** Hak Cipta (c) 2021 Upstash, Inc. (Lisensi MIT).
- **shadcn/ui:** Hak Cipta (c) 2023 shadcn (Lisensi MIT).
- **Claude Code Templates:** Hak Cipta (c) 2025 Daniel (San) Ávila (Lisensi MIT).

Rincian lengkap lisensi dan hak cipta tercantum pada berkas `NOTICE` dan `THIRD_PARTY_LICENSES`.
