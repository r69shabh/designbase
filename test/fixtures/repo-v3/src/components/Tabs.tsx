import * as TabsPrimitive from "@radix-ui/react-tabs";
import { tv } from "tailwind-variants";

const triggerVariants = tv({
  base: ["px-3 py-2 text-sm", "border-b border-transparent"],
  variants: { tone: { neutral: "text-foreground", brand: ["text-brand-500", "border-brand-500"] } },
  defaultVariants: { tone: "neutral" },
});

const Tabs = TabsPrimitive.Root;

function TabsList(props: TabsPrimitive.TabsListProps) {
  return <TabsPrimitive.List className="flex gap-2 border-b border-border" {...props} />;
}

function TabsTrigger({ tone, ...props }: TabsPrimitive.TabsTriggerProps & { tone?: "neutral" | "brand" }) {
  return <TabsPrimitive.Trigger className={triggerVariants({ tone })} {...props} />;
}

export { Tabs, TabsList, TabsTrigger };
