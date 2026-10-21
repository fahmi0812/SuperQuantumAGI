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
import { createActiveModelCompleter } from "../../../routing/active-model.ts";
import { routeTask } from "../../../routing/route-task.ts";
import {
  OFFENSIVE_SERVERS,
  evaluateRuntimePermission,
  isPentestAuthorized,
} from "./policy.cjs";

const TRIAGE_MARK = "[superq-triage]";

export default Plugin.define({
  id: "superquantumagi",
  async setup(ctx) {
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
    });

    await ctx.shell.hook("create.before", (event) => {
      applyShellCreateBefore(event);
    });

    await ctx.session.hook("prompt", async (event) => {
      const text = event.prompt?.text;
      if (typeof text !== "string" || text.includes(TRIAGE_MARK)) return;
      let agent = "";
      let sessionModel: unknown;
      try {
        const session = await ctx.session.get({ sessionID: event.sessionID });
        agent = session?.agent || session?.agentID || "";
        sessionModel = session?.model;
      } catch {
        agent = "";
      }
      if (agent && agent !== "orchestrator") return;
      try {
        const routed = await routeTask(text, {
          complete: async (triagePrompt) => {
            if (ctx.session.generate) {
              try {
                const generated = await ctx.session.generate({
                  sessionID: event.sessionID,
                  prompt: triagePrompt,
                });
                if (generated?.text) return generated.text;
              } catch {
                // The session model call failed. Try the selected model once below.
              }
            }
            return createActiveModelCompleter(ctx, sessionModel)(triagePrompt);
          },
        });
        if (routed.layer !== "layer1") return;
        event.prompt.text = `${TRIAGE_MARK} ${JSON.stringify({
          sector: routed.sector,
          complexity: routed.complexity,
          profile: routed.profile,
        })}\n\n${text}`;
      } catch {
        // Leave the user prompt untouched. A missing model is not an error to inject.
      }
    });
  },
});
