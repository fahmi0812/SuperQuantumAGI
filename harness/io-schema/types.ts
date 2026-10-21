/**
 * SuperQuantumAGI - I/O Schema & Contracts
 * Pure native TypeScript schemas matching PRD §5, §8, §11.
 */

export type SectorID =
  | "orchestration-quality"
  | "coding"
  | "reverse-engineering"
  | "security-pentest"
  | "osint"
  | "motion-media"
  | "data-doc-cad"
  | "research"
  | "writing"
  | "career"
  | "devops-infra-finance";

export type ComplexityTier = "Low" | "High";
export type ProfileTier = "Default" | "Pentest" | "ReAnalysis";

export interface Layer0Decision {
  matched: boolean;
  type?: "slash_command" | "keyword_regex";
  command?: string;
  sector?: SectorID;
  complexity?: ComplexityTier;
  profile?: ProfileTier;
  matchedPattern?: string;
}

export interface Layer1TriageOutput {
  sector: SectorID;
  complexity: ComplexityTier;
  profile: ProfileTier;
  intentVsTask: {
    surfaceRequest: string;
    underlyingIntent: string;
    isEmergencyPatch: boolean;
  };
  reasoning: string;
}

export interface DoneGateInput {
  commandExitCode: number;
  expectedArtifacts: string[];
  testCommandExitCode?: number | null;
  testsGreen?: boolean;
  actualArtifactsCheck?: (path: string) => boolean;
}

export interface DoneGateResult {
  isDone: boolean;
  exitCodeOk: boolean;
  artifactsExist: boolean;
  missingArtifacts: string[];
  testsPassed: boolean;
  failureReason?: string;
}

export interface AntiSpinState {
  taskId: string;
  currentIteration: number;
  maxIterations: 3; // hardcoded max 3 iterations
  consecutiveFailures: number;
  circuitBreakerTripped: boolean;
  history: Array<{
    iteration: number;
    timestamp: number;
    doneResult: DoneGateResult;
  }>;
}

export interface RootCauseCheckResult {
  isRootCause: boolean;
  isSymptomOnly: boolean;
  symptomExplanation: string;
  patternFoundInOtherModules: string[];
  blastRadius: "low" | "medium" | "high";
  requiresOperatorConsent: boolean;
}

export interface PentestConsentVerification {
  valid: boolean;
  reason?: string;
  authorizedBy?: string;
  allowedTargets?: string[];
  disallowedTargets?: string[];
  consentToken?: string;
}
