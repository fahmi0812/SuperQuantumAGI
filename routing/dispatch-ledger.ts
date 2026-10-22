/**
 * Records the sector plan against the subagents a session actually spawned.
 * Utility agents such as synthesizer are kept, but they are not sector drift.
 */

import fs from "node:fs";
import path from "node:path";
import type { DispatchMode } from "../harness/io-schema/types.ts";
import { isSectorID, toSectorAgent } from "./dispatch.ts";

export const DISPATCH_LEDGER_RELATIVE = "runtime/triage-dispatch.json";

export interface DispatchSessionRecord {
  plannedSector: string;
  dispatch: DispatchMode;
  planned: string[];
  invoked: string[];
  surface: string;
  fact: string;
  updatedAt: string;
}

export interface DispatchLedger {
  sessions: Record<string, DispatchSessionRecord>;
}

export interface DispatchComparison {
  planned: string[];
  invoked: string[];
  sectorInvoked: string[];
  extraSectors: string[];
  missingSectors: string[];
  utility: string[];
  fact: string;
}

export function emptyLedger(): DispatchLedger {
  return { sessions: {} };
}

export function canonicalAgent(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed || trimmed.includes("..") || trimmed.includes("\0")) return null;
  if (isSectorID(trimmed)) return toSectorAgent(trimmed);
  const sector = trimmed.startsWith("sectors/") ? trimmed.slice("sectors/".length) : "";
  if (sector && isSectorID(sector)) return toSectorAgent(sector);
  const base = trimmed.replace(/^.*\//, "");
  if (!base || base.startsWith(".")) return null;
  return base;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function compareDispatch(input: { planned: readonly string[]; invoked: readonly string[] }): DispatchComparison {
  const planned = unique(
    input.planned.map((name) => canonicalAgent(name)).filter((name): name is string => Boolean(name && name.startsWith("sectors/"))),
  );
  const invoked = unique(
    input.invoked.map((name) => canonicalAgent(name)).filter((name): name is string => Boolean(name)),
  );
  const sectorInvoked = invoked.filter((name) => name.startsWith("sectors/"));
  const utility = invoked.filter((name) => !name.startsWith("sectors/"));
  const extraSectors = sectorInvoked.filter((name) => !planned.includes(name));
  const missingSectors = planned.filter((name) => !sectorInvoked.includes(name));
  const plannedText = planned.join(",") || "none";
  const invokedText = sectorInvoked.join(",") || "none";
  const fact = extraSectors.length
    ? `FACT: dispatch drift planned=${plannedText} invoked=${invokedText} extra=${extraSectors.join(",")}`
    : `FACT: dispatch planned=${plannedText} invoked=${invokedText}`;
  return { planned, invoked, sectorInvoked, extraSectors, missingSectors, utility, fact };
}

export function notePlanned(
  ledger: DispatchLedger,
  sessionID: string,
  input: {
    plannedSector: string;
    dispatch: DispatchMode;
    planned: readonly string[];
    surface: string;
  },
  now = new Date().toISOString(),
): DispatchSessionRecord {
  const comparison = compareDispatch({ planned: input.planned, invoked: [] });
  const record: DispatchSessionRecord = {
    plannedSector: input.plannedSector,
    dispatch: input.dispatch,
    planned: comparison.planned,
    invoked: [],
    surface: input.surface.slice(0, 180),
    fact: comparison.fact,
    updatedAt: now,
  };
  ledger.sessions[sessionID] = record;
  return record;
}

export function noteInvoked(
  ledger: DispatchLedger,
  sessionID: string,
  agentName: string,
  now = new Date().toISOString(),
): DispatchSessionRecord {
  const current = ledger.sessions[sessionID] ?? {
    plannedSector: "unknown",
    dispatch: "fast-path" as DispatchMode,
    planned: [],
    invoked: [],
    surface: "",
    fact: "",
    updatedAt: now,
  };
  const comparison = compareDispatch({
    planned: current.planned,
    invoked: [...current.invoked, agentName],
  });
  const record: DispatchSessionRecord = {
    ...current,
    invoked: comparison.invoked,
    fact: comparison.fact,
    updatedAt: now,
  };
  ledger.sessions[sessionID] = record;
  return record;
}

export function writeLedger(filePath: string, ledger: DispatchLedger): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(ledger, null, 2)}\n`);
}
