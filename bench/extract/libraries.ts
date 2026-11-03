// Real, published design systems as ExtractBench cases. Each page is written in the library's own
// markup and CSS (from npm). Truth comes from the library's published tokens; the colours of core
// roles are read from known elements by the scorer (e.g. the primary button's computed fill).
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export interface RoleSelector { selector: string; prop: "backgroundColor" | "color" | "borderTopColor" | "borderBottomColor" }
export interface LibraryCase {
  name: string;
  pages: Record<string, string>;
  /** All colours the library's CSS can produce: the precision universe. */
  colors: string[];
  spacing: number[];
  fontSizes: number[];
  radii: number[];
  roles: Record<string, RoleSelector>;
}

const NM = resolve("node_modules");
const link = (f: string) => `<link rel="stylesheet" href="${pathToFileURL(join(NM, f)).href}">`;
const read = (f: string) => readFileSync(join(NM, f), "utf8");

/** Every colour literal in some CSS, as #RRGGBB (alpha below 0.5 dropped, as the extractor does). */
export function cssColors(css: string): string[] {
  const out = new Set<string>(["#FFFFFF", "#000000"]);
  for (const m of css.matchAll(/#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g)) {
    let h = m[1];
    if (h.length <= 4) h = h.split("").map((c) => c + c).join("");
    if (h.length === 8 && parseInt(h.slice(6), 16) < 128) continue;
    out.add(`#${h.slice(0, 6).toUpperCase()}`);
  }
  for (const m of css.matchAll(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)/g)) {
    const a = m[4] ? (m[4].endsWith("%") ? Number(m[4].slice(0, -1)) / 100 : Number(m[4])) : 1;
    if (a < 0.5) continue;
    out.add(`#${[m[1], m[2], m[3]].map((v) => Number(v).toString(16).padStart(2, "0")).join("").toUpperCase()}`);
  }
  for (const m of css.matchAll(/hsla?\(\s*([\d.]+)(?:deg)?[,\s]+([\d.]+)%[,\s]+([\d.]+)%/g)) {
    const [h, s, l] = [Number(m[1]), Number(m[2]) / 100, Number(m[3]) / 100];
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      return Math.round(255 * (l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
    };
    out.add(`#${[f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase()}`);
  }
  return [...out];
}

const doc = (head: string, body: string, htmlAttrs = "", bodyAttrs = "") =>
  `<!doctype html><html lang="en" ${htmlAttrs}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>bench</title>${head}</head><body ${bodyAttrs}>${body}</body></html>`;

const INVOICES = [["INV-0412", "Northwind", "Paid", "$4,200.00"], ["INV-0411", "Contoso", "Due soon", "$1,150.00"], ["INV-0409", "Fabrikam", "Overdue", "$2,980.00"]];

export function bootstrap(): LibraryCase {
  const head = link("bootstrap/dist/css/bootstrap.css");
  const tone = ["success", "warning", "danger"];
  const dashboard = doc(head, `<main class="container py-5">
<div class="d-flex justify-content-between align-items-end border-bottom pb-3 mb-4"><h1>Overview</h1><button data-truth="button:primary" class="btn btn-primary">New invoice</button></div>
<div class="row g-4 mb-4">${["Revenue $48,210", "Outstanding $9,830", "Paid on time 87%"].map((s) => `<div class="col-4"><div data-truth="card:stat" class="card"><div class="card-body"><p class="text-body-secondary small mb-1">${s.split(" $")[0].replace(/ \d+%$/, "")}</p><h2 class="mb-0">${s.match(/[\d$,%]+$/)![0]}</h2></div></div></div>`).join("")}</div>
<div data-truth="card:default" class="card"><div class="card-header">Recent invoices</div><div class="card-body">
<table data-truth="table:default" class="table mb-0"><thead><tr><th>Invoice</th><th>Customer</th><th>Status</th><th class="text-end">Amount</th></tr></thead><tbody>
${INVOICES.map((r, i) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td><span data-truth="badge:${tone[i]}" class="badge text-bg-${tone[i]}">${r[2]}</span></td><td class="text-end">${r[3]}</td></tr>`).join("")}
</tbody></table></div></div>
<div class="d-flex gap-2 mt-4"><button data-truth="button:secondary" class="btn btn-outline-secondary">Export</button><button data-truth="button:danger" class="btn btn-danger">Void invoice</button></div></main>`);
  const settings = doc(head, `<main class="container py-5" style="max-width:720px"><h1 class="border-bottom pb-3 mb-4">Settings</h1>
<div data-truth="card:default" class="card mb-4"><div class="card-body"><h2 class="h5 mb-3">Profile</h2><div class="row g-3 mb-3">
<div class="col-6"><label class="form-label" for="n">Full name</label><input data-truth="input:default" class="form-control" id="n" value="Ada Okafor"></div>
<div class="col-6"><label class="form-label" for="e">Email</label><input data-truth="input:default" class="form-control" id="e" value="ada@northwind.co"></div></div>
<button data-truth="button:primary" class="btn btn-primary">Save profile</button></div></div>
<div data-truth="card:default" class="card"><div class="card-body"><h2 class="h5 mb-3">Danger zone</h2><button data-truth="button:danger" class="btn btn-danger">Delete workspace</button></div></div></main>`);
  return {
    name: "bootstrap 5",
    pages: { dashboard, settings },
    colors: cssColors(read("bootstrap/dist/css/bootstrap.css")),
    // $spacers 0.25/0.5/1/1.5/3rem and the component paddings Bootstrap defines as variables.
    spacing: [4, 8, 16, 24, 48],
    fontSizes: [40, 32, 28, 24, 20, 16, 14, 12],
    radii: [4, 6, 8, 16],
    roles: {
      background: { selector: "body", prop: "backgroundColor" },
      text: { selector: "body", prop: "color" },
      accent: { selector: ".btn-primary", prop: "backgroundColor" },
      border: { selector: ".form-control", prop: "borderTopColor" },
    },
  };
}

/** Bulma v1 builds colours at runtime from --bulma-<name>-h/-s/-l variables; evaluate them. */
function bulmaColors(css: string): string[] {
  const vals = (re: RegExp) => {
    const m = new Map<string, Set<number>>();
    for (const x of css.matchAll(re)) m.set(x[1], (m.get(x[1]) ?? new Set()).add(Number(x[2])));
    return m;
  };
  const hs = vals(/--bulma-([a-z]+)-h:\s*([\d.]+)deg/g);
  const ss = vals(/--bulma-([a-z]+)-s:\s*([\d.]+)%/g);
  const ls = vals(/--bulma-([a-z]+)(?:-[a-z0-9-]+)?-l:\s*(-?[\d.]+)%/g);
  const out: string[] = [];
  for (const [name, hSet] of hs) {
    for (const h of hSet) for (const sat of ss.get(name) ?? [0]) for (const l of ls.get(name) ?? []) {
      if (l < 0 || l > 100) continue;
      out.push(...cssColors(`hsl(${h}, ${sat}%, ${l}%)`));
    }
  }
  return out;
}

export function bulma(): LibraryCase {
  const head = link("bulma/css/bulma.css");
  const tone = ["success", "warning", "danger"];
  const dashboard = doc(head, `<section class="section"><div class="container">
<div class="level"><div class="level-left"><h1 class="title is-2">Overview</h1></div><div class="level-right"><button data-truth="button:primary" class="button is-primary">New invoice</button></div></div>
<div class="columns">${[["Revenue", "$48,210"], ["Outstanding", "$9,830"], ["Paid on time", "87%"]].map(([l, v]) => `<div class="column"><div data-truth="card:stat" class="box"><p class="heading">${l}</p><p class="title is-3">${v}</p></div></div>`).join("")}</div>
<div data-truth="card:default" class="box"><h2 class="title is-5">Recent invoices</h2>
<table data-truth="table:default" class="table is-fullwidth"><thead><tr><th>Invoice</th><th>Customer</th><th>Status</th><th>Amount</th></tr></thead><tbody>
${INVOICES.map((r, i) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td><span data-truth="badge:${tone[i]}" class="tag is-${tone[i]}">${r[2]}</span></td><td>${r[3]}</td></tr>`).join("")}
</tbody></table></div>
<div class="buttons"><button data-truth="button:secondary" class="button">Export</button><button data-truth="button:danger" class="button is-danger">Void invoice</button></div></div></section>`);
  const settings = doc(head, `<section class="section"><div class="container" style="max-width:720px"><h1 class="title is-2">Settings</h1>
<div data-truth="card:default" class="box"><h2 class="title is-5">Profile</h2><div class="columns">
<div class="column field"><label class="label" for="n">Full name</label><div class="control"><input data-truth="input:default" class="input" id="n" value="Ada Okafor"></div></div>
<div class="column field"><label class="label" for="e">Email</label><div class="control"><input data-truth="input:default" class="input" id="e" value="ada@northwind.co"></div></div></div>
<button data-truth="button:primary" class="button is-primary">Save profile</button></div>
<div data-truth="card:default" class="box"><h2 class="title is-5">Danger zone</h2><button data-truth="button:danger" class="button is-danger">Delete workspace</button></div></div></section>`);
  return {
    name: "bulma 1",
    pages: { dashboard, settings },
    colors: [...new Set([...cssColors(read("bulma/css/bulma.css")), ...bulmaColors(read("bulma/css/bulma.css"))])],
    spacing: [4, 8, 12, 16, 20, 24, 32, 48, 64, 96],
    fontSizes: [48, 40, 32, 24, 20, 16, 12],
    radii: [4, 6, 12],
    roles: {
      background: { selector: "body", prop: "backgroundColor" },
      text: { selector: "body", prop: "color" },
      accent: { selector: ".button.is-primary", prop: "backgroundColor" },
      border: { selector: ".input", prop: "borderTopColor" },
    },
  };
}

export function carbon(): LibraryCase {
  // Spacing and type scales are IBM's published @carbon/layout and @carbon/type values.
  const head = link("@carbon/styles/css/styles.css") + `<style>body{background:var(--cds-background);color:var(--cds-text-primary);font-family:'IBM Plex Sans',sans-serif}</style>`;
  const tag = ["green", "warm-gray", "red"];
  const tone = ["success", "warning", "danger"];
  const dashboard = doc(head, `<main class="cds--css-grid" style="padding:2rem">
<div class="cds--css-grid-column cds--col-span-100" style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:2rem"><h1 class="cds--type-heading-05">Overview</h1><button data-truth="button:primary" class="cds--btn cds--btn--primary">New invoice</button></div>
${[["Revenue", "$48,210"], ["Outstanding", "$9,830"], ["Paid on time", "87%"]].map(([l, v]) => `<div class="cds--css-grid-column cds--col-span-4"><div data-truth="card:stat" class="cds--tile"><p class="cds--type-label-01">${l}</p><p class="cds--type-heading-04">${v}</p></div></div>`).join("")}
<div class="cds--css-grid-column cds--col-span-100" style="margin-top:2rem"><div data-truth="card:default" class="cds--tile"><h2 class="cds--type-heading-02" style="margin-bottom:1rem">Recent invoices</h2>
<table data-truth="table:default" class="cds--data-table"><thead><tr><th><span class="cds--table-header-label">Invoice</span></th><th><span class="cds--table-header-label">Customer</span></th><th><span class="cds--table-header-label">Status</span></th><th><span class="cds--table-header-label">Amount</span></th></tr></thead><tbody>
${INVOICES.map((r, i) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td><span data-truth="badge:${tone[i]}" class="cds--tag cds--tag--${tag[i]}"><span class="cds--tag__label">${r[2]}</span></span></td><td>${r[3]}</td></tr>`).join("")}
</tbody></table></div>
<div style="display:flex;gap:1rem;margin-top:2rem"><button data-truth="button:secondary" class="cds--btn cds--btn--secondary">Export</button><button data-truth="button:danger" class="cds--btn cds--btn--danger">Void invoice</button></div></div></main>`);
  const settings = doc(head, `<main style="padding:2rem;max-width:720px"><h1 class="cds--type-heading-05" style="margin-bottom:2rem">Settings</h1>
<div data-truth="card:default" class="cds--tile" style="margin-bottom:2rem"><h2 class="cds--type-heading-02" style="margin-bottom:1rem">Profile</h2>
<div class="cds--form-item" style="margin-bottom:1rem"><label class="cds--label" for="n">Full name</label><input data-truth="input:default" class="cds--text-input" id="n" value="Ada Okafor"></div>
<div class="cds--form-item" style="margin-bottom:1rem"><label class="cds--label" for="e">Email</label><input data-truth="input:default" class="cds--text-input" id="e" value="ada@northwind.co"></div>
<button data-truth="button:primary" class="cds--btn cds--btn--primary">Save profile</button></div>
<div data-truth="card:default" class="cds--tile"><h2 class="cds--type-heading-02" style="margin-bottom:1rem">Danger zone</h2><button data-truth="button:danger" class="cds--btn cds--btn--danger">Delete workspace</button></div></main>`);
  return {
    name: "carbon (IBM)",
    pages: { dashboard, settings },
    colors: cssColors(read("@carbon/styles/css/styles.css")),
    spacing: [2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 160],
    fontSizes: [12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 54, 60, 68],
    radii: [2, 4, 8, 16],
    roles: {
      background: { selector: "body", prop: "backgroundColor" },
      text: { selector: "body", prop: "color" },
      accent: { selector: ".cds--btn--primary", prop: "backgroundColor" },
      border: { selector: ".cds--text-input", prop: "borderBottomColor" },
    },
  };
}

export const LIBRARIES = [bootstrap, bulma, carbon];
