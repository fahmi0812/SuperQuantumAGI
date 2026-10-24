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
    { id: "agent-architecture-audit", name: "Agent Architecture Audit", intentKey: "agent_architecture_audit", tier: "T1", description: "Diagnose agent-loop and context failures. Not a secrets audit." },
    { id: "honey", name: "Honey", intentKey: "dense_handoff_prose", tier: "T2", description: "Dense agent-to-agent handoff. Does not replace anti-spin." },
    { id: "brainstorming", name: "Brainstorming", intentKey: "explore_before_commit", tier: "T2", description: "Explore missing intent before a plan or commit" },
    { id: "writing-plans", name: "Writing Plans", intentKey: "write_implementation_plan", tier: "T2", description: "Bite-sized implementation plan from a spec" },
    { id: "verification-before-completion", name: "Verification Before Completion", intentKey: "verify_before_claim_done", tier: "T2", description: "Defer to done-gate before claiming complete. Does not invent FACT rows." },
  ],
  "coding": [
    { id: "codebase-design", name: "Codebase Design", intentKey: "architectural_code_design", tier: "T1", description: "Designs modular clean architecture" },
    { id: "diagnosing-bugs", name: "Diagnosing Bugs", intentKey: "systematic_root_cause_diagnosis", tier: "T1", description: "Investigates bugs before proposing patches" },
    { id: "systematic-debugging", name: "Systematic Debugging", intentKey: "systematic_debug_adapter", tier: "T2", description: "Adapter to diagnosing-bugs and root-cause-gate. Not a second procedure." },
    { id: "matt-code-review", name: "Matt Code Review", intentKey: "strict_typescript_review", tier: "T1", description: "Code review with strict type safety" },
    { id: "tdd", name: "Test-Driven Development", intentKey: "test_first_implementation", tier: "T1", description: "Writes tests before implementation" },
    { id: "playwright-qa", name: "Playwright QA", intentKey: "browser_e2e_testing", tier: "T1", description: "End-to-end browser automation and testing" },
    { id: "api-design", name: "API Design", intentKey: "rest_api_design", tier: "T1", description: "REST resource names, status codes, pagination, and versioning" },
    { id: "contract-first", name: "Contract First", intentKey: "contract_before_implementation", tier: "T1", description: "Locks the API contract before implementation starts" },
    { id: "eval-harness", name: "Eval Harness", intentKey: "eval_before_trust", tier: "T1", description: "Requires an eval set before an agent change is trusted" },
    { id: "gh-axi", name: "gh-axi", intentKey: "github_ci_ops", tier: "T1", description: "GitHub issues, PRs, and Actions checks after push" },
    { id: "chrome-devtools-axi", name: "Chrome DevTools Axi", intentKey: "chrome_devtools_failure_inspect", tier: "T1", description: "Inspect an observed browser failure. Not exploratory QA." },
    { id: "grill-with-docs", name: "Grill With Docs", intentKey: "grill_design_with_docs", tier: "T1", description: "Interview a plan into glossary and ADRs" },
    { id: "to-spec", name: "To Spec", intentKey: "spec_from_conversation", tier: "T1", description: "Turn an agreed conversation into a local spec" },
    { id: "to-tickets", name: "To Tickets", intentKey: "tickets_from_spec", tier: "T1", description: "Break a spec into tracer-bullet tickets" },
    { id: "domain-modeling", name: "Domain Modeling", intentKey: "domain_model_seams", tier: "T1", description: "Sharpen domain terms, glossary, and ADRs" },
    { id: "click-path-audit", name: "Click Path Audit", intentKey: "click_path_handler_audit", tier: "T1", description: "Trace controls through handlers and shared-store writes" },
    { id: "mongodb-ops", name: "MongoDB Ops", intentKey: "mongodb_schema_ops", tier: "T1", description: "MongoDB data modeling, schemas, and queries in application code" },
    { id: "supabase-ops", name: "Supabase Ops", intentKey: "supabase_backend_ops", tier: "T1", description: "Supabase client integration, RLS, and backend routes in application code" },
    { id: "vercel-ops", name: "Vercel Ops", intentKey: "vercel_deploy_ops", tier: "T1", description: "Next.js routing, edge runtime, and Vercel configuration in application code" },
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
    { id: "diagram-design", name: "Diagram Design", intentKey: "html_svg_diagram_design", tier: "T1", description: "HTML and SVG diagrams from a named diagram type" },
    { id: "deck-design", name: "Deck Design", intentKey: "consulting_slide_deck", tier: "T1", description: "Slide deck structure before any pptx bytes are written" },
    { id: "json-render", name: "JSON Render", intentKey: "json_driven_ui_render", tier: "T1", description: "Renders a declared JSON spec instead of freehand UI" },
  ],
  "data-doc-cad": [
    { id: "markitdown", name: "Markitdown", intentKey: "convert_doc_to_markdown", tier: "T1", description: "Converts diverse office files to markdown" },
    { id: "docx-official", name: "Docx Official", intentKey: "generate_word_documents", tier: "T1", description: "Generates formatted Word documents" },
    { id: "xlsx-official", name: "Xlsx Official", intentKey: "generate_excel_spreadsheets", tier: "T1", description: "Generates Excel spreadsheets" },
    { id: "pdf-official", name: "Pdf Official", intentKey: "generate_pdf_reports", tier: "T1", description: "Generates styled PDF files" },
    { id: "text-to-cad", name: "Text-to-CAD", intentKey: "parametric_3d_cad", tier: "T1", description: "Generates 3D CAD models from text" },
    { id: "pptx-official", name: "Pptx Official", intentKey: "generate_pptx_decks", tier: "T1", description: "Builds a pptx from an outline. Upstream Anthropic text is not vendored." },
    { id: "pageindex", name: "PageIndex", intentKey: "index_long_documents", tier: "T1", description: "Builds a page tree for a long document before answering from it" },
    { id: "smartdoc", name: "SmartDoc", intentKey: "smartdoc_job", tier: "T1", description: "Per-job document intelligence, OCR, extraction, and verification" },
    { id: "smartbook-ingest", name: "SmartBook Ingest", intentKey: "smartbook_ingest", tier: "T1", description: "Compile and manage reusable knowledge SmartBooks" },
  ],
  "research": [
    { id: "deep-research", name: "Deep Research", intentKey: "deep_multi_source_research", tier: "T1", description: "Synthesizes multi-source academic/web research" },
    { id: "deep-research-team", name: "Deep Research Team", intentKey: "collaborative_research_team", tier: "T1", description: "Team-based deep investigation" },
    { id: "hackathon-winner-thinking", name: "Hackathon Winner Thinking", intentKey: "hackathon_ideation_differentiation", tier: "T1", description: "High-impact ideation, prize criteria alignment, and rapid pitch structuring" },
    { id: "nia-oracle", name: "Nia Oracle", intentKey: "nia_oracle_paired_research", tier: "T1", description: "Pointer to the nia research pair. Pin is the davila7 SHA. Do not vendor the agent file." },
  ],
  "writing": [
    { id: "humanizer", name: "Humanizer", intentKey: "natural_human_writing", tier: "T1", description: "Polishes text to remove AI voice slop" },
    { id: "install-anti-slop", name: "Anti-Slop", intentKey: "strip_slop_buzzwords", tier: "T1", description: "Strips corporate AI filler words" },
    { id: "technical-writing", name: "Technical Writing", intentKey: "clear_software_documentation", tier: "T1", description: "Writes concise technical developer guides" },
    { id: "penulis-ilmiah", name: "Penulis Ilmiah", intentKey: "academic_paper_prose", tier: "T1", description: "Formal scientific writing in Indonesian and English" },
    { id: "unslop", name: "Unslop", intentKey: "cut_ai_writing_tells", tier: "T1", description: "Cuts AI writing tells while keeping the original meaning" },
  ],
  "career": [
    { id: "ai-job-search", name: "AI Job Search", intentKey: "career_cv_interview_prep", tier: "T1", description: "Tailors CVs, cover letters, and interview coaching" },
  ],
  "devops-infra-finance": [
    { id: "full-performance-audit", name: "Full Performance Audit", intentKey: "infrastructure_performance_audit", tier: "T1", description: "Audits cloud, container, and database performance" },
    { id: "gh-axi", name: "gh-axi", intentKey: "github_actions_ci", tier: "T1", description: "Inspect GitHub Actions after a push" },
    { id: "mongodb-ops", name: "MongoDB Ops", intentKey: "mongodb_ops", tier: "T1", description: "MongoDB and Mongoose schemas, indexes, and aggregation" },
    { id: "supabase-ops", name: "Supabase Ops", intentKey: "supabase_ops", tier: "T1", description: "Supabase Postgres, migrations, RLS, and Auth contracts" },
    { id: "vercel-ops", name: "Vercel Ops", intentKey: "vercel_ops", tier: "T1", description: "Vercel hosting, vercel.json, edge routing, and preview URLs" },
    { id: "automation-audit-ops", name: "Automation Audit Ops", intentKey: "automation_audit_ops", tier: "T1", description: "Evidence-first inventory of live automations, cron, and CI" },
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
    if (normalized.includes("diagram")) {
      return { skillId: "diagram-design", status: "tie_break" };
    }
    if (normalized.includes("deck") || normalized.includes("slide")) {
      return { skillId: "deck-design", status: "tie_break" };
    }
    if (normalized.includes("json-render") || normalized.includes("json render")) {
      return { skillId: "json-render", status: "tie_break" };
    }
    return { skillId: "claude-motion-design", status: "tie_break" };
  }

  if (sector === "data-doc-cad") {
    if (normalized.includes("smartbook") || normalized.includes("jadikan buku") || normalized.includes("pelajari modul")) {
      return { skillId: "smartbook-ingest", status: "tie_break" };
    }
    if (normalized.includes("smartdoc") || normalized.includes("document contract") || normalized.includes("kerjakan soal")) {
      return { skillId: "smartdoc", status: "tie_break" };
    }
    if (normalized.includes("pptx") || normalized.includes("slide deck")) {
      return { skillId: "pptx-official", status: "tie_break" };
    }
    if (normalized.includes("pageindex") || normalized.includes("long document")) {
      return { skillId: "pageindex", status: "tie_break" };
    }
  }

  if (sector === "writing" && normalized.includes("unslop")) {
    return { skillId: "unslop", status: "tie_break" };
  }

  if (sector === "coding") {
    if (normalized.includes("contract-first") || normalized.includes("openapi")) {
      return { skillId: "contract-first", status: "tie_break" };
    }
    if (normalized.includes("api-design") || normalized.includes("rest api")) {
      return { skillId: "api-design", status: "tie_break" };
    }
    if (normalized.includes("eval-harness") || normalized.includes("eval harness")) {
      return { skillId: "eval-harness", status: "tie_break" };
    }
    if (normalized.includes("gh-axi") || normalized.includes("github ci") || normalized.includes("github_ci_ops")) {
      return { skillId: "gh-axi", status: "tie_break" };
    }
    if (normalized.includes("mongodb") || normalized.includes("mongoose") || normalized.includes("mongo")) {
      return { skillId: "mongodb-ops", status: "tie_break" };
    }
    if (normalized.includes("supabase") || normalized.includes("rls")) {
      return { skillId: "supabase-ops", status: "tie_break" };
    }
    if (normalized.includes("vercel")) {
      return { skillId: "vercel-ops", status: "tie_break" };
    }
  }

  if (sector === "devops-infra-finance") {
    if (normalized.includes("mongodb") || normalized.includes("mongoose") || normalized.includes("mongo")) {
      return { skillId: "mongodb-ops", status: "tie_break" };
    }
    if (normalized.includes("supabase") || normalized.includes("postgrest") || normalized.includes("rls")) {
      return { skillId: "supabase-ops", status: "tie_break" };
    }
    if (normalized.includes("vercel") || normalized.includes("edge routing") || normalized.includes("preview url")) {
      return { skillId: "vercel-ops", status: "tie_break" };
    }
    if (normalized.includes("automation") || normalized.includes("cron") || normalized.includes("inventory")) {
      return { skillId: "automation-audit-ops", status: "tie_break" };
    }
    if (normalized.includes("performance") || normalized.includes("audit") || normalized.includes("bottleneck")) {
      return { skillId: "full-performance-audit", status: "tie_break" };
    }
    if (normalized.includes("gh-axi") || normalized.includes("github") || normalized.includes("actions")) {
      return { skillId: "gh-axi", status: "tie_break" };
    }
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

  // 3. No exact key and no sector tie-break: do not guess the first skill.
  return {
    skillId: "manual",
    status: "manual_fallback",
  };
}
