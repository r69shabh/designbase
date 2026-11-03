Build the team members page: list of members with role and last active date, pending invitations, and a way to invite someone by email.

Write it as a single React component file using Tailwind CSS classes. Output only the file.

Follow this design brief exactly:

# Design brief: Build the team members page: list of members with role and last active date, pending invitations, and a way to invite someone by email.

Playbook: **Almanac** — Sample playbook: an editorial, paper-and-ink system. Flat surfaces, hairline borders, one warm accent. Replace with your own.

## Voice

Almanac reads like a well-set printed ledger, not a SaaS template.

- **Flat, not floaty.** No shadows, no gradients, no glassmorphism. Depth comes from hairline `line` borders and the `paper-2` recessed surface.
- **Whitespace over dividers.** Separate groups with space (24-48px) before reaching for a border.
- **Type does the hierarchy.** Fraunces for titles and hero numbers, Plex Sans for everything else. Don't use colour or boxes to create emphasis that size and weight could create.
- **One accent, used sparingly.** `accent` marks the single most important action on a screen and the active state. If everything is orange, nothing is.
- **Dense but calm.** Tables and lists are compact (12-16px row padding); page margins are generous (48-64px on desktop).
- **Left-aligned.** Content hangs from a left edge. Centred layouts only for empty states and auth.
- **Numbers are tabular.** Money, counts and IDs use `font-mono` so columns line up.
- **Copy is plain.** Sentence case everywhere. Buttons are verbs ("Save changes", not "Submit"). No exclamation marks.

## Hard rules (the checker enforces these)

- **Only palette colours.** Use a palette token: bg-paper, text-ink-2, border-line, bg-accent...
- **No arbitrary Tailwind values.** Pick the nearest token from the scale.
- **Spacing from the scale only.** p-5 (20px) → p-4 or p-6. gap-10 (40px) → gap-8 or gap-12.
- **Font sizes from the type scale.** Use text-xs, text-sm, text-base, text-lg, text-xl, text-2xl or text-3xl.
- **Fraunces, Plex Sans, Plex Mono only.** font-display for titles, font-body for text, font-mono for numbers.
- **Radius: none, sm (2), md (6), full.** Cards and inputs: rounded-md. Badges: rounded-full. Tables: rounded-none.
- **No shadows.** Replace shadow-* with border border-line.
- **No gradients.** Use a single palette fill.
- **Use playbook components.** Import Button, Field, DataTable, etc. from the components folder.
- **No inline style values.** Use token classes.
- **Images need alt text.** Add alt="..." (alt="" for decorative).
- **Text contrast ≥ 4.5:1 (3:1 for large text).** Use ink / ink-2 / ink-3 on paper surfaces, accent-ink on accent.
- **No horizontal scroll at 375px.** Stack columns below md:, let tables scroll inside their own container.
- At most one primary button per view (warning). Demote the others to variant="secondary" or "ghost".
- One h1, no skipped heading levels (warning). h1 → h2 → h3 in order.

## Tokens (Tailwind class names in backticks)

Colours:
- `paper` #F4F1EA — Page background. The default surface. Never use pure white.
- `paper-2` #EAE5D9 — Recessed surface: table header, hover fill, sidebar.
- `ink` #1B1A17 — Primary text, strong borders, secondary button outline.
- `ink-2` #4D4A42 — Body copy and labels.
- `ink-3` #66625A — Meta text: timestamps, helper text, captions.
- `line` #D6D0C2 — Hairline dividers and card borders.
- `accent` #B8401A — The single call-to-action colour. Primary button, active nav, focus ring.
- `accent-ink` #F4F1EA — Text on accent fills.
- `moss` #2F6B4F — Success / positive deltas.
- `ochre` #8A5F12 — Warning / pending.
- `brick` #9E3326 — Error / destructive / negative deltas.

Fonts:
- `font-display` Fraunces — Page titles, section headings, big numbers. Weights 500-600.
- `font-body` IBM Plex Sans — Everything else. Weights 400 and 500 only.
- `font-mono` IBM Plex Mono — Tabular numbers, IDs, code, keyboard hints.

Type scale: `text-xs` 12px, `text-sm` 14px, `text-base` 16px, `text-lg` 20px, `text-xl` 28px, `text-2xl` 40px, `text-3xl` 56px
Spacing scale: 0=0px, 1=4px, 2=8px, 3=12px, 4=16px, 6=24px, 8=32px, 12=48px, 16=64px, 24=96px (use only these numbers in p-/m-/gap-/space-)
Radius: `rounded-none` 0px, `rounded-sm` 2px, `rounded-md` 6px, `rounded-full` pill
Shadows: none — do not use shadow-*

## Pattern: List with empty state

Page header with primary create action, optional filter row, DataTable; EmptyState instead of the table when there are no rows.

Skeleton:
```tsx
<main class="px-6 py-12 md:px-16">
  <PageHeader actions={<Button variant="primary">New …</Button>}/>
  <div class="mb-6 flex gap-3"> <Field label="Search"/> </div>
  {rows.length ? <DataTable/> : <EmptyState/>}
</main>
```

Rhythm: 24px between filter row and table.

## Components to use (import from the playbook's components folder; do not re-create them)

### Field

Labelled text input with hint and error text. Label above, 48px tall, accent focus ring.

Props: `label: string; hint?: string; error?: string; + input attributes`
Do: Always pass a visible label; Show errors under the field, in brick
Don't: Placeholder-as-label; Raw <input>

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

### PageHeader

Top of every page: optional mono eyebrow, Fraunces h1, description, actions on the right. Owns the page's only h1.

Props: `eyebrow?: string; title: string; description?: string; actions?: ReactNode`
Do: Put the page's primary Button here
Don't: A second h1 elsewhere on the page

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

### DataTable

Compact table: ink top/bottom rule, paper-2 header, hairline rows, mono numerals right-aligned. Scrolls horizontally inside its own container.

Props: `columns: Column<T>[] (key, header, align?, numeric?, render?); rows: T[]`
Do: Right-align and mark numeric columns; Use Badge for status columns
Don't: Zebra stripes; Raw <table>

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

### EmptyState

Centred, dashed-border placeholder for empty lists with title, one sentence and one action.

Props: `title: string; body: string; action?: ReactNode`
Do: Say what will appear here and how to create it
Don't: Illustrations or emoji

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

Props: `product: string; items: {label, href, active?, count?}[]`
Do: Collapse to a top bar below md
Don't: Icons-only navigation; Accent-filled active item

### Button

The only clickable action. Variants: primary (accent, max one per view), secondary (ink outline, the default), ghost (tertiary), danger (destructive).

Props: `variant?: 'primary'|'secondary'|'ghost'|'danger'; size?: 'sm'|'md'`
Do: Label with a verb: "Save changes"; Put the primary action last (rightmost) in a button group
Don't: Two primary buttons on one screen; A raw <button> or a styled <a> pretending to be a button

### Badge

Outlined pill for status. Tones: neutral, positive (moss), warning (ochre), negative (brick), accent.

Props: `tone?: 'neutral'|'positive'|'warning'|'negative'|'accent'`
Do: One or two words, sentence case
Don't: Filled colour backgrounds

Also available if needed: Card (A bordered group of related content with an optional title and header action); StatTile (A key number with label, delta and caption).

## Before you finish

Run the `check` tool on every file you wrote and fix every error it reports. Repeat until it passes.
