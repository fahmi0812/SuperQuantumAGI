/**
 * One-shot Layer-1 completer. Uses the model OpenCode already selected
 * for this session. Does not read global config and does not invent a router.
 */

export interface ActiveModelRef {
  providerID?: string;
  id?: string;
  modelID?: string;
  model?: ActiveModelRef | string;
  data?: ActiveModelRef;
  defaultModel?: ActiveModelRef;
}

export interface ActiveModelClient {
  model: {
    default: () => Promise<ActiveModelRef | undefined>;
    list?: () => Promise<unknown>;
  };
  generate: {
    text: (input: { model: { providerID: string; id: string }; prompt: string }) => Promise<{ text: string }>;
  };
  session?: {
    generate?: (input: { sessionID: string; prompt: string }) => Promise<{ text: string }>;
  };
}

export function normalizeModelRef(value: unknown): { providerID: string; id: string } | null {
  if (!value) return null;
  if (typeof value === "string") {
    const slash = value.indexOf("/");
    if (slash <= 0 || slash === value.length - 1) return null;
    const [providerID, rest] = [value.slice(0, slash), value.slice(slash + 1)];
    const id = rest.split("#")[0];
    return providerID && id ? { providerID, id } : null;
  }
  if (typeof value !== "object") return null;
  const record = value as ActiveModelRef;
  const providerID = record.providerID;
  const id = record.id || record.modelID;
  if (providerID && id) return { providerID, id };
  return (
    normalizeModelRef(record.model) ||
    normalizeModelRef(record.defaultModel) ||
    normalizeModelRef(record.data) ||
    null
  );
}

function listedModels(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  const record = value as { items?: unknown; data?: unknown; models?: unknown };
  if (Array.isArray(record.items)) return record.items;
  if (Array.isArray(record.data)) return record.data;
  if (Array.isArray(record.models)) return record.models;
  return [];
}

export async function resolveActiveModel(
  ctx: ActiveModelClient,
  sessionModel?: unknown,
): Promise<{ providerID: string; id: string } | null> {
  const fromSession = normalizeModelRef(sessionModel);
  if (fromSession) return fromSession;
  try {
    const selected = normalizeModelRef(await ctx.model.default());
    if (selected) return selected;
  } catch {
    // Fall through to the model list. Do not invent a provider.
  }
  if (!ctx.model.list) return null;
  try {
    for (const item of listedModels(await ctx.model.list())) {
      const ref = normalizeModelRef(item);
      if (ref) return ref;
    }
  } catch {
    return null;
  }
  return null;
}

export function createActiveModelCompleter(
  ctx: ActiveModelClient,
  sessionModel?: unknown,
): (triagePrompt: string) => Promise<string> {
  let calls = 0;
  return async (triagePrompt: string) => {
    calls += 1;
    if (calls !== 1) {
      throw new Error("Layer-1 triage refused: more than one model call in a single route.");
    }
    const selected = await resolveActiveModel(ctx, sessionModel);
    if (!selected) {
      throw new Error("Layer-1 triage refused: no active OpenCode model. Refusing to invent a router.");
    }
    const result = await ctx.generate.text({
      model: selected,
      prompt: triagePrompt,
    });
    if (!result || typeof result.text !== "string") {
      throw new Error("Layer-1 triage refused: active model returned no text.");
    }
    return result.text;
  };
}
