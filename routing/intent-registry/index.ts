/**
 * SuperQuantumAGI - Intent Registry (1-to-1 Per Sector) & Tie-Breaker
 * Ensures accurate skill selection without global 1-of-120 scoring (PRD §4.3 & §6.13).
 */

import type { SectorID } from "../../harness/io-schema/types.ts";

export interface SkillEntry {
  id: string;
  name: string;
  intentKey: string;
  tier: "T1" | "T2" | "T3";
  description: string;
}

export const SECTOR_SKILL_REGISTRY: Record<SectorID, SkillEntry[]> = {
  "orchestration-quality": [
    { id: "dispatching-parallel-agents", name: "Dispatching Parallel Agents", intentKey: "fanout_independent_tasks", tier: "T1", description: "Dispatches independent tasks in parallel" },
    { id: "parallel-agents", name: "Parallel Agents", intentKey: "fanout_domain_specialists", tier: "T1", description: "Coordinates specialized agents across domains" },
    { id: "subagent-driven-development", name: "Subagent Driven Development", intentKey: "sequential_subagent_review", tier: "T1", description: "Step-by-step subagent execution with review" },
    { id: "planning-with-files", name: "Planning With Files", intentKey: "file_based_task_progress", tier: "T1", description: "Tracks task plans and findings in markdown" },
    { id: "unified-done-gate", name: "Unified Done-Gate", intentKey: "verify_completion_gate", tier: "T1", description: "Deterministic check for task completion" },
    { id: "anti-spin", name: "Anti-Spin Circuit Breaker", intentKey: "prevent_runaway_loops", tier: "T1", description: "Circuit breaker stopping runs at max 3 iterations" },
  ],
  "coding": [
    { id: "codebase-design", name: "Codebase Design", intentKey: "architectural_code_design", tier: "T1", description: "Designs modular clean architecture" },
    { id: "diagnosing-bugs", name: "Diagnosing Bugs", intentKey: "systematic_root_cause_diagnosis", tier: "T1", description: "Investigates bugs before proposing patches" },
    { id: "matt-code-review", name: "Matt Code Review", intentKey: "strict_typescript_review", tier: "T1", description: "Code review with strict type safety" },
    { id: "tdd", name: "Test-Driven Development", intentKey: "test_first_implementation", tier: "T1", description: "Writes tests before implementation" },
    { id: "playwright-qa", name: "Playwright QA", intentKey: "browser_e2e_testing", tier: "T1", description: "End-to-end browser automation and testing" },
  ],
  "reverse-engineering": [
    { id: "reverse-skill", name: "Reverse Skill", intentKey: "re_router_primary", tier: "T1", description: "Primary router for binary and app decompilation" },
    { id: "hypeking", name: "Hypeking Submodule", intentKey: "android_apk_hooking", tier: "T1", description: "Android APK reverse engineering and Frida hooks" },
    { id: "rea", name: "REA", intentKey: "binary_decompilation_analysis", tier: "T1", description: "Native binary disassembler analysis" },
    { id: "universal-modder", name: "Universal Modder", intentKey: "binary_patching_modding", tier: "T1", description: "Modifies and patches compiled binaries" },
  ],
  "security-pentest": [
    { id: "full-audit-keamanan", name: "Full Audit Keamanan", intentKey: "comprehensive_sec_audit", tier: "T1", description: "Full white-box security audit" },
    { id: "cli-pentestv1", name: "CLI Pentest V1", intentKey: "cli_penetration_testing", tier: "T1", description: "CLI penetration testing toolkit" },
    { id: "strix", name: "Strix", intentKey: "strix_harness_audit", tier: "T2", description: "External harness pointer for audit" },
    { id: "deepteam", name: "DeepTeam", intentKey: "red_team_ci_offline", tier: "T2", description: "Red team evaluation for CI and offline testing" },
  ],
  "osint": [
    { id: "geo-sleuth", name: "Geo Sleuth", intentKey: "image_geolocation_recon", tier: "T1", description: "Geolocates images and coordinates" },
    { id: "leafmap", name: "Leafmap", intentKey: "geospatial_satellite_analysis", tier: "T1", description: "Analyzes geospatial raster/vector data" },
  ],
  "motion-media": [
    { id: "claude-motion-design", name: "Claude Motion Design", intentKey: "motion_code_render", tier: "T1", description: "HTML+Playwright+ffmpeg motion rendering" },
    { id: "claude-remotion-skill", name: "Claude Remotion Skill", intentKey: "react_remotion_video", tier: "T1", description: "Programmatic React video generation" },
    { id: "gsap-skills", name: "GSAP Skills", intentKey: "web_gsap_animation", tier: "T1", description: "Interactive GSAP animations" },
    { id: "manim", name: "Manim", intentKey: "math_code_animation", tier: "T1", description: "Mathematical and programmatic Manim video" },
    { id: "hyperframes", name: "Hyperframes", intentKey: "generative_video_frames", tier: "T1", description: "Frame-based programmatic motion generation" },
  ],
  "data-doc-cad": [
    { id: "markitdown", name: "Markitdown", intentKey: "convert_doc_to_markdown", tier: "T1", description: "Converts diverse office files to markdown" },
    { id: "docx-official", name: "Docx Official", intentKey: "generate_word_documents", tier: "T1", description: "Generates formatted Word documents" },
    { id: "xlsx-official", name: "Xlsx Official", intentKey: "generate_excel_spreadsheets", tier: "T1", description: "Generates Excel spreadsheets" },
    { id: "pdf-official", name: "Pdf Official", intentKey: "generate_pdf_reports", tier: "T1", description: "Generates styled PDF files" },
    { id: "text-to-cad", name: "Text-to-CAD", intentKey: "parametric_3d_cad", tier: "T1", description: "Generates 3D CAD models from text" },
  ],
  "research": [
    { id: "deep-research", name: "Deep Research", intentKey: "deep_multi_source_research", tier: "T1", description: "Synthesizes multi-source academic/web research" },
    { id: "deep-research-team", name: "Deep Research Team", intentKey: "collaborative_research_team", tier: "T1", description: "Team-based deep investigation" },
    { id: "hackathon-winner-thinking", name: "Hackathon Winner Thinking", intentKey: "hackathon_ideation_differentiation", tier: "T1", description: "High-impact ideation, prize criteria alignment, and rapid pitch structuring" },
  ],
  "writing": [
    { id: "humanizer", name: "Humanizer", intentKey: "natural_human_writing", tier: "T1", description: "Polishes text to remove AI voice slop" },
    { id: "install-anti-slop", name: "Anti-Slop", intentKey: "strip_slop_buzzwords", tier: "T1", description: "Strips corporate AI filler words" },
    { id: "technical-writing", name: "Technical Writing", intentKey: "clear_software_documentation", tier: "T1", description: "Writes concise technical developer guides" },
    { id: "penulis-ilmiah", name: "Penulis Ilmiah", intentKey: "academic_paper_prose", tier: "T1", description: "Formal scientific writing in Indonesian and English" },
  ],
  "career": [
    { id: "ai-job-search", name: "AI Job Search", intentKey: "career_cv_interview_prep", tier: "T1", description: "Tailors CVs, cover letters, and interview coaching" },
  ],
  "devops-infra-finance": [
    { id: "full-performance-audit", name: "Full Performance Audit", intentKey: "infrastructure_performance_audit", tier: "T1", description: "Audits cloud, container, and database performance" },
  ],
};

/**
 * Resolves a skill within a sector based on an intent string.
 * Uses 1-to-1 matching, tie-breakers, and falls back deterministically to 'manual'.
 */
export function resolveSkillInSector(sector: SectorID, queryIntent: string): { skillId: string; status: "exact" | "tie_break" | "manual_fallback" } {
  const skills = SECTOR_SKILL_REGISTRY[sector] || [];
  const normalized = queryIntent.toLowerCase();

  // 1. Exact intent-key match
  const exact = skills.find((s) => s.intentKey === normalized);
  if (exact) {
    return { skillId: exact.id, status: "exact" };
  }

  // 2. Tie-break rules (PRD §6.13)
  if (sector === "motion-media") {
    if (normalized.includes("react") || normalized.includes("remotion")) {
      return { skillId: "claude-remotion-skill", status: "tie_break" };
    }
    if (normalized.includes("math") || normalized.includes("formula")) {
      return { skillId: "manim", status: "tie_break" };
    }
    return { skillId: "claude-motion-design", status: "tie_break" };
  }

  if (sector === "reverse-engineering") {
    if (normalized.includes("apk") || normalized.includes("android") || normalized.includes("frida")) {
      return { skillId: "hypeking", status: "tie_break" };
    }
    return { skillId: "reverse-skill", status: "tie_break" };
  }

  if (sector === "research") {
    if (normalized.includes("hackathon") || normalized.includes("pitch") || normalized.includes("idea")) {
      return { skillId: "hackathon-winner-thinking", status: "tie_break" };
    }
    return { skillId: "deep-research", status: "tie_break" };
  }

  // 3. Deterministic fallback to manual
  const firstSkill = skills[0];
  return {
    skillId: firstSkill ? firstSkill.id : "manual",
    status: "manual_fallback",
  };
}
