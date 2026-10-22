/**
 * SuperQuantumAGI OpenCode plugin.
 * Enforces single-writer, NFR11, sector bwrap sandbox, and one Layer-1 model call.
 * Does not substring-match tool arguments: a grep/read for documentation must not
 * be treated as an offensive launch. Does not add a model router.
 */

import path from "node:path";
import { Plugin } from "@opencode/plugin";
import { isBwrapAvailable } from "../../../harness/sandbox/bwrap-command.cjs";
import {
  applyShellCreateBefore,
  isSectorAgent,
  notePendingShell,
  shellCommandFromInput,
} from "../../../harness/sandbox/sector-shell.cjs";
import {
  POST_PUSH_FACT_RELATIVE,
  POST_PUSH_REMINDER,
  isGitPushCommand,
  postPushFactSatisfied,
  readPostPushFact,
} from "../../../harness/post-push.ts";
import { createActiveModelCompleter } from "../../../routing/active-model.ts";
import { triagePayload } from "../../../routing/dispatch.ts";
import {
  DISPATCH_LEDGER_RELATIVE,
  emptyLedger,
  noteInvoked,
  notePlanned,
  writeLedger,
} from "../../../routing/dispatch-ledger.ts";
import { routeLayer0 } from "../../../routing/layer0-zero-llm.ts";
import { routeTask } from "../../../routing/route-task.ts";
import {
  OFFENSIVE_SERVERS,
  evaluateRuntimePermission,
  isPentestAuthorized,
} from "./policy.cjs";

const TRIAGE_MARK = "[superq-triage]";

interface TriageState {
  text: string;
  line?: string;
  pending?: Promise<void>;
}

const triageBySession = new Map<string, TriageState>();
const dispatchLedger = emptyLedger();
let ledgerDirectory: string | undefined;
let postPushPending = false;

function sessionIDFrom(event: { sessionID?: unknown; sessionId?: unknown }): string {
  const direct = event.sessionID ?? event.sessionId;
  if (typeof direct === "string" && direct.trim()) return direct.trim();
  const ids = [...triageBySession.keys()];
  return ids.length === 1 ? ids[0] : "unscoped";
}

function agentFromInput(input: unknown): string | null {
  if (!input || typeof input !== "object") return null;
  const raw = (input as { agent?: unknown; name?: unknown }).agent ?? (input as { name?: unknown }).name;
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

function persistDispatchLedger(directory: string | undefined): void {
  if (!directory) return;
  try {
    writeLedger(path.join(directory, DISPATCH_LEDGER_RELATIVE), dispatchLedger);
  } catch {
    // A ledger write must not fail the turn.
  }
}

function triageLine(
  sessionID: string,
  text: string,
  routed: {
    sector: string;
    complexity: string;
    profile: string;
    sectors?: readonly string[];
    qualityObligation?: string;
  },
): string {
  const payload = triagePayload(routed);
  notePlanned(dispatchLedger, sessionID, {
    plannedSector: payload.sector,
    dispatch: payload.dispatch,
    planned: payload.subagents,
    surface: text,
  });
  persistDispatchLedger(ledgerDirectory);
  return [
    "SuperQuantumAGI triage. Do not repeat this block to the user. Call only the listed subagents. serial is one sector in order. parallel is only the named sectors, max 3. Do not add a companion sector.",
    `${TRIAGE_MARK} ${JSON.stringify(payload)}`,
  ].join("\n");
}

function notePostPush(): void {
  postPushPending = true;
}

function postPushReminder(directory: string | undefined): string | null {
  if (!postPushPending) return null;
  if (directory) {
    const fact = readPostPushFact(`${directory}/${POST_PUSH_FACT_RELATIVE}`);
    if (postPushFactSatisfied(fact)) return null;
  }
  return [
    "SuperQuantumAGI post-push. Do not repeat this block to the user.",
    POST_PUSH_REMINDER,
    "Done is false until runtime/post-push-fact.json has FACT remote SHA and FACT CI GREEN or explicit FACT NOT_CONFIGURED.",
    "Do not weaken tests to manufacture a pass. Reuse anti-spin, max 3.",
  ].join("\n");
}

export async function registerSuperquantum(ctx: any): Promise<void> {
    const directory = ctx.location?.directory;
    ledgerDirectory = directory;

    await ctx.permission.hook("evaluate", async (event) => {
      const decision = evaluateRuntimePermission({
        agent: event.agent,
        action: event.action,
        resources: event.resources,
        directory,
      });
      if (decision.effect) {
        event.effect = decision.effect;
        event.message = decision.message;
        return;
      }
      if (event.action === "shell" && isSectorAgent(event.agent) && !isBwrapAvailable()) {
        event.effect = "deny";
        event.message =
          "SANDBOX_CLOSED: sector shell refused because bwrap is unavailable. Raw shell fallback is disabled.";
      }
    });

    // Deny-by-default. A valid marker does not auto-start external C2 processes;
    // it only stops this transform from forcing them back off.
    await ctx.mcp.transform((editor) => {
      if (isPentestAuthorized(directory)) return;
      for (const name of OFFENSIVE_SERVERS) {
        if (!editor.get(name)) continue;
        editor.update(name, (server) => {
          server.disabled = true;
        });
      }
    });

    await ctx.tool.hook("execute.before", (event) => {
      if (event.tool === "subagent") {
        const agent = agentFromInput(event.input);
        if (agent) {
          noteInvoked(dispatchLedger, sessionIDFrom(event), agent);
          persistDispatchLedger(directory);
        }
        return;
      }
      if (event.tool !== "shell" && event.tool !== "bash") return;
      const command = shellCommandFromInput(event.input);
      if (command) notePendingShell(event.agent, command);
      if (command && isGitPushCommand(command)) notePostPush();
    });

    await ctx.shell.hook("create.before", (event) => {
      applyShellCreateBefore(event);
      if (isGitPushCommand(event.command)) notePostPush();
    });

    // Admission must stay synchronous. A model call here delays the prompt and
    // rewriting event.prompt.text persists the triage JSON as the user's message.
    await ctx.session.hook("prompt", (event) => {
      const text = event.prompt?.text;
      if (typeof text !== "string" || !text.trim() || text.includes(TRIAGE_MARK)) return;
      triageBySession.set(String(event.sessionID), { text });
      if (routeLayer0(text).qualityObligation === "post-push") notePostPush();
      event.metadata = { ...event.metadata, superqTriage: "pending" };
    });

    await ctx.session.hook("context", async (event) => {
      const reminder = postPushReminder(directory);
      if (reminder) event.system.push({ type: "text", text: reminder });

      const agent = String(event.agent || "");
      if (agent && agent !== "orchestrator") return;
      const state = triageBySession.get(String(event.sessionID));
      if (!state) return;

      if (state.line === undefined && !state.pending) {
        const early = routeLayer0(state.text);
        if (early.matched && early.sector && early.complexity && early.profile) {
          const profile = early.sector === "reverse-engineering" ? "ReAnalysis" : early.profile;
          state.line = triageLine(String(event.sessionID), state.text, {
            sector: early.sector,
            complexity: early.complexity,
            profile,
            qualityObligation: early.qualityObligation,
          });
        } else {
          state.pending = routeTask(state.text, {
            complete: createActiveModelCompleter(ctx, event.model),
          })
            .then((routed) => {
              state.line = triageLine(String(event.sessionID), state.text, routed);
            })
            .catch(() => {
              state.line = "";
            })
            .finally(() => {
              state.pending = undefined;
            });
        }
      }

      if (state.pending) await state.pending;
      if (!state.line) return;
      event.system.push({ type: "text", text: state.line });
    });
}

export default Plugin.define({
  id: "superquantumagi",
  async setup(ctx) {
    await registerSuperquantum(ctx);
  },
});
