# SmartDoc & SmartBook in SuperQuantumAGI

## Overview

SmartDoc and SmartBook provide deterministic document intelligence and reusable knowledge management for SuperQuantumAGI. Ported from the permissive MIT core of OpenCodeHighEnd, the engine operates as a self-contained harness module with a Node.js CLI adapter and Python runtime.

Deterministic tasks run directly via the CLI, while model operations are strictly confined to reasoning, synthesis, and answering questions from extracted text.

## Architecture

- **CLI Adapter:** `node harness/smartdoc/cli.mjs [smartdoc|smartbook] <subcommand>`
- **Python Engine:** `harness/smartdoc/` (executed via `python3 harness/smartdoc/main.py`)
- **Skills:**
  - `.opencode/skills/smartdoc/`: Per-job document intelligence (answering, creating, transforming, extracting, summarizing, and verifying).
  - `.opencode/skills/smartbook-ingest/`: Reusable book and course compilation and section retrieval.
- **Slash Commands:**
  - `/smartdoc`: Deterministic early-exit entrypoint routing to Sector 7 (`data-doc-cad`).
  - `/smartbook`: Reusable knowledge management routing to Sector 7 (`data-doc-cad`).

## Storage Root Resolution

Storage isolation is enforced deterministically. SmartDoc never writes persistent artifacts to `~/.config/opencode/` or harness internal paths. Root resolution follows this strict priority:

1. **Explicit argument:** `--root <path>`
2. **SuperQuantumAGI environment variable:** `SUPERQ_SMARTDOC`
3. **OpenCode compatibility fallback:** `OPENCODE_SMARTDOC`
4. **Default user directory:** `~/SmartDoc`

```bash
# Example explicit check
node harness/smartdoc/cli.mjs status --json
# Output:
# {
#   "root": "/home/user/SmartDoc",
#   "capabilities": { ... },
#   "ocr_languages": []
# }
```

## Capability Matrix & Extraction

Run status check to verify available local extractors:

```bash
node harness/smartdoc/cli.mjs smartdoc status --json
```

- **Native Text:** DOCX, PDF, Markdown, and TXT are parsed natively.
- **OCR:** Used only as an `AUTO` fallback for scanned PDFs or images. If Tesseract is not installed or configured, status reports `NOT_CONFIGURED`.
- **Similarity Audit:** Uses local n-gram token similarity against an explicitly named corpus (`smartdoc originality <path> --against <file>`). Reports are local evidence tables, not global web or Turnitin scores. Unreadable sources return `AUDIT_NOT_RUN`.

## Sector Routing & Intents

SmartDoc and SmartBook belong to Sector 7 (**Data, Document, & CAD**):

- `smartdoc_job`: Triggered by document tasks, questions on attachments, PDF/DOCX processing, and contract locking.
- `smartbook_ingest`: Triggered by requests to compile, update, inspect, or retrieve reusable modules or books.

Tie-breakers resolve terms like `smartbook`, `jadikan buku`, `smartdoc`, `document contract`, and `kerjakan soal` deterministically to Sector 7 without global LLM scoring.

## Differences from OpenCodeHighEnd

1. **No External CLI Binary:** OpenCodeHighEnd relied on an installed `opencode-he` binary. SuperQuantumAGI invokes `node harness/smartdoc/cli.mjs` directly.
2. **No Design Bank Dependencies:** Design Bank, `impeccable`, and UI generation references are completely removed. SmartDoc treats all document content as factual data and never renders UI components.
3. **Environment Isolation:** SuperQuantumAGI introduces `SUPERQ_SMARTDOC` as the primary root variable while maintaining backward compatibility with `OPENCODE_SMARTDOC`.
