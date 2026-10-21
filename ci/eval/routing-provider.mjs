/**
 * Promptfoo exec provider. Deterministic baseline only.
 * Live 9router is not called. A green run here is not a live-model pass.
 */
import { classifyDeterministic } from "../../routing/classify.ts";
import { SECTOR_SKILL_REGISTRY } from "../../routing/intent-registry/index.ts";
import { routeTask } from "../../routing/route-task.ts";

const prompt = process.argv.slice(2).join(" ").trim();
if (!prompt) {
  console.error("routing provider expected the rendered prompt as arguments");
  process.exit(2);
}

if (prompt === "__intent_registry__") {
  let unique = true;
  for (const skills of Object.values(SECTOR_SKILL_REGISTRY)) {
    const keys = skills.map((skill) => skill.intentKey);
    if (new Set(keys).size !== keys.length) unique = false;
  }
  process.stdout.write(JSON.stringify({
    registryUnique: unique,
    sectors: Object.keys(SECTOR_SKILL_REGISTRY).length,
  }));
  process.exit(unique ? 0 : 1);
}

const routed = await routeTask(prompt, {
  complete: async () => JSON.stringify(classifyDeterministic(prompt)),
});
process.stdout.write(JSON.stringify({
  sector: routed.sector,
  complexity: routed.complexity,
  profile: routed.profile,
  layer: routed.layer,
  liveModel: false,
}));
