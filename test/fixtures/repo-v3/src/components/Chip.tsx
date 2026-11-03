import { tv, type VariantProps } from "tailwind-variants";

const chip = tv({
  base: ["inline-flex items-center rounded-md px-2 py-1", "text-xs"],
  variants: {
    tone: { neutral: "bg-background text-foreground", brand: ["bg-brand-50", "text-brand-900"] },
    size: { sm: "text-xs", md: "text-sm" },
  },
  defaultVariants: { tone: "neutral", size: "sm" },
});

export function Chip({ tone, size, ...props }: VariantProps<typeof chip> & React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={chip({ tone, size })} {...props} />;
}
