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
