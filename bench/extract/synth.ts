// Seeded synthetic design systems and pages with exact ground truth. Every value on a page comes
// from the system's tokens, the generator records which ones it used, and every component instance
// carries data-truth="<component>:<variant>" so the scorer can find it (the extractor never reads it).

export interface SynthSystem {
  seed: number;
  name: string;
  mode: "light" | "dark";
  colors: Record<string, string>;
  spacing: number[];
  type: { body: number; sizes: number[] };
  radius: { control: number; card: number; pill: boolean };
  shadow: string | null;
  fonts: { body: string; display: string; mono: string };
}

export interface Truth {
  colors: Record<string, string>; // role → hex, only roles used on the pages
  spacing: number[];
  fontSizes: number[];
  bodySize: number;
  fonts: string[];
  radii: number[];
  pill: boolean;
  shadows: boolean;
  components: Record<string, string[]>; // component → variants used
}

// Deterministic PRNG (mulberry32).
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hsl = (h: number, s: number, l: number) => {
  s /= 100;
  l /= 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * c).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
};

const FONT_SETS = [
  { body: "Source Sans 3", display: "Source Serif 4", mono: "Source Code Pro" },
  { body: "Work Sans", display: "Work Sans", mono: "JetBrains Mono" },
  { body: "Nunito Sans", display: "Lora", mono: "Fira Code" },
  { body: "Public Sans", display: "Playfair Display", mono: "IBM Plex Mono" },
  { body: "Manrope", display: "Manrope", mono: "Space Mono" },
];

export function makeSystem(seed: number): SynthSystem {
  const r = rng(seed);
  const pick = <T>(xs: T[]) => xs[Math.floor(r() * xs.length)];
  const mode = r() < 0.3 ? "dark" : "light";
  const hue = Math.floor(r() * 360);
  const neutralHue = pick([hue, 30, 220, 0]);
  const ns = pick([4, 8, 12]);
  const light = mode === "light";
  const colors: Record<string, string> = {
    background: light ? hsl(neutralHue, ns, 98) : hsl(neutralHue, ns, 9),
    surface: light ? hsl(neutralHue, ns, 94) : hsl(neutralHue, ns, 14),
    text: light ? hsl(neutralHue, ns + 6, 12) : hsl(neutralHue, ns, 92),
    "text-muted": light ? hsl(neutralHue, ns, 38) : hsl(neutralHue, ns, 68),
    border: light ? hsl(neutralHue, ns, 84) : hsl(neutralHue, ns, 24),
    accent: hsl(hue, 55 + Math.floor(r() * 30), light ? 40 : 62),
    "accent-text": light ? "#FFFFFF" : hsl(neutralHue, ns, 8),
    success: hsl(145, 50, light ? 32 : 60),
    warning: hsl(38, 80, light ? 34 : 60),
    danger: hsl(2, 65, light ? 42 : 64),
  };
  const base = pick([4, 8]);
  const spacing = base === 4 ? [4, 8, 12, 16, 24, 32, 48, 64] : [8, 16, 24, 32, 48, 64];
  const body = pick([14, 15, 16]);
  const ratio = pick([1.2, 1.25, 1.333]);
  const sizes = [-1, 0, 1, 2, 3, 4].map((k) => Math.round(body * ratio ** k));
  const radiusStyle = pick(["sharp", "soft", "round"] as const);
  const radius = radiusStyle === "sharp" ? { control: 0, card: 0, pill: false } : radiusStyle === "soft" ? { control: 4, card: 8, pill: true } : { control: 8, card: 16, pill: true };
  const shadow = r() < 0.4 ? (light ? "rgba(0, 0, 0, 0.12) 0px 1px 3px 0px" : "rgba(0, 0, 0, 0.5) 0px 2px 6px 0px") : null;
  return { seed, name: `synth-${seed}`, mode, colors, spacing, type: { body, sizes }, radius, shadow, fonts: pick(FONT_SETS) };
}

/** Two pages (dashboard, settings) built only from the system's tokens, plus the truth they use. */
export function makePages(sys: SynthSystem): { pages: Record<string, string>; truth: Truth } {
  const c = sys.colors;
  const sp = sys.spacing;
  const s = (i: number) => sp[Math.min(i, sp.length - 1)]; // spacing by step index
  const [xs, base, lg, xl, xxl, xxxl] = sys.type.sizes;
  const used = { colors: new Set<string>(), spacing: new Set<number>(), sizes: new Set<number>(), radii: new Set<number>(), components: new Map<string, Set<string>>() };
  const col = (role: string) => (used.colors.add(role), c[role]);
  const px = (v: number) => (v > 0 && used.spacing.add(v), `${v}px`);
  const size = (v: number) => (used.sizes.add(v), `${v}px`);
  const rad = (v: number) => (v > 0 && v < 999 && used.radii.add(v), `${v}px`);
  const mark = (comp: string, variant: string) => {
    used.components.set(comp, (used.components.get(comp) ?? new Set()).add(variant));
    return `data-truth="${comp}:${variant}"`;
  };
  // Single quotes: these go inside style="…" attributes.
  const font = (f: string) => `'${f}', sans-serif`;
  const shadow = sys.shadow ? `box-shadow: ${sys.shadow};` : "";

  const page = (title: string, body: string) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{background:${col("background")};color:${col("text")};font:${size(base)}/1.5 ${font(sys.fonts.body)}}</style></head><body>${body}</body></html>`;

  const button = (label: string, variant: "primary" | "secondary" | "danger", small = false) => {
    const styles = {
      primary: `background:${col("accent")};color:${col("accent-text")};border:1px solid ${col("accent")}`,
      secondary: `background:${col("background")};color:${col("text")};border:1px solid ${col("border")}`,
      danger: `background:${col("background")};color:${col("danger")};border:1px solid ${col("danger")}`,
    }[variant];
    return `<button ${mark("button", variant)} style="${styles};padding:${px(small ? s(0) : s(1))} ${px(small ? s(1) : s(3))};border-radius:${rad(sys.radius.control)};font:500 ${size(small ? xs : base)} ${font(sys.fonts.body)}">${label}</button>`;
  };
  const badge = (label: string, tone: "success" | "warning" | "danger") =>
    `<span ${mark("badge", tone)} style="display:inline-block;color:${col(tone)};border:1px solid ${col(tone)};border-radius:${sys.radius.pill ? "999px" : rad(sys.radius.control)};padding:0 ${px(s(1))};font-size:${size(xs)}">${label}</span>`;
  const card = (title: string, inner: string, variant = "default") =>
    `<section ${mark("card", variant)} style="background:${col("surface")};border:1px solid ${col("border")};border-radius:${rad(sys.radius.card)};padding:${px(s(4))};${shadow}"><h2 style="font:600 ${size(lg)} ${font(sys.fonts.display)};margin-bottom:${px(s(3))}">${title}</h2>${inner}</section>`;
  const stat = (label: string, value: string, delta: string, up: boolean) =>
    `<div ${mark("stat", "default")} style="display:flex;flex-direction:column;gap:${px(s(0))};border-top:2px solid ${col("text")};padding-top:${px(s(2))}"><span style="color:${col("text-muted")};font-size:${size(xs)}">${label}</span><span style="font:600 ${size(xxl)} ${font(sys.fonts.display)}">${value}</span><span style="font:${size(xs)} ${font(sys.fonts.mono)};color:${col(up ? "success" : "danger")}">${delta}</span></div>`;
  const input = (label: string, value: string) =>
    `<label style="display:flex;flex-direction:column;gap:${px(s(0))};font-size:${size(xs)};color:${col("text-muted")}">${label}<input ${mark("input", "default")} value="${value}" style="background:${col("background")};color:${col("text")};border:1px solid ${col("border")};border-radius:${rad(sys.radius.control)};padding:${px(s(1))} ${px(s(2))};font:${size(base)} ${font(sys.fonts.body)}"></label>`;
  const table = () => {
    const rows = [["INV-0412", "Northwind", "success", "Paid", "$4,200.00"], ["INV-0411", "Contoso", "warning", "Due soon", "$1,150.00"], ["INV-0409", "Fabrikam", "danger", "Overdue", "$2,980.00"]];
    const cell = `padding:${px(s(1))} ${px(s(2))};border-top:1px solid ${col("border")};text-align:left`;
    return `<table ${mark("table", "default")} style="width:100%;border-collapse:collapse;font-size:${size(xs)}"><thead><tr>${["Invoice", "Customer", "Status", "Amount"].map((h) => `<th style="${cell};color:${col("text-muted")};font-weight:500">${h}</th>`).join("")}</tr></thead><tbody>${rows
      .map(([id, cust, tone, label, amt]) => `<tr><td style="${cell};font-family:${font(sys.fonts.mono)}">${id}</td><td style="${cell}">${cust}</td><td style="${cell}">${badge(label, tone as "success")}</td><td style="${cell};font-family:${font(sys.fonts.mono)}">${amt}</td></tr>`)
      .join("")}</tbody></table>`;
  };
  const header = (title: string, action: string) =>
    `<header style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:${px(s(5))};padding-bottom:${px(s(3))};border-bottom:1px solid ${col("border")}"><h1 style="font:600 ${size(xxxl)}/1.1 ${font(sys.fonts.display)}">${title}</h1>${action}</header>`;

  const dashboard = page(
    "Dashboard",
    `<main style="padding:${px(s(5))} ${px(s(6))};max-width:1200px">
${header("Overview", button("New invoice", "primary"))}
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:${px(s(4))};margin-bottom:${px(s(5))}">${stat("Revenue", "$48,210", "▲ 12.4%", true)}${stat("Outstanding", "$9,830", "▼ 3.1%", false)}${stat("Paid on time", "87%", "▲ 4 pts", true)}${stat("Customers", "42", "▲ 3", true)}</div>
<div style="display:grid;grid-template-columns:2fr 1fr;gap:${px(s(4))}">${card("Recent invoices", table())}${card("Actions", `<div style="display:flex;flex-direction:column;gap:${px(s(2))};align-items:flex-start">${button("Send reminders", "secondary")}${button("Export", "secondary", true)}${button("Void invoice", "danger")}</div>`)}</div>
</main>`,
  );
  const settings = page(
    "Settings",
    `<main style="padding:${px(s(5))} ${px(s(6))};max-width:800px">
${header("Settings", "")}
<div style="display:flex;flex-direction:column;gap:${px(s(4))}">
${card("Profile", `<div style="display:grid;grid-template-columns:1fr 1fr;gap:${px(s(3))};margin-bottom:${px(s(3))}">${input("Full name", "Ada Okafor")}${input("Email", "ada@northwind.co")}</div>${button("Save profile", "primary")}`)}
${card("Invoicing", `<div style="display:grid;grid-template-columns:1fr 1fr;gap:${px(s(3))};margin-bottom:${px(s(3))}">${input("Payment terms", "30 days")}${input("Currency", "USD")}</div><div style="display:flex;gap:${px(s(2))}">${badge("Reminders on", "success")}${badge("2 pending", "warning")}</div>`)}
${card("Danger zone", button("Delete workspace", "danger"))}
</div></main>`,
  );

  const fonts = [...new Set([sys.fonts.body, sys.fonts.display, sys.fonts.mono])];
  const truth: Truth = {
    colors: Object.fromEntries([...used.colors].map((role) => [role, c[role]])),
    spacing: [...used.spacing].sort((a, b) => a - b),
    fontSizes: [...used.sizes].sort((a, b) => a - b),
    bodySize: base,
    fonts,
    radii: [...used.radii].sort((a, b) => a - b),
    pill: sys.radius.pill,
    shadows: !!sys.shadow,
    components: Object.fromEntries([...used.components].map(([k, v]) => [k, [...v].sort()])),
  };
  return { pages: { dashboard, settings }, truth };
}
