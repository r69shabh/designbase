// One OpenAI-compatible client for every model, via OpenRouter.

export type Part = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };
export interface Message {
  role: "system" | "user" | "assistant";
  content: string | Part[];
}
export interface Completion {
  text: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  latencyMs: number;
}
export interface ModelInfo {
  id: string;
  vision: boolean;
  promptPrice: number;
  completionPrice: number;
}

const BASE = "https://openrouter.ai/api/v1";

export async function listModels(): Promise<Map<string, ModelInfo>> {
  const res = await fetch(`${BASE}/models`);
  if (!res.ok) throw new Error(`OpenRouter /models: ${res.status}`);
  const { data } = (await res.json()) as { data: { id: string; pricing: { prompt: string; completion: string }; architecture?: { input_modalities?: string[] } }[] };
  return new Map(
    data.map((m) => [
      m.id,
      { id: m.id, vision: !!m.architecture?.input_modalities?.includes("image"), promptPrice: Number(m.pricing.prompt), completionPrice: Number(m.pricing.completion) },
    ]),
  );
}

export async function complete(model: string, messages: Message[], opts: { maxTokens?: number; temperature?: number } = {}): Promise<Completion> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not set");
  const body = JSON.stringify({
    model,
    messages,
    max_tokens: opts.maxTokens ?? 16_000,
    temperature: opts.temperature ?? 0.2,
    usage: { include: true },
  });

  let lastError = "";
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt) await new Promise((r) => setTimeout(r, 2 ** attempt * 2_000));
    const started = Date.now();
    try {
      const res = await fetch(`${BASE}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Title": "designbase bench" },
        body,
        signal: AbortSignal.timeout(600_000),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: { message?: string };
        choices?: { message?: { content?: string | null }; finish_reason?: string }[];
        usage?: { prompt_tokens?: number; completion_tokens?: number; cost?: number };
      };
      if (res.status === 429 || res.status >= 500) {
        lastError = `${res.status} ${json.error?.message ?? ""}`;
        continue;
      }
      if (!res.ok || json.error) throw new Error(`${res.status} ${json.error?.message ?? "request failed"}`);
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
      const msg = (e as Error).message;
      // 4xx other than 429 won't get better on retry.
      if (/^4\d\d /.test(msg)) throw e;
      lastError = msg;
    }
  }
  throw new Error(`${model}: gave up after retries: ${lastError}`);
}

/** The largest fenced code block, or the whole reply if the model skipped the fence. */
export function extractCode(text: string): string {
  const blocks = [...text.matchAll(/```[a-zA-Z]*\n([\s\S]*?)```/g)].map((m) => m[1]);
  if (blocks.length) return blocks.sort((a, b) => b.length - a.length)[0].trim() + "\n";
  // An unterminated fence (reply cut off by max_tokens).
  const open = text.match(/```[a-zA-Z]*\n([\s\S]*)$/);
  return (open ? open[1] : text).trim() + "\n";
}
