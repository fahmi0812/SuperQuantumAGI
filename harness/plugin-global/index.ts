/**
 * Global entry for directories outside this checkout.
 * OpenCode resolves this file from the symlink path, so static relative
 * imports would look under ~/.config/opencode. Resolve the real checkout
 * first, then import that absolute file URL.
 * Inside the checkout the project plugin already owns id "superquantumagi",
 * so this entry returns without registering hooks.
 */
import { Plugin } from "@opencode/plugin";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

function checkoutRoot(): string {
  const here = path.dirname(fs.realpathSync(fileURLToPath(import.meta.url)));
  return path.resolve(here, "../..");
}

export default Plugin.define({
  id: "superquantumagi.global",
  async setup(ctx) {
    const root = checkoutRoot();
    const discover = await import(
      pathToFileURL(path.join(root, ".opencode/plugins/superquantumagi/discover.ts")).href
    );
    if (discover.projectPluginDiscovered(ctx.location?.directory)) return;
    const plugin = await import(
      pathToFileURL(path.join(root, ".opencode/plugins/superquantumagi/index.ts")).href
    );
    await plugin.registerSuperquantum(ctx);
  },
});
