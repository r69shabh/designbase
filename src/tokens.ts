import type { Playbook } from "./playbook.ts";

export type TokenFormat = "json" | "css" | "tailwind-v4" | "tailwind-v3";

export function exportTokens(pb: Playbook, format: TokenFormat): string {
  const t = pb.tokens;
  const families = Object.fromEntries(Object.entries(t.font).map(([k, f]) => [k, f.family]));
  switch (format) {
    case "json":
      return JSON.stringify(t, null, 2);
    case "css":
      return [
        ":root {",
        ...Object.entries(t.color).map(([k, c]) => `  --color-${k}: ${c.value};`),
        ...Object.entries(families).map(([k, f]) => `  --font-${k}: "${f}";`),
        ...Object.entries(t.fontSize).map(([k, v]) => `  --text-${k}: ${v}px;`),
        ...Object.entries(t.spacing).map(([k, v]) => `  --space-${k}: ${v}px;`),
        ...Object.entries(t.radius).map(([k, v]) => `  --radius-${k}: ${v}px;`),
        "}",
      ].join("\n");
    case "tailwind-v4":
      // Resetting each namespace with `initial` removes Tailwind's defaults, so off-system classes don't compile.
      return [
        '@import "tailwindcss";',
        "",
        "@theme {",
        "  --color-*: initial;",
        "  --color-transparent: transparent;",
        "  --color-current: currentColor;",
        ...Object.entries(t.color).map(([k, c]) => `  --color-${k}: ${c.value};`),
        "  --font-*: initial;",
        ...Object.entries(families).map(([k, f]) => `  --font-${k}: "${f}", ${k === "mono" ? "monospace" : k === "display" ? "serif" : "sans-serif"};`),
        "  --text-*: initial;",
        ...Object.entries(t.fontSize).map(([k, v]) => `  --text-${k}: ${v / 16}rem;`),
        "  --radius-*: initial;",
        ...Object.entries(t.radius).filter(([k]) => k !== "none" && k !== "full").map(([k, v]) => `  --radius-${k}: ${v}px;`),
        "  --shadow-*: initial;",
        "  --spacing: 4px;",
        "}",
      ].join("\n");
    case "tailwind-v3":
      return `/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    colors: ${JSON.stringify({ transparent: "transparent", current: "currentColor", ...Object.fromEntries(Object.entries(t.color).map(([k, c]) => [k, c.value])) }, null, 6).replace(/\n}/, "\n    }")},
    fontFamily: ${JSON.stringify(Object.fromEntries(Object.entries(families).map(([k, f]) => [k, [f]])))},
    fontSize: ${JSON.stringify(Object.fromEntries(Object.entries(t.fontSize).map(([k, v]) => [k, `${v / 16}rem`])))},
    spacing: ${JSON.stringify(Object.fromEntries(Object.entries(t.spacing).map(([k, v]) => [k, `${v}px`])))},
    borderRadius: ${JSON.stringify(Object.fromEntries(Object.entries(t.radius).map(([k, v]) => [k, `${v}px`])))},
    boxShadow: { none: "none" },
  },
};`;
  }
}
