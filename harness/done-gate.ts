/**
 * SuperQuantumAGI - Unified Done-Gate
 * Deterministic quality gate replacing complex LLM-eval loops (PRD §5.1).
 *
 * DONE if and only if:
 *   1. exit_code === 0        (Command execution succeeded)
 *   2. target artifacts exist (Output files exist and are non-empty)
 *   3. tests green            (Relevant unit/integration test suite passed)
 */

import * as fs from "fs";
import type { DoneGateInput, DoneGateResult } from "./io-schema/types.ts";

export function evaluateDoneGate(input: DoneGateInput): DoneGateResult {
  const exitCodeOk = input.commandExitCode === 0;

  // Check required artifacts
  const missingArtifacts: string[] = [];
  for (const artifact of input.expectedArtifacts) {
    if (input.actualArtifactsCheck) {
      if (!input.actualArtifactsCheck(artifact)) {
        missingArtifacts.push(artifact);
      }
    } else {
      try {
        if (!fs.existsSync(artifact)) {
          missingArtifacts.push(artifact);
        } else {
          const stat = fs.statSync(artifact);
          if (stat.size === 0) {
            missingArtifacts.push(`${artifact} (empty file)`);
          }
        }
      } catch {
        missingArtifacts.push(artifact);
      }
    }
  }

  const artifactsExist = missingArtifacts.length === 0;

  // Check tests
  let testsPassed = true;
  if (input.testCommandExitCode !== undefined && input.testCommandExitCode !== null) {
    testsPassed = input.testCommandExitCode === 0;
  } else if (input.testsGreen !== undefined) {
    testsPassed = input.testsGreen;
  }

  const isDone = exitCodeOk && artifactsExist && testsPassed;

  let failureReason: string | undefined;
  if (!isDone) {
    const reasons: string[] = [];
    if (!exitCodeOk) reasons.push(`Command exit code was ${input.commandExitCode} (expected 0)`);
    if (!artifactsExist) reasons.push(`Missing or empty target artifacts: [${missingArtifacts.join(", ")}]`);
    if (!testsPassed) reasons.push("Test suite did not pass (testsGreen is false)");
    failureReason = reasons.join("; ");
  }

  return {
    isDone,
    exitCodeOk,
    artifactsExist,
    missingArtifacts,
    testsPassed,
    failureReason,
  };
}
