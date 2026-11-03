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
