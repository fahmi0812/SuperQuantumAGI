import type { Layer1TriageOutput } from "../harness/io-schema/types.ts";
import { classifyDeterministic, type ClassifyResult } from "./classify.ts";
import { routeLayer0 } from "./layer0-zero-llm.ts";

export interface RouteTaskResult extends Layer1TriageOutput {
  layer: "layer0" | "layer1";
  status: ClassifyResult["status"];
}

export function routeTask(prompt: string): RouteTaskResult {
  const early = routeLayer0(prompt);
  if (early.matched && early.sector && early.complexity && early.profile) {
    const profile = early.sector === "reverse-engineering" ? "ReAnalysis" : early.profile;
    return {
      sector: early.sector,
      complexity: early.complexity,
      profile,
      layer: "layer0",
      status: "matched",
      intentVsTask: {
        surfaceRequest: prompt.slice(0, 180),
        underlyingIntent: early.sector,
        isEmergencyPatch: false,
      },
      reasoning: `layer0:${early.type || "matched"}`,
    };
  }

  const classified = classifyDeterministic(prompt);
  return { ...classified, layer: "layer1" };
}
