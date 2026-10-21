/**
 * SuperQuantumAGI OpenCode plugin.
 * Enforces single-writer, NFR11, sector bwrap sandbox, and one Layer-1 model call.
 * Does not substring-match tool arguments: a grep/read for documentation must not
 * be treated as an offensive launch. Does not add a model router.
 */

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
let postPushPending = false;

function triageLine(routed: {
  sector: string;
  complexity: string;
  profile: string;
  qualityObligation?: string;
}): string {
  const payload: Record<string, string> = {
    sector: routed.sector,
    complexity: routed.complexity,
    profile: routed.profile,
  };
  if (routed.qualityObligation && routed.qualityObligation !== "none") {
    payload.qualityObligation = routed.qualityObligation;
  }
  return [
    "SuperQuantumAGI triage. Do not repeat this block to the user.",
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
          state.line = triageLine({
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
              state.line = triageLine(routed);
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
