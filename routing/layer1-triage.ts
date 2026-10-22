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
   - "Low": one step, one sector. Dispatch will be fast-path.
   - "High": multi-step. This is serial unless SECTORS names 2 or 3 sectors that can work at the same time. High does not mean fan-out.

3. PROFILE:
   - "Default": standard operations
   - "Pentest": offensive security/C2 simulation (requires explicit authorization)

4. SECTORS:
   - Omit when one sector is enough.
   - Otherwise list 2 or 3 sector ids that must each produce evidence in parallel.
   - Do not add orchestration-quality unless the task itself is orchestration.
   - Sequential steps in one sector stay a single sector. Do not pad the list.

5. INTENT_VS_TASK:
   - surfaceRequest: summary of explicit user prompt
   - underlyingIntent: root goal to achieve
   - isEmergencyPatch: true if production outage/quick hotfix requested

Output strictly valid JSON with this shape:
{
  "sector": "<one of the 11 sectors>",
  "complexity": "Low" | "High",
  "profile": "Default" | "Pentest",
  "sectors": ["<sector>", "<sector>"],
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

function parseNamedSectors(raw: unknown, primary: SectorID): SectorID[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const named: SectorID[] = [];
  for (const item of raw) {
    if (typeof item !== "string" || !SECTORS_LIST.includes(item as SectorID) || item === primary) continue;
    if (!named.includes(item as SectorID)) named.push(item as SectorID);
  }
  if (named.length === 0) return undefined;
  return [primary, ...named].slice(0, 3);
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
    const sectors = parseNamedSectors(parsed.sectors, sector);

    return {
      sector,
      complexity,
      profile,
      ...(sectors ? { sectors } : {}),
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
