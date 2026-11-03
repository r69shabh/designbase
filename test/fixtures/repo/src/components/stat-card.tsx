import { Card, CardContent } from "@/components/ui/card";

type Trend = "up" | "down";

/** A KPI with label, big number and trend. */
export default function StatCard({ label, value, trend, delta }: { label: string; value: string; trend?: Trend; delta?: string }) {
  return (
    <Card>
      <CardContent>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
        {delta && <p className={trend === "down" ? "text-destructive" : "text-primary"}>{delta}</p>}
      </CardContent>
    </Card>
  );
}
