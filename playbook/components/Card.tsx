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
