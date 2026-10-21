import type { ComplexityTier, SectorID } from "../harness/io-schema/types.ts";

export interface DispatchPlan {
  mode: "fast-path" | "fan-out";
  subagents: string[];
}

export function planDispatch(input: { complexity: ComplexityTier; sector: SectorID }): DispatchPlan {
  const sectorAgent = `sectors/${input.sector}`;
  if (input.complexity === "Low") {
    return { mode: "fast-path", subagents: [sectorAgent] };
  }
  return {
    mode: "fan-out",
    subagents: [sectorAgent, "sectors/orchestration-quality"],
  };
}
