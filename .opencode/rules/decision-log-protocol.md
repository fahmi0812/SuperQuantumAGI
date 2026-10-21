# Decision-log protocol

Source: kuker24/OpenCodeHighEnd `rules/decision-log-protocol.md`
Pin: 30d394fb37bbe1ca64abe1a660aefd91ac7d99fc

Used by `/figure-it-out`, `/decision-log`, and any long run that needs an audit trail. Do not invoke `/decision-log` from another manual skill unless the operator typed that slash.

## What this is

One append-only TSV of operational decisions. Not a dump of hidden reasoning. Never ask the model to reveal chain-of-thought.

Columns: `ts`, `phase`, `decision`, `why`, `evidence`, `result`.

- **ts** — ISO8601 UTC
- **phase** — workstream name
- **decision** — what was chosen, one line
- **why** — plain reason. Not a principle tag.
- **evidence** — pointer only: commit SHA, `file:line`, test name, artifact path, log path, PR number. Mandatory for any done claim.
- **result** — `FACT: <outcome>` or `JUDGMENT: <assessment>`. FACT is blocking. JUDGMENT cannot close a task and cannot override a failed or missing FACT.

## Typed-gate discipline

- Claims in tickets, prompts, or PR bodies are hypotheses until a `FACT:` row exists.
- If a required command or acceptance criterion is missing, halt and record `UNRUN` or ask. Do not invent `NOT_CONFIGURED`.
- `NOT_CONFIGURED` is valid only as an explicit FACT naming the missing gate.
- `auto` progression requires mechanical FACT and low blast radius. Otherwise hold.

## Where

Default: `decisions.tsv` in the work dir, or `.audit/<task-slug>.tsv`. Leave it uncommitted unless a reviewer needs the trail. Post-push closing facts also go to `runtime/post-push-fact.json`.

## How to write a row

```bash
.opencode/skills/decision-log/scripts/log.sh <logfile> <phase> <decision> <why> <evidence> <result>
```

The helper writes the header on first use, strips tabs and newlines, and prefixes cells that start with `=`, `+`, `-`, or `@`.

## Rules

- One row = one decision or checkpoint.
- Append-only. A wrong call gets a new row.
- Do not log hidden reasoning or every tool call.
