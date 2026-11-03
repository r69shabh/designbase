// One OpenAI-compatible client for every model. Model ids are "<provider>:<model>", e.g.
// "gemini:gemini-4-argon", "groq:openai/gpt-oss-120b", "openrouter:anthropic/claude-sonnet-5.5".

export type Part = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };
export interface Message {
  role: "system" | "user" | "assistant";
  content: string | Part[];
}
export interface Completion {
  text: string;
  inputTokens: number;
  outputTokens: number;
  /** USD. Only OpenRouter reports cost; other providers report 0. */
  cost: number;
  latencyMs: number;
}
export interface ModelSpec {
  id: string;
  vision: boolean;
}
export interface ModelInfo extends ModelSpec {
  promptPrice: number;
  completionPrice: number;
}

export const PROVIDERS = {
  openrouter: { base: "https://openrouter.ai/api/v1", key: "OPENROUTER_API_KEY" },
  gemini: { base: "https://generativelanguage.googleapis.com/v1beta/openai", key: "GEMINI_API_KEY" },
  groq: { base: "https://api.groq.com/openai/v1", key: "GROQ_API_KEY" },
  nvidia: { base: "https://integrate.api.nvidia.com/v1", key: "NVIDIA_API_KEY" },
} as const;
export type Provider = keyof typeof PROVIDERS;

export function parseModel(id: string): { provider: Provider; model: string } {
  const i = id.indexOf(":");
  const provider = id.slice(0, i) as Provider;
  if (i < 0 || !(provider in PROVIDERS)) throw new Error(`Model "${id}" needs a provider prefix: ${Object.keys(PROVIDERS).join(", ")}`);
  return { provider, model: id.slice(i + 1) };
}

/** Which providers have a key that authenticates. Listing models is free on all of them. */
export async function checkProviders(providers: Provider[]): Promise<Map<Provider, { ok: boolean; reason?: string; models: Set<string>; prices: Map<string, [number, number]> }>> {
  const out = new Map();
  for (const p of providers) {
    const { base, key } = PROVIDERS[p];
    const secret = process.env[key];
    if (!secret) {
      out.set(p, { ok: false, reason: `${key} not set`, models: new Set(), prices: new Map() });
      continue;
    }
    // OpenRouter's model list is public, so it can't tell us whether the key works; /key does.
    const authUrl = p === "openrouter" ? `${base}/key` : `${base}/models`;
    const auth = await fetch(authUrl, { headers: { Authorization: `Bearer ${secret}` } });
    if (!auth.ok) {
      out.set(p, { ok: false, reason: `${key} rejected (HTTP ${auth.status})`, models: new Set(), prices: new Map() });
      continue;
    }
    const list = (await (p === "openrouter" ? (await fetch(`${base}/models`)).json() : auth.json())) as {
      data: { id: string; pricing?: { prompt: string; completion: string } }[];
    };
    const ids = list.data.map((m) => m.id.replace(/^models\//, ""));
    const prices = new Map<string, [number, number]>(
      list.data.filter((m) => m.pricing).map((m) => [m.id, [Number(m.pricing!.prompt), Number(m.pricing!.completion)]]),
    );
    out.set(p, { ok: true, models: new Set(ids), prices });
  }
  return out;
}

export async function complete(id: string, messages: Message[], opts: { maxTokens?: number; temperature?: number } = {}): Promise<Completion> {
  const { provider, model } = parseModel(id);
  const { base, key } = PROVIDERS[provider];
  const secret = process.env[key];
  if (!secret) throw new Error(`${key} is not set`);
  const body = JSON.stringify({
    model,
    messages,
    max_tokens: opts.maxTokens ?? 16_000,
    temperature: opts.temperature ?? 0.2,
    ...(provider === "openrouter" ? { usage: { include: true } } : {}),
  });

  let lastError = "";
  for (let attempt = 0; attempt < 6; attempt++) {
    const started = Date.now();
    try {
      const res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json", "X-Title": "designbase bench" },
        body,
        signal: AbortSignal.timeout(600_000),
      });
      const raw = await res.json().catch(() => ({}));
      const json = (Array.isArray(raw) ? raw[0] : raw) as {
        error?: { message?: string };
        choices?: { message?: { content?: string | null }; finish_reason?: string }[];
        usage?: { prompt_tokens?: number; completion_tokens?: number; cost?: number };
      };
      if (res.status === 429 || res.status >= 500) {
        lastError = `${res.status} ${json.error?.message ?? ""}`.slice(0, 200);
        const retryAfter = Number(res.headers.get("retry-after"));
        await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1_000 : Math.min(60_000, 2 ** attempt * 3_000));
        continue;
      }
      if (!res.ok || json.error) throw new FatalError(`${res.status} ${json.error?.message ?? "request failed"}`.slice(0, 300));
      const text = json.choices?.[0]?.message?.content ?? "";
      if (!text) {
        lastError = `empty response (finish_reason ${json.choices?.[0]?.finish_reason})`;
        continue;
      }
      return {
        text,
        inputTokens: json.usage?.prompt_tokens ?? 0,
        outputTokens: json.usage?.completion_tokens ?? 0,
        cost: json.usage?.cost ?? 0,
        latencyMs: Date.now() - started,
      };
    } catch (e) {
      if (e instanceof FatalError) throw e;
      lastError = (e as Error).message;
      await sleep(2 ** attempt * 2_000);
    }
  }
  throw new Error(`${id}: gave up after retries: ${lastError}`);
}

/** 4xx other than 429: retrying won't help. */
export class FatalError extends Error {}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** The largest fenced code block, or the whole reply if the model skipped the fence. */
export function extractCode(text: string): string {
  const blocks = [...text.matchAll(/```[a-zA-Z]*\n([\s\S]*?)```/g)].map((m) => m[1]);
  if (blocks.length) return blocks.sort((a, b) => b.length - a.length)[0].trim() + "\n";
  // An unterminated fence (reply cut off by max_tokens).
  const open = text.match(/```[a-zA-Z]*\n([\s\S]*)$/);
  return (open ? open[1] : text).trim() + "\n";
}
