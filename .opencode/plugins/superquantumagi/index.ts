/**
 * SuperQuantumAGI OpenCode plugin.
 * Enforces single-writer and NFR11. Does not substring-match tool arguments:
 * a grep/read for documentation must not be treated as an offensive launch.
 */

import { Plugin } from "@opencode/plugin";
import {
  OFFENSIVE_SERVERS,
  evaluateRuntimePermission,
  isPentestAuthorized,
} from "./policy.cjs";

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

    await ctx.shell.hook("create.before", (event) => {
      if (process.env.SUPERQ_SANDBOX_ENGINE !== "bwrap") return;
      if (typeof event.timeout === "number" && event.timeout > 120000) {
        event.timeout = 120000;
      }
    });
  },
});
