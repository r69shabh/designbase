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
