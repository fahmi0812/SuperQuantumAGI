/**
 * SuperQuantumAGI - Layer-1 Triage Classifier
 * Fast single LLM classification into 1 of 11 sectors + complexity + profile (PRD §4.1).
 */

import type { Layer1TriageOutput, ProfileTier, SectorID } from "../harness/io-schema/types.ts";

export const SECTORS_LIST: SectorID[] = [
  "orchestration-quality",
  "coding",
  "reverse-engineering",
  "security-pentest",
  "osint",
  "motion-media",
  "data-doc-cad",
  "research",
  "writing",
  "career",
  "devops-infra-finance",
];

export function buildTriagePrompt(userPrompt: string): string {
  return `You are the SuperQuantumAGI Layer-1 Triage Classifier.
Classify the following user task into:
1. SECTOR: exactly one of:
   - orchestration-quality (meta-planning, loops, multi-agent coordination)
   - coding (software engineering, bug diagnosis, tests, web/mobile)
   - reverse-engineering (decompilation, binary analysis, hooking, apk/elf)
   - security-pentest (vulnerability assessment, audit, red-team)
   - osint (geospatial, satellite imagery, public intelligence)
   - motion-media (video rendering, remotion, gsap, animation, manim)
   - data-doc-cad (document conversion, pdf/docx/xlsx, 3D CAD, n8n)
   - research (deep literature review, paper synthesis, hackathon ideation)
   - writing (technical writing, humanization, anti-slop, documentation)
   - career (resume review, job search tailoring, interview prep)
   - devops-infra-finance (CI/CD, docker, k8s, financial analysis)

2. COMPLEXITY:
   - "Low": simple, single-step, fast-path (1 subagent)
   - "High": multi-step, complex, requires fan-out / parallel coordination

3. PROFILE:
   - "Default": standard operations
   - "Pentest": offensive security/C2 simulation (requires explicit authorization)

4. INTENT_VS_TASK:
   - surfaceRequest: summary of explicit user prompt
   - underlyingIntent: root goal to achieve
   - isEmergencyPatch: true if production outage/quick hotfix requested

Output strictly valid JSON with this shape:
{
  "sector": "<one of the 11 sectors>",
  "complexity": "Low" | "High",
  "profile": "Default" | "Pentest",
  "intentVsTask": {
    "surfaceRequest": "...",
    "underlyingIntent": "...",
    "isEmergencyPatch": false
  },
  "reasoning": "brief explanation"
}

Task:
${userPrompt}`;
}

export function parseTriageOutput(rawResponse: string): Layer1TriageOutput {
  try {
    // Strip markdown code fences if present
    const cleaned = rawResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    let sector: SectorID = "coding";
    if (SECTORS_LIST.includes(parsed.sector)) {
      sector = parsed.sector;
    }

    const complexity = parsed.complexity === "High" ? "High" : "Low";
    let profile: ProfileTier = "Default";
    if (parsed.profile === "Pentest") profile = "Pentest";
    if (parsed.profile === "ReAnalysis") profile = "ReAnalysis";
    if (sector === "reverse-engineering") profile = "ReAnalysis";

    return {
      sector,
      complexity,
      profile,
      intentVsTask: {
        surfaceRequest: parsed.intentVsTask?.surfaceRequest || "",
        underlyingIntent: parsed.intentVsTask?.underlyingIntent || "",
        isEmergencyPatch: Boolean(parsed.intentVsTask?.isEmergencyPatch),
      },
      reasoning: parsed.reasoning || "",
    };
  } catch (err) {
    // Deterministic fallback if parsing fails
    return {
      sector: "coding",
      complexity: "Low",
      profile: "Default",
      intentVsTask: {
        surfaceRequest: rawResponse.slice(0, 100),
        underlyingIntent: "fallback-default",
        isEmergencyPatch: false,
      },
      reasoning: "Fallback triggered due to unparseable triage response",
    };
  }
}
