/**
 * Dispatch plan for one triage result.
 * Low is one agent. High stays one agent (serial) unless the triage names
 * two or three sectors that can run together. Never adds a companion sector.
 */

import type { ComplexityTier, DispatchMode, SectorID } from "../harness/io-schema/types.ts";
import { SECTORS_LIST } from "./layer1-triage.ts";

export const MAX_PARALLEL_AGENTS = 3;

export interface DispatchPlan {
  mode: DispatchMode;
  subagents: string[];
}

export interface TriagePayload {
  sector: string;
  complexity: ComplexityTier;
  profile: string;
  dispatch: DispatchMode;
  subagents: string[];
  qualityObligation?: string;
}

const SECTOR_SET = new Set<string>(SECTORS_LIST);

export function isSectorID(value: string): value is SectorID {
  return SECTOR_SET.has(value);
}

export function toSectorAgent(sector: SectorID): string {
  return `sectors/${sector}`;
}

export function uniqueSectors(values: readonly string[] | undefined): SectorID[] {
  const out: SectorID[] = [];
  for (const value of values ?? []) {
    if (!isSectorID(value) || out.includes(value)) continue;
    out.push(value);
    if (out.length === MAX_PARALLEL_AGENTS) break;
  }
  return out;
}

export function planDispatch(input: {
  complexity: ComplexityTier;
  sector: SectorID;
  sectors?: readonly string[];
}): DispatchPlan {
  const primary = isSectorID(input.sector) ? input.sector : "coding";
  if (input.complexity !== "High") {
    return { mode: "fast-path", subagents: [toSectorAgent(primary)] };
  }
  const named = uniqueSectors([primary, ...(input.sectors ?? [])]);
  if (named.length < 2) {
    return { mode: "serial", subagents: [toSectorAgent(primary)] };
  }
  return {
    mode: "parallel",
    subagents: named.map(toSectorAgent),
  };
}

/** Payload injected for the orchestrator. The agent list comes from planDispatch, not the model. */
export function triagePayload(routed: {
  sector: string;
  complexity: string;
  profile: string;
  sectors?: readonly string[];
  qualityObligation?: string;
}): TriagePayload {
  const complexity: ComplexityTier = routed.complexity === "High" ? "High" : "Low";
  const sector = isSectorID(routed.sector) ? routed.sector : "coding";
  const plan = planDispatch({ complexity, sector, sectors: routed.sectors });
  const payload: TriagePayload = {
    sector,
    complexity,
    profile: routed.profile,
    dispatch: plan.mode,
    subagents: plan.subagents,
  };
  if (routed.qualityObligation && routed.qualityObligation !== "none") {
    payload.qualityObligation = routed.qualityObligation;
  }
  return payload;
}
