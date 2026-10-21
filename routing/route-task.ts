import type { Layer1TriageOutput } from "../harness/io-schema/types.ts";
import { buildTriagePrompt, parseTriageOutput } from "./layer1-triage.ts";
import { routeLayer0 } from "./layer0-zero-llm.ts";

export interface RouteTaskResult extends Layer1TriageOutput {
  layer: "layer0" | "layer1";
  status: "matched" | "manual_fallback";
  qualityObligation?: "none" | "post-push";
  slashOnly?: boolean;
}

export interface RouteTaskOptions {
  /** Exactly one active-model completion. Not called on Layer-0 early-exit. */
  complete?: (triagePrompt: string) => Promise<string> | string;
}

export async function routeTask(prompt: string, options: RouteTaskOptions = {}): Promise<RouteTaskResult> {
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
      qualityObligation: early.qualityObligation,
      slashOnly: early.slashOnly,
    };
  }

  if (!options.complete) {
    throw new Error("Layer-1 triage requires exactly one active-model completer. Refusing a silent local router.");
  }

  const raw = await options.complete(buildTriagePrompt(prompt));
  const parsed = parseTriageOutput(raw);
  const unparseable = parsed.reasoning.startsWith("Fallback triggered");
  return {
    ...parsed,
    layer: "layer1",
    status: unparseable ? "manual_fallback" : "matched",
  };
}
