/**
 * SuperQuantumAGI - Layer-0 Zero-LLM Router
 * 0 token, < 10ms deterministic early-exit router (PRD §4.1).
 */

import type { Layer0Decision, SectorID } from "../harness/io-schema/types.ts";

interface RegexRule {
  pattern: RegExp;
  sector: SectorID;
  defaultComplexity: "Low" | "High";
  defaultProfile: "Default" | "Pentest" | "ReAnalysis";
}

const REGEX_RULES: RegexRule[] = [
  // Sector 3: Reverse Engineering (strong keywords)
  {
    pattern: /\b(decompile|ghidra|idapro|jadx|frida|apktool|disassembler|radare2|gdb-peda|binary-patch)\b/i,
    sector: "reverse-engineering",
    defaultComplexity: "High",
    defaultProfile: "ReAnalysis",
  },
  // Sector 4: Pentest / C2 / Security Audit
  {
    pattern: /\b(pentest|metasploit|c2-implant|privilege-escalation|port-scan|nmap-vuln|sqlmap|burp)\b/i,
    sector: "security-pentest",
    defaultComplexity: "High",
    defaultProfile: "Pentest",
  },
  // Sector 5: OSINT / Geospatial
  {
    pattern: /\b(geolocate|osint|satellite-imagery|coordinates|imint|leafmap|earth-engine)\b/i,
    sector: "osint",
    defaultComplexity: "Low",
    defaultProfile: "Default",
  },
  // Sector 6: Motion / Video / Animation
  {
    pattern: /\b(remotion|gsap|manim|motion-design|video-render|lottie|hyperframes)\b/i,
    sector: "motion-media",
    defaultComplexity: "High",
    defaultProfile: "Default",
  },
  // Sector 7: Data / Document / CAD
  {
    pattern: /\b(docx|pptx|xlsx|pdf-parse|markitdown|text-to-cad|freecad|step-file|n8n-workflow)\b/i,
    sector: "data-doc-cad",
    defaultComplexity: "Low",
    defaultProfile: "Default",
  },
  // Sector 8: Research / Ideation / Hackathon
  {
    pattern: /\b(arxiv|literature-review|paper-search|deep-research|hackathon-winner|ideation-matrix)\b/i,
    sector: "research",
    defaultComplexity: "High",
    defaultProfile: "Default",
  },
  // Sector 9: Writing / Productivity / Anti-Slop
  {
    pattern: /\b(humanize|anti-slop|unslop|copywrite|proofread|technical-writing|paper-draft)\b/i,
    sector: "writing",
    defaultComplexity: "Low",
    defaultProfile: "Default",
  },
  // Sector 10: Career
  {
    pattern: /\b(resume-review|cv-tailor|job-search|cover-letter|mock-interview)\b/i,
    sector: "career",
    defaultComplexity: "Low",
    defaultProfile: "Default",
  },
  // Sector 11: DevOps / Infra / Finance
  {
    pattern: /\b(kubernetes|dockerfile|helm|terraform|github-action|openbb|stock-analysis|financial-statement)\b/i,
    sector: "devops-infra-finance",
    defaultComplexity: "Low",
    defaultProfile: "Default",
  },
  // Sector 2: short git operations. Kept specific so "commit to a design" does not match.
  {
    pattern: /\b(git\s+(?:commit|push|status|diff|pull|add)|commit\s+push|commit\s+and\s+push)\b/i,
    sector: "coding",
    defaultComplexity: "Low",
    defaultProfile: "Default",
  },
];

export function routeLayer0(prompt: string): Layer0Decision {
  const trimmed = prompt.trim();

  // 1. Slash commands match (instant handler)
  if (trimmed.startsWith("/")) {
    const parts = trimmed.split(/\s+/);
    const command = parts[0].toLowerCase();

    switch (command) {
      case "/audit":
        return {
          matched: true,
          type: "slash_command",
          command: "/audit",
          sector: "orchestration-quality",
          complexity: "Low",
          profile: "Default",
        };
      case "/pentest":
        return {
          matched: true,
          type: "slash_command",
          command: "/pentest",
          sector: "security-pentest",
          complexity: "High",
          profile: "Pentest",
        };
      case "/start":
      case "/status":
      case "/resume":
      case "/sync":
        return {
          matched: true,
          type: "slash_command",
          command,
          sector: "orchestration-quality",
          complexity: "Low",
          profile: "Default",
        };
      default:
        break;
    }
  }

  // 2. Strong regex / keyword match
  for (const rule of REGEX_RULES) {
    if (rule.pattern.test(trimmed)) {
      return {
        matched: true,
        type: "keyword_regex",
        sector: rule.sector,
        complexity: rule.defaultComplexity,
        profile: rule.defaultProfile,
        matchedPattern: rule.pattern.source,
      };
    }
  }

  // No strong early-exit match -> drop through to Layer-1 triage
  return {
    matched: false,
  };
}
