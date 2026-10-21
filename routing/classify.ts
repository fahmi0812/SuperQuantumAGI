/**
 * Deterministic Layer-1 classifier used when Layer-0 does not early-exit
 * and when no model call is available. Ties fall back to manual.
 */

import type { ComplexityTier, Layer1TriageOutput, ProfileTier, SectorID } from "../harness/io-schema/types.ts";

interface ClassRule {
  sector: SectorID;
  profile: ProfileTier;
  complexity: ComplexityTier;
  weight: number;
  pattern: RegExp;
}

const RULES: ClassRule[] = [
  {
    sector: "reverse-engineering",
    profile: "ReAnalysis",
    complexity: "High",
    weight: 10,
    pattern: /\b(decompile|ghidra|idapro|jadx|frida|apk|apktool|disassembl)/i,
  },
  {
    sector: "security-pentest",
    profile: "Pentest",
    complexity: "High",
    weight: 9,
    pattern: /\b(pentest|metasploit|c2-implant|privilege-escalation|port-scan|sqlmap)\b/i,
  },
  {
    sector: "security-pentest",
    profile: "Default",
    complexity: "High",
    weight: 8,
    pattern: /\b(security audit|white-box|sql injection|vulnerabilit)/i,
  },
  {
    sector: "orchestration-quality",
    profile: "Default",
    complexity: "High",
    weight: 9,
    pattern: /\b(orchestrat\w*|fan-out|subagents?)\b/i,
  },
  {
    sector: "osint",
    profile: "Default",
    complexity: "Low",
    weight: 8,
    pattern: /\b(geolocate|osint|satellite|leafmap|coordinates|sentinel)\b/i,
  },
  {
    sector: "motion-media",
    profile: "Default",
    complexity: "High",
    weight: 8,
    pattern: /\b(ffmpeg|remotion|gsap|manim|kinetic|typography|video)\b/i,
  },
  {
    sector: "data-doc-cad",
    profile: "Default",
    complexity: "Low",
    weight: 7,
    pattern: /\b(docx|pptx|xlsx|pdf|excel|markitdown|spreadsheet)\b/i,
  },
  {
    sector: "research",
    profile: "Default",
    complexity: "High",
    weight: 8,
    pattern: /\b(arxiv|literature|paper-search|deep-research|hackathon)\b/i,
  },
  {
    sector: "writing",
    profile: "Default",
    complexity: "Low",
    weight: 7,
    pattern: /\b(humanize|anti-slop|buzzwords?|robotic|rewrite this documentation)\b/i,
  },
  {
    sector: "career",
    profile: "Default",
    complexity: "Low",
    weight: 8,
    pattern: /\b(resume|cover letter|interview)\b/i,
  },
  {
    sector: "devops-infra-finance",
    profile: "Default",
    complexity: "Low",
    weight: 8,
    pattern: /\b(kubernetes|dockerfile|helm|terraform|github action)\b/i,
  },
  {
    sector: "coding",
    profile: "Default",
    complexity: "Low",
    weight: 6,
    pattern: /\b(null pointer|jest|exception|bugfix|refactor)\b/i,
  },
];

export interface ClassifyResult extends Layer1TriageOutput {
  status: "matched" | "manual_fallback";
}

export function classifyDeterministic(prompt: string): ClassifyResult {
  const hits = RULES.filter((rule) => rule.pattern.test(prompt));
  if (hits.length === 0) {
    return {
      sector: "coding",
      complexity: "Low",
      profile: "Default",
      status: "manual_fallback",
      intentVsTask: {
        surfaceRequest: prompt.slice(0, 180),
        underlyingIntent: "manual",
        isEmergencyPatch: false,
      },
      reasoning: "No deterministic sector rule matched; fallback is manual, not a confident coding route.",
    };
  }

  const bestWeight = Math.max(...hits.map((hit) => hit.weight));
  const best = hits.filter((hit) => hit.weight === bestWeight);
  const sectors = new Set(best.map((hit) => hit.sector));
  if (sectors.size !== 1) {
    return {
      sector: "coding",
      complexity: "Low",
      profile: "Default",
      status: "manual_fallback",
      intentVsTask: {
        surfaceRequest: prompt.slice(0, 180),
        underlyingIntent: "manual",
        isEmergencyPatch: false,
      },
      reasoning: `Tie between ${[...sectors].join(", ")}; fallback is manual.`,
    };
  }

  const winner = best[0];
  let profile = winner.profile;
  // Reverse engineering never escalates into the offensive profile.
  if (winner.sector === "reverse-engineering") profile = "ReAnalysis";

  return {
    sector: winner.sector,
    complexity: winner.complexity,
    profile,
    status: "matched",
    intentVsTask: {
      surfaceRequest: prompt.slice(0, 180),
      underlyingIntent: winner.sector,
      isEmergencyPatch: /\b(outage|hotfix|production down)\b/i.test(prompt),
    },
    reasoning: `deterministic-layer1:${winner.sector}`,
  };
}
