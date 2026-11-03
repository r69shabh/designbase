Build the sign-in screen with email and password, a forgot-password link, and a link to create an account.

Write it as a single React component file using Tailwind CSS classes. Output only the file.

Follow this design system exactly:

# Almanac playbook

Almanac reads like a well-set printed ledger, not a SaaS template.

- **Flat, not floaty.** No shadows, no gradients, no glassmorphism. Depth comes from hairline `line` borders and the `paper-2` recessed surface.
- **Whitespace over dividers.** Separate groups with space (24-48px) before reaching for a border.
- **Type does the hierarchy.** Fraunces for titles and hero numbers, Plex Sans for everything else. Don't use colour or boxes to create emphasis that size and weight could create.
- **One accent, used sparingly.** `accent` marks the single most important action on a screen and the active state. If everything is orange, nothing is.
- **Dense but calm.** Tables and lists are compact (12-16px row padding); page margins are generous (48-64px on desktop).
- **Left-aligned.** Content hangs from a left edge. Centred layouts only for empty states and auth.
- **Numbers are tabular.** Money, counts and IDs use `font-mono` so columns line up.
- **Copy is plain.** Sentence case everywhere. Buttons are verbs ("Save changes", not "Submit"). No exclamation marks.

## Tokens
```json
{
  "name": "Almanac",
  "description": "Sample playbook: an editorial, paper-and-ink system. Flat surfaces, hairline borders, one warm accent. Replace with your own.",
  "color": {
    "paper": {
      "value": "#F4F1EA",
      "role": "Page background. The default surface. Never use pure white."
    },
    "paper-2": {
      "value": "#EAE5D9",
      "role": "Recessed surface: table header, hover fill, sidebar."
    },
    "ink": {
      "value": "#1B1A17",
      "role": "Primary text, strong borders, secondary button outline."
    },
    "ink-2": {
      "value": "#4D4A42",
      "role": "Body copy and labels."
    },
    "ink-3": {
      "value": "#66625A",
      "role": "Meta text: timestamps, helper text, captions."
    },
    "line": {
      "value": "#D6D0C2",
      "role": "Hairline dividers and card borders."
    },
    "accent": {
      "value": "#B8401A",
      "role": "The single call-to-action colour. Primary button, active nav, focus ring."
    },
    "accent-ink": {
      "value": "#F4F1EA",
      "role": "Text on accent fills."
    },
    "moss": {
      "value": "#2F6B4F",
      "role": "Success / positive deltas."
    },
    "ochre": {
      "value": "#8A5F12",
      "role": "Warning / pending."
    },
    "brick": {
      "value": "#9E3326",
      "role": "Error / destructive / negative deltas."
    }
  },
  "font": {
    "display": {
      "family": "Fraunces",
      "use": "Page titles, section headings, big numbers. Weights 500-600."
    },
    "body": {
      "family": "IBM Plex Sans",
      "use": "Everything else. Weights 400 and 500 only."
    },
    "mono": {
      "family": "IBM Plex Mono",
      "use": "Tabular numbers, IDs, code, keyboard hints."
    }
  },
  "fontSize": {
    "xs": 12,
    "sm": 14,
    "base": 16,
    "lg": 20,
    "xl": 28,
    "2xl": 40,
    "3xl": 56
  },
  "spacing": {
    "0": 0,
    "1": 4,
    "2": 8,
    "3": 12,
    "4": 16,
    "6": 24,
    "8": 32,
    "12": 48,
    "16": 64,
    "24": 96
  },
  "radius": {
    "none": 0,
    "sm": 2,
    "md": 6,
    "full": 9999
  },
  "shadow": {},
  "breakpoints": {
    "sm": 640,
    "md": 768,
    "lg": 1024,
    "xl": 1280
  }
}
```
## Rules
```json
[
  {
    "id": "no-raw-colors",
    "severity": "error",
    "kind": "lint+visual",
    "title": "Only palette colours",
    "why": "Raw hex/rgb values and Tailwind's default palette (blue-500, gray-100...) bypass the system.",
    "fix": "Use a palette token: bg-paper, text-ink-2, border-line, bg-accent..."
  },
  {
    "id": "no-arbitrary-values",
    "severity": "error",
    "kind": "lint",
    "title": "No arbitrary Tailwind values",
    "why": "p-[13px], text-[15px], bg-[#fff] are off-system by definition.",
    "fix": "Pick the nearest token from the scale."
  },
  {
    "id": "spacing-scale",
    "severity": "error",
    "kind": "lint+visual",
    "title": "Spacing from the scale only",
    "why": "Rhythm comes from a fixed 4/8 scale: 0, 4, 8, 12, 16, 24, 32, 48, 64, 96px (Tailwind 0,1,2,3,4,6,8,12,16,24).",
    "fix": "p-5 (20px) → p-4 or p-6. gap-10 (40px) → gap-8 or gap-12."
  },
  {
    "id": "type-scale",
    "severity": "error",
    "kind": "lint+visual",
    "title": "Font sizes from the type scale",
    "why": "Sizes are 12, 14, 16, 20, 28, 40, 56px (text-xs..text-3xl).",
    "fix": "Use text-xs, text-sm, text-base, text-lg, text-xl, text-2xl or text-3xl."
  },
  {
    "id": "font-families",
    "severity": "error",
    "kind": "lint+visual",
    "title": "Fraunces, Plex Sans, Plex Mono only",
    "why": "Generic fonts (Inter, Roboto, Arial, system-ui) erase the voice.",
    "fix": "font-display for titles, font-body for text, font-mono for numbers."
  },
  {
    "id": "radius-scale",
    "severity": "error",
    "kind": "lint+visual",
    "title": "Radius: none, sm (2), md (6), full",
    "why": "Big soft corners (rounded-xl, rounded-2xl) are the generic-AI look.",
    "fix": "Cards and inputs: rounded-md. Badges: rounded-full. Tables: rounded-none."
  },
  {
    "id": "no-shadows",
    "severity": "error",
    "kind": "lint+visual",
    "title": "No shadows",
    "why": "Almanac is flat. Elevation is shown with a 1px line border.",
    "fix": "Replace shadow-* with border border-line."
  },
  {
    "id": "no-gradients",
    "severity": "error",
    "kind": "lint",
    "title": "No gradients",
    "why": "Flat colour only.",
    "fix": "Use a single palette fill."
  },
  {
    "id": "use-components",
    "severity": "error",
    "kind": "lint",
    "title": "Use playbook components",
    "why": "Hand-rolled <button>, <input>, <table> drift from the system and miss states.",
    "fix": "Import Button, Field, DataTable, etc. from the components folder."
  },
  {
    "id": "one-primary-action",
    "severity": "warn",
    "kind": "lint",
    "title": "At most one primary button per view",
    "why": "The accent marks the single most important action.",
    "fix": "Demote the others to variant=\"secondary\" or \"ghost\"."
  },
  {
    "id": "no-inline-styles",
    "severity": "error",
    "kind": "lint",
    "title": "No inline style values",
    "why": "style={{ padding: 18, color: '#333' }} skips every token.",
    "fix": "Use token classes."
  },
  {
    "id": "heading-order",
    "severity": "warn",
    "kind": "lint",
    "title": "One h1, no skipped heading levels",
    "why": "Hierarchy and accessibility.",
    "fix": "h1 → h2 → h3 in order."
  },
  {
    "id": "img-alt",
    "severity": "error",
    "kind": "lint",
    "title": "Images need alt text",
    "why": "Accessibility.",
    "fix": "Add alt=\"...\" (alt=\"\" for decorative)."
  },
  {
    "id": "contrast",
    "severity": "error",
    "kind": "visual",
    "title": "Text contrast ≥ 4.5:1 (3:1 for large text)",
    "why": "Accessibility. Every palette text colour passes on paper; mixing surfaces can break it.",
    "fix": "Use ink / ink-2 / ink-3 on paper surfaces, accent-ink on accent."
  },
  {
    "id": "no-horizontal-overflow",
    "severity": "error",
    "kind": "visual",
    "title": "No horizontal scroll at 375px",
    "why": "Layouts must reflow on phones.",
    "fix": "Stack columns below md:, let tables scroll inside their own container."
  }
]
```
## Patterns
```json
[
  {
    "name": "Dashboard overview",
    "keywords": [
      "dashboard",
      "overview",
      "home",
      "analytics",
      "metrics",
      "stats",
      "kpi",
      "report",
      "summary",
      "admin"
    ],
    "summary": "Page header, a row of 3-4 StatTiles, then one or two Cards (chart / recent activity) above a DataTable.",
    "components": [
      "SideNav",
      "PageHeader",
      "StatTile",
      "Card",
      "DataTable",
      "Badge",
      "Button"
    ],
    "skeleton": "<div class=\"flex min-h-screen bg-paper\">\n  <SideNav/>\n  <main class=\"flex-1 px-6 py-12 md:px-16\">\n    <PageHeader actions={<Button variant=\"primary\"/>}/>\n    <div class=\"grid grid-cols-2 gap-8 md:grid-cols-4\">  {StatTile x4}\n    <div class=\"mt-16 grid gap-8 lg:grid-cols-3\">  <Card class=\"lg:col-span-2\"/> <Card/>\n    <section class=\"mt-16\"> <h2/> <DataTable/>\n  </main>\n</div>",
    "rhythm": "Page padding 64px desktop / 24px mobile. 32px between tiles. 64px between major sections. Section headings (h2) 16px above their content.",
    "exemplar": "exemplars/dashboard.html"
  },
  {
    "name": "Settings page",
    "keywords": [
      "settings",
      "preferences",
      "account",
      "profile",
      "configuration",
      "billing",
      "team",
      "form",
      "edit"
    ],
    "summary": "Page header, then stacked Cards, one per topic, each with Fields and a right-aligned secondary save. Danger zone last.",
    "components": [
      "SideNav",
      "PageHeader",
      "Card",
      "Field",
      "Button",
      "Badge"
    ],
    "skeleton": "<main class=\"mx-auto max-w-3xl px-6 py-12\">\n  <PageHeader/>\n  <div class=\"flex flex-col gap-8\">\n    <Card title=\"Profile\"> <div class=\"grid gap-6 md:grid-cols-2\">Field...</div> <footer class=\"mt-6 flex justify-end\"><Button/></footer></Card>\n    <Card title=\"Danger zone\"> <Button variant=\"danger\"/></Card>\n  </div>\n</main>",
    "rhythm": "Max width 768px. 32px between cards, 24px between fields, 24px above card footers.",
    "exemplar": "exemplars/settings.html"
  },
  {
    "name": "Auth form",
    "keywords": [
      "login",
      "signin",
      "sign",
      "signup",
      "register",
      "auth",
      "password",
      "reset",
      "onboarding",
      "welcome"
    ],
    "summary": "Centred single column, product wordmark in Fraunces, 2-3 Fields, one full-width primary Button, one quiet ghost link below.",
    "components": [
      "Field",
      "Button"
    ],
    "skeleton": "<main class=\"flex min-h-screen items-center justify-center bg-paper px-6\">\n  <div class=\"flex w-full max-w-sm flex-col gap-6\">\n    <h1 class=\"font-display text-xl\"/>\n    <Field/> <Field/>\n    <Button variant=\"primary\" class=\"w-full\"/>\n    <Button variant=\"ghost\" size=\"sm\"/>\n  </div>\n</main>",
    "rhythm": "Max width 384px. 24px between fields. No card around the form: it sits directly on paper.",
    "exemplar": null
  },
  {
    "name": "List with empty state",
    "keywords": [
      "list",
      "index",
      "table",
      "empty",
      "projects",
      "items",
      "invoices",
      "customers",
      "collection",
      "browse"
    ],
    "summary": "Page header with primary create action, optional filter row, DataTable; EmptyState instead of the table when there are no rows.",
    "components": [
      "PageHeader",
      "DataTable",
      "EmptyState",
      "Button",
      "Badge",
      "Field"
    ],
    "skeleton": "<main class=\"px-6 py-12 md:px-16\">\n  <PageHeader actions={<Button variant=\"primary\">New …</Button>}/>\n  <div class=\"mb-6 flex gap-3\"> <Field label=\"Search\"/> </div>\n  {rows.length ? <DataTable/> : <EmptyState/>}\n</main>",
    "rhythm": "24px between filter row and table.",
    "exemplar": null
  }
]
```
## Components
### Button
The only clickable action. Variants: primary (accent, max one per view), secondary (ink outline, the default), ghost (tertiary), danger (destructive).
```tsx
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-ink border border-accent hover:bg-ink hover:border-ink",
  secondary: "bg-paper text-ink border border-ink hover:bg-paper-2",
  ghost: "bg-transparent text-ink-2 border border-transparent hover:text-ink hover:border-line",
  danger: "bg-paper text-brick border border-brick hover:bg-paper-2",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 gap-2 text-sm",
  md: "h-12 px-4 gap-2 text-base",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant = "secondary", size = "md", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md font-body font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
```
### Card
A bordered group of related content with an optional title and header action. Flat, 1px line border, 24px padding.
```tsx
import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  title?: string;
  action?: ReactNode;
}

export function Card({ title, action, children, className = "", ...props }: CardProps) {
  return (
    <section className={`rounded-md border border-line bg-paper p-6 ${className}`} {...props}>
      {(title || action) && (
        <header className="mb-4 flex items-baseline justify-between gap-4">
          {title && <h2 className="font-display text-lg font-medium text-ink">{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
```
### Field
Labelled text input with hint and error text. Label above, 48px tall, accent focus ring.
```tsx
import type { InputHTMLAttributes } from "react";
import { useId } from "react";

export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export function Field({ label, hint, error, className = "", ...props }: FieldProps) {
  const id = useId();
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={id} className="font-body text-sm font-medium text-ink">{label}</label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={hint || error ? `${id}-note` : undefined}
        className={`h-12 rounded-md border bg-paper px-3 font-body text-base text-ink placeholder:text-ink-3 focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-accent ${error ? "border-brick" : "border-line"}`}
        {...props}
      />
      {(error || hint) && (
        <p id={`${id}-note`} className={`font-body text-sm ${error ? "text-brick" : "text-ink-3"}`}>{error ?? hint}</p>
      )}
    </div>
  );
}
```
### Badge
Outlined pill for status. Tones: neutral, positive (moss), warning (ochre), negative (brick), accent.
```tsx
type Tone = "neutral" | "positive" | "warning" | "negative" | "accent";

const tones: Record<Tone, string> = {
  neutral: "border-line text-ink-2",
  positive: "border-moss text-moss",
  warning: "border-ochre text-ochre",
  negative: "border-brick text-brick",
  accent: "border-accent text-accent",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 font-body text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}
```
### StatTile
A key number with label, delta and caption. Ink rule on top, Fraunces numeral, mono delta.
```tsx
export interface StatTileProps {
  label: string;
  value: string;
  delta?: { value: string; direction: "up" | "down" };
  caption?: string;
}

export function StatTile({ label, value, delta, caption }: StatTileProps) {
  return (
    <div className="flex flex-col gap-2 border-t border-ink pt-3">
      <span className="font-body text-sm text-ink-2">{label}</span>
      <span className="font-display text-2xl font-medium text-ink tabular-nums">{value}</span>
      {(delta || caption) && (
        <span className="flex items-baseline gap-2 font-mono text-xs">
          {delta && (
            <span className={delta.direction === "up" ? "text-moss" : "text-brick"}>
              {delta.direction === "up" ? "▲" : "▼"} {delta.value}
            </span>
          )}
          {caption && <span className="text-ink-3">{caption}</span>}
        </span>
      )}
    </div>
  );
}
```
### DataTable
Compact table: ink top/bottom rule, paper-2 header, hairline rows, mono numerals right-aligned. Scrolls horizontally inside its own container.
```tsx
import type { ReactNode } from "react";

export interface Column<T> {
  key: keyof T & string;
  header: string;
  align?: "left" | "right";
  numeric?: boolean;
  render?: (row: T) => ReactNode;
}

export function DataTable<T extends { id: string }>({ columns, rows }: { columns: Column<T>[]; rows: T[] }) {
  return (
    <div className="overflow-x-auto border-y border-ink">
      <table className="w-full border-collapse font-body text-sm">
        <thead className="bg-paper-2">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={`px-3 py-2 font-medium text-ink-2 ${c.align === "right" ? "text-right" : "text-left"}`}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-line hover:bg-paper-2">
              {columns.map((c) => (
                <td key={c.key} className={`px-3 py-3 text-ink ${c.numeric ? "font-mono tabular-nums" : ""} ${c.align === "right" ? "text-right" : "text-left"}`}>
                  {c.render ? c.render(row) : String(row[c.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```
### PageHeader
Top of every page: optional mono eyebrow, Fraunces h1, description, actions on the right. Owns the page's only h1.
```tsx
import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="mb-12 flex flex-col gap-4 border-b border-line pb-6 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col gap-2">
        {eyebrow && <span className="font-mono text-xs uppercase tracking-widest text-ink-3">{eyebrow}</span>}
        <h1 className="font-display text-2xl font-medium text-ink md:text-3xl">{title}</h1>
        {description && <p className="max-w-prose font-body text-base text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex gap-3">{actions}</div>}
    </header>
  );
}
```
### EmptyState
Centred, dashed-border placeholder for empty lists with title, one sentence and one action.
```tsx
import type { ReactNode } from "react";

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-line px-6 py-16 text-center">
      <span aria-hidden className="font-display text-2xl text-ink-3">§</span>
      <h2 className="font-display text-lg font-medium text-ink">{title}</h2>
      <p className="max-w-sm font-body text-sm text-ink-2">{body}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
```
### SideNav
App sidebar on paper-2 with product name and links; active item marked with an accent left rule.
```tsx
export interface NavItem { label: string; href: string; active?: boolean; count?: number }

export function SideNav({ product, items }: { product: string; items: NavItem[] }) {
  return (
    <nav className="flex h-full w-full flex-col gap-8 border-r border-line bg-paper-2 px-4 py-6 md:w-64">
      <span className="font-display text-lg font-semibold text-ink">{product}</span>
      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={`flex items-center justify-between rounded-sm border-l-2 px-3 py-2 font-body text-sm ${item.active ? "border-accent text-ink font-medium" : "border-transparent text-ink-2 hover:text-ink"}`}
            >
              {item.label}
              {item.count !== undefined && <span className="font-mono text-xs text-ink-3">{item.count}</span>}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```
