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
