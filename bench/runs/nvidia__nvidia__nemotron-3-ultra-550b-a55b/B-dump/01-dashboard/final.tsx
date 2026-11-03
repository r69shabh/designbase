import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { SideNav } from "@/components/SideNav";
import { StatTile } from "@/components/StatTile";
import { Badge } from "@/components/Badge";

const navItems = [
  { label: "Dashboard", href: "/", active: true },
  { label: "Invoices", href: "/invoices", count: 24 },
  { label: "Customers", href: "/customers", count: 18 },
  { label: "Reports", href: "/reports" },
  { label: "Settings", href: "/settings" },
];

const statTiles = [
  {
    label: "Monthly revenue",
    value: "$48,750",
    delta: { value: "+12.3%", direction: "up" as const },
    caption: "vs last month",
  },
  {
    label: "Outstanding balance",
    value: "$23,410",
    delta: { value: "-4.1%", direction: "down" as const },
    caption: "across 7 invoices",
  },
  {
    label: "On-time payment rate",
    value: "87%",
    delta: { value: "+2.1%", direction: "up" as const },
    caption: "30-day rolling",
  },
  {
    label: "Active customers",
    value: "18",
    delta: { value: "+2", direction: "up" as const },
    caption: "new this month",
  },
];

const weeklyCollections = [
  { week: "Jun 2–8", collected: 12400 },
  { week: "Jun 9–15", collected: 18900 },
  { week: "Jun 16–22", collected: 9800 },
  { week: "Jun 23–29", collected: 15600 },
  { week: "Jun 30–Jul 6", collected: 21200 },
  { week: "Jul 7–13", collected: 17800 },
  { week: "Jul 14–20", collected: 24500 },
];

const maxCollected = Math.max(...weeklyCollections.map((w) => w.collected));
const chartHeight = 160;
const chartWidth = 560;
const barWidth = 48;
const gap = 24;
const startX = 40;
const bottomY = chartHeight - 20;

const recentActivity = [
  {
    id: "1",
    type: "Payment received",
    description: "Acme Corp paid invoice INV-2024-0142",
    amount: "$4,200",
    time: "2 hours ago",
    tone: "positive" as const,
  },
  {
    id: "2",
    type: "Invoice sent",
    description: "Invoice INV-2024-0156 sent to Brightline Labs",
    amount: "$3,800",
    time: "5 hours ago",
    tone: "neutral" as const,
  },
  {
    id: "3",
    type: "Payment overdue",
    description: "Meridian Systems past due on INV-2024-0138",
    amount: "$6,100",
    time: "1 day ago",
    tone: "negative" as const,
  },
  {
    id: "4",
    type: "New customer",
    description: "Vertex Digital added to workspace",
    amount: "—",
    time: "2 days ago",
    tone: "accent" as const,
  },
  {
    id: "5",
    type: "Payment received",
    description: "Northwind Traders paid invoice INV-2024-0149",
    amount: "$2,950",
    time: "3 days ago",
    tone: "positive" as const,
  },
];

const recentInvoices = [
  {
    id: "INV-2024-0156",
    customer: "Brightline Labs",
    date: "Jul 18, 2024",
    due: "Aug 1, 2024",
    amount: 3800,
    status: "sent" as const,
  },
  {
    id: "INV-2024-0155",
    customer: "Acme Corp",
    date: "Jul 15, 2024",
    due: "Jul 29, 2024",
    amount: 4200,
    status: "paid" as const,
  },
  {
    id: "INV-2024-0154",
    customer: "Meridian Systems",
    date: "Jul 10, 2024",
    due: "Jul 24, 2024",
    amount: 6100,
    status: "overdue" as const,
  },
  {
    id: "INV-2024-0153",
    customer: "Northwind Traders",
    date: "Jul 8, 2024",
    due: "Jul 22, 2024",
    amount: 2950,
    status: "paid" as const,
  },
  {
    id: "INV-2024-0152",
    customer: "Vertex Digital",
    date: "Jul 5, 2024",
    due: "Jul 19, 2024",
    amount: 5400,
    status: "sent" as const,
  },
  {
    id: "INV-2024-0151",
    customer: "Globex Inc",
    date: "Jul 1, 2024",
    due: "Jul 15, 2024",
    amount: 7200,
    status: "overdue" as const,
  },
];

const statusTones: Record<string, "neutral" | "positive" | "warning" | "negative" | "accent"> = {
  paid: "positive",
  sent: "accent",
  overdue: "negative",
  draft: "neutral",
};

const statusLabels: Record<string, string> = {
  paid: "Paid",
  sent: "Sent",
  overdue: "Overdue",
  draft: "Draft",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

export default function Dashboard() {
  return (
    <div className="flex min-h-screen bg-paper">
      <SideNav product="Almanac" items={navItems} />

      <main className="flex-1 px-6 py-12 md:px-16">
        <PageHeader
          eyebrow="Invoicing"
          title="Dashboard"
          description="Overview of revenue, collections and outstanding invoices."
          actions={<Button variant="primary">Create invoice</Button>}
        />

        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {statTiles.map((stat) => (
            <StatTile key={stat.label} {...stat} />
          ))}
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          <Card title="Weekly collections" className="lg:col-span-2">
            <div className="relative h-[180px] w-full">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full" aria-hidden="true">
                <line x1={startX} y1={20} x2={startX} y2={bottomY} stroke="currentColor" strokeWidth="0.5" className="text-line" />
                <line x1={startX} y1={bottomY} x2={chartWidth - 20} y2={bottomY} stroke="currentColor" strokeWidth="0.5" className="text-line" />

                {weeklyCollections.map((week, i) => {
                  const x = startX + i * (barWidth + gap) + barWidth / 2;
                  const barHeight = (week.collected / maxCollected) * (bottomY - 40);
                  const y = bottomY - barHeight;
                  return (
                    <g key={week.week}>
                      <rect
                        x={startX + i * (barWidth + gap)}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        fill="currentColor"
                        className="text-accent"
                        rx={2}
                      />
                      <text
                        x={x}
                        y={bottomY + 16}
                        textAnchor="middle"
                        className="font-body text-xs text-ink-3"
                        dominantBaseline="hanging"
                      >
                        {week.week}
                      </text>
                      <text
                        x={x}
                        y={y - 6}
                        textAnchor="middle"
                        className="font-mono text-xs text-ink-2"
                        dominantBaseline="alphabetic"
                      >
                        {formatCurrency(week.collected)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </Card>

          <Card title="Recent activity">
            <div className="flex flex-col gap-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex flex-col gap-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-body text-sm font-medium text-ink">{activity.type}</span>
                      <span className="font-body text-sm text-ink-2">{activity.description}</span>
                    </div>
                    <span className="font-mono text-sm text-ink-3 whitespace-nowrap">{activity.time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge tone={activity.tone}>{statusLabels[activity.tone] || activity.tone}</Badge>
                    {activity.amount !== "—" && (
                      <span className="font-mono text-sm font-medium text-ink tabular-nums">{activity.amount}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <section className="mt-16">
          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="font-display text-lg font-medium text-ink">Recent invoices</h2>
            <Button variant="ghost" size="sm">View all</Button>
          </div>
          <DataTable
            columns={[
              { key: "id", header: "Invoice", align: "left" },
              { key: "customer", header: "Customer", align: "left" },
              { key: "date", header: "Date", align: "left" },
              { key: "due", header: "Due", align: "left" },
              { key: "amount", header: "Amount", align: "right", numeric: true },
              {
                key: "status",
                header: "Status",
                align: "left",
                render: (row) => (
                  <Badge tone={statusTones[row.status]}>{statusLabels[row.status]}</Badge>
                ),
              },
            ]}
            rows={recentInvoices.map((inv) => ({
              ...inv,
              amount: formatCurrency(inv.amount),
            }))}
          />
        </section>
      </main>
    </div>
  );
}
