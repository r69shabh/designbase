// The only model-driven step of foundations extraction: give measured tokens meaning
// (semantic names, roles), describe the voice, and list the components seen.
// Values are never taken from the model: it may only rename and describe what was measured.
import { z } from "zod";
import { generateObject, imagePart, type Usage } from "../ai/generate.ts";
import type { Message } from "../ai/models.ts";
import type { TokenProposal } from "./synthesize.ts";

export const Interpretation = z.object({
  colors: z
    .array(
      z.object({
        hex: z.string().describe("One of the measured hex values, unchanged"),
        name: z.string().describe("kebab-case semantic name, e.g. background, surface, text, text-muted, border, accent, accent-text, success, warning, danger"),
        role: z.string().describe("One sentence: where and how this colour is used"),
      }),
    )
    .describe("Every measured colour, renamed"),
  bodyFontSize: z.number().describe("The measured size used for normal paragraph/body text (from the list)"),
  voice: z.array(z.string()).min(4).max(9).describe("Short bullets on the design language: surfaces, depth, density, alignment, typography, colour use, copy tone. Concrete and specific to these screens."),
  components: z.array(z.object({ name: z.string().describe("PascalCase"), description: z.string() })).describe("Reusable UI components visible on the screens"),
  summary: z.string().describe("One sentence describing this design language"),
});
export type Interpretation = z.infer<typeof Interpretation>;

export async function interpret(screens: Buffer[], tokens: TokenProposal[]): Promise<{ result: Interpretation; usage: Usage }> {
  const colors = tokens.filter((t) => t.category === "color").map((t) => `${t.value} (now "${t.name}"; ${t.role})`).join("\n");
  const sizes = tokens.filter((t) => t.category === "fontSize").map((t) => `${t.value}px (${t.role})`).join(", ");
  const fonts = tokens.filter((t) => t.category === "font").map((t) => `${t.name}: ${t.value}`).join(", ");
  const messages: Message[] = [
    {
      role: "system",
      content: "You are a senior product designer reverse-engineering a design system from screens of a shipped product. Measured values are exact; your job is meaning: names, roles and the design voice. Never invent or alter values.",
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `Measured colours (hex, current placeholder name, measured usage):\n${colors}\n\nMeasured font sizes: ${sizes}\nMeasured fonts: ${fonts || "unknown (screenshot only)"}\n\nThe screens follow. Name every colour semantically (unique names; the main page background is "background", primary text is "text", the main call-to-action colour is "accent"), pick the body text size, write the voice bullets, and list the components you see.`,
        },
        ...screens.slice(0, 3).map((s) => imagePart(s)),
      ],
    },
  ];
  const { object, usage } = await generateObject("vision", Interpretation, messages, { maxTokens: 6_000 });
  return { result: object, usage };
}

/** Apply an interpretation to measured tokens: rename colours, re-anchor the type scale, keep values. */
export function applyInterpretation(tokens: TokenProposal[], it: Interpretation): TokenProposal[] {
  const used = new Set<string>();
  const kebab = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const out = tokens.map((t) => {
    if (t.category !== "color") return t;
    const match = it.colors.find((c) => c.hex.toUpperCase() === String(t.value).toUpperCase());
    const name = match ? kebab(match.name) : "";
    if (!match || !name || used.has(name)) {
      used.add(t.name);
      return t;
    }
    used.add(name);
    return { ...t, name, role: match.role, evidence: [...t.evidence, { source: "interpretation", detail: `named "${name}"` }] };
  });

  // Re-anchor type names around the body size the model identified, if it is one we measured.
  const sizes = out.filter((t) => t.category === "fontSize").map((t) => Number(t.value)).sort((a, b) => a - b);
  if (sizes.includes(it.bodyFontSize)) {
    const below = sizes.filter((s) => s < it.bodyFontSize).reverse();
    const above = sizes.filter((s) => s > it.bodyFontSize);
    const names = new Map<number, string>([[it.bodyFontSize, "base"]]);
    ["sm", "xs", "2xs", "3xs"].forEach((n, i) => below[i] !== undefined && names.set(below[i], n));
    ["lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl"].forEach((n, i) => above[i] !== undefined && names.set(above[i], n));
    return out.map((t) => (t.category === "fontSize" ? { ...t, name: names.get(Number(t.value)) ?? t.name } : t));
  }
  return out;
}
