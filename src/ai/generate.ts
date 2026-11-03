// Structured generation on top of the provider client: model policy with fallbacks,
// zod-validated JSON output with one repair round, and a response cache.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { complete, type Completion, type Message } from "./models.ts";

export type Capability = "vision" | "text";

/** Ordered fallbacks per capability. Override with DESIGNBASE_VISION_MODELS / DESIGNBASE_TEXT_MODELS (comma-separated). */
const DEFAULT_POLICY: Record<Capability, string[]> = {
  vision: [
    "openrouter:anthropic/claude-sonnet-5.5",
    "gemini:gemini-4-argon",
    "nvidia:nvidia/nemotron-3.5-super-vl-120b-a12b",
    "nvidia:meta/llama-3.2-90b-vision-instruct",
  ],
  text: [
    "openrouter:anthropic/claude-sonnet-5.5",
    "gemini:gemini-4-argon",
    "nvidia:nvidia/nemotron-3-ultra-550b-a55b",
    "groq:openai/gpt-oss-120b",
  ],
};

export function policy(cap: Capability): string[] {
  const env = process.env[cap === "vision" ? "DESIGNBASE_VISION_MODELS" : "DESIGNBASE_TEXT_MODELS"];
  return env ? env.split(",").map((s) => s.trim()).filter(Boolean) : DEFAULT_POLICY[cap];
}

// Models that failed in a way retrying won't fix (bad key, quota, unknown model) are skipped for the rest of the process.
const dead = new Set<string>();
const isPermanent = (msg: string) => /^(401|402|403|404)\b|quota|API key|not set|No endpoints/i.test(msg);

export interface Usage { model: string; inputTokens: number; outputTokens: number; cost: number; latencyMs: number; cached: boolean }

const CACHE_DIR = process.env.DESIGNBASE_AI_CACHE_DIR ?? ".designbase/cache";
const cacheOn = () => process.env.DESIGNBASE_AI_CACHE !== "off";

/** Call the first working model in the capability's policy. */
export async function completeWithPolicy(cap: Capability, messages: Message[], opts: { maxTokens?: number; temperature?: number; models?: string[] } = {}): Promise<Completion & { model: string; cached: boolean }> {
  const key = createHash("sha256").update(JSON.stringify({ cap, messages, opts: { ...opts, models: undefined } })).digest("hex");
  const cachePath = join(CACHE_DIR, `${key}.json`);
  if (cacheOn() && existsSync(cachePath)) return { ...JSON.parse(readFileSync(cachePath, "utf8")), cached: true };

  const errors: string[] = [];
  for (const model of opts.models ?? policy(cap)) {
    if (dead.has(model)) continue;
    try {
      const res = await complete(model, messages, opts);
      const out = { ...res, model };
      if (cacheOn()) {
        mkdirSync(CACHE_DIR, { recursive: true });
        writeFileSync(cachePath, JSON.stringify(out));
      }
      return { ...out, cached: false };
    } catch (e) {
      const msg = (e as Error).message;
      errors.push(`${model}: ${msg.slice(0, 160)}`);
      if (isPermanent(msg)) dead.add(model);
    }
  }
  throw new Error(`No ${cap} model available.\n  ${errors.join("\n  ") || "all models in the policy are marked unavailable"}`);
}

function parseJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*\n([\s\S]*?)```/);
  const body = fenced ? fenced[1] : text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  return JSON.parse(body);
}

/** Ask for JSON matching `schema`; validate; on failure send the errors back once. */
export async function generateObject<T>(
  cap: Capability,
  schema: z.ZodType<T>,
  messages: Message[],
  opts: { maxTokens?: number; temperature?: number; models?: string[] } = {},
): Promise<{ object: T; usage: Usage }> {
  const jsonSchema = JSON.stringify(z.toJSONSchema(schema));
  const withFormat: Message[] = [
    ...messages,
    { role: "user", content: `Reply with a single JSON object that validates against this JSON Schema, and nothing else:\n${jsonSchema}` },
  ];
  const first = await completeWithPolicy(cap, withFormat, { temperature: 0, ...opts });
  const usage: Usage = { model: first.model, inputTokens: first.inputTokens, outputTokens: first.outputTokens, cost: first.cost, latencyMs: first.latencyMs, cached: first.cached };

  const attempt = (text: string) => {
    try {
      return schema.safeParse(parseJson(text));
    } catch (e) {
      return { success: false as const, error: new Error(`Not valid JSON: ${(e as Error).message}`) };
    }
  };
  let parsed = attempt(first.text);
  if (!parsed.success) {
    const repair = await completeWithPolicy(
      cap,
      [...withFormat, { role: "assistant", content: first.text }, { role: "user", content: `That didn't validate:\n${String(parsed.error).slice(0, 2_000)}\nReturn the corrected JSON object only.` }],
      { temperature: 0, ...opts, models: [first.model] },
    );
    usage.inputTokens += repair.inputTokens;
    usage.outputTokens += repair.outputTokens;
    usage.cost += repair.cost;
    usage.latencyMs += repair.latencyMs;
    parsed = attempt(repair.text);
    if (!parsed.success) throw new Error(`${first.model} returned invalid output twice: ${String(parsed.error).slice(0, 500)}`);
  }
  return { object: parsed.data as T, usage };
}

export const imagePart = (png: Buffer, mime = "image/png") => ({ type: "image_url" as const, image_url: { url: `data:${mime};base64,${png.toString("base64")}` } });
