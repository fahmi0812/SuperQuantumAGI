import fs from "node:fs";
import path from "node:path";

const PROJECT_PLUGIN = path.join(".opencode", "plugins", "superquantumagi", "index.ts");

/**
 * True when this location will also discover the project plugin.
 * The global entry must not register the same ID in that case.
 */
export function projectPluginDiscovered(directory: string | undefined): boolean {
  if (!directory) return false;
  let dir = path.resolve(directory);
  const root = path.parse(dir).root;
  while (true) {
    if (fs.existsSync(path.join(dir, PROJECT_PLUGIN))) return true;
    if (dir === root) return false;
    dir = path.dirname(dir);
  }
}
