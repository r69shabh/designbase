import { StatTile } from "@/components/StatTile";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";

const weeklyCollections = [
  { week: "Jun 2–8", collected: 12450 },
  { week: "Jun 9–15", collected: 18200 },
  { week: "Jun 16–22", collected: 15600 },
  { week: "Jun 23–29", collected: 21100 },
  { week: "Jun 30–Jul 6", collected: 19800 },
  { week: "Jul 7–13", collected: 22400 },
  { week: "Jul 14–20", collected: 20350 },
];

const recentActivity = [
  { id: "1", type: "payment", description: "Payment received from Acme Corp", amount: "$4,200.00", time: "2 hours ago" },
  { id: "2", type: "invoice", description: "Invoice INV-2024-0142 sent to BrightLabs", amount: "$3,800.00", time: "5 hours ago" },
  { id: "3", type: "payment", description: "Payment received from Meridian Co", amount: "$1,950.00", time: "1 day ago" },
  { id: "4", type: "overdue", description: "Invoice INV-2024-0138 is now overdue", amount: "$2,100.00", time: "2 days ago" },
  { id: "5", type: "invoice", description: "Invoice INV-2024-0143 sent to Vertex Inc", amount: "$5,600.00", time: "3 days ago" },
];

const recentInvoices = [
  { id: "INV-2024-0143", customer: "Vertex Inc", date: "Jul 18, 2024", due: "Aug 1, 2024", amount: "$5,600.00", status: "sent" },
  { id: "INV-2024-0142", customer: "BrightLabs", date: "Jul 18, 2024", due: "Aug 1, 2024", amount: "$3,800.00", status: "sent" },
  { id: "INV-2024-0141", customer: "Acme Corp", date: "Jul 15, 2024", due: "Jul 29, 2024", amount: "$4,200.00", status: "paid" },
  { id: "INV-2024-0140", customer: "Meridian Co", date: "Jul 12, 2024", due: "Jul 26, 2024", amount: "$1,950.00", status: "paid" },
  { id: "INV-2024-0139", customer: "Nexus Ltd", date: "Jul 10, 2024", due: "Jul 24, 2024", amount: "$2,800.00", status: "overdue" },
  { id: "INV-2024-0138", customer: "Orbit Systems", date: "Jul 8, 2024", due: "Jul 22, 2024", amount: "$2,100.00", status: "overdue" },
];

function WeeklyChart() {
  const max = Math.max(...weeklyCollections.map(w => w.collected));
  const height = 120;
  const barWidth = 32;
  const gap = 16;

  return (
    <Card className="p-6">
      <h2 className="font-display text-lg font-medium text-ink mb-6">Weekly collections</h2>
      <div className="flex items-end gap-4 h-[140px] pb-4">
        {weeklyCollections.map((week, i) => {
          const barHeight = (week.collected / max) * height;
          return (
            <div key={week.week} className="flex flex-col items-center flex-1 min-w-0">
              <div className="w-full flex justify-center mb-2">
                <div
                  className="bg-accent rounded-sm transition-all"
                  style={{ width: `${barWidth}px`, height: `${barHeight}px` }}
                />
              </div>
              <span className="font-body text-xs text-ink-3 whitespace-nowrap">{week.week}</span>
              <span className="font-mono text-xs text-ink-2 mt-1">${(week.collected / 1000).toFixed(1)}k</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function ActivityFeed() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-medium text-ink">Recent activity</h2>
        <Button variant="ghost" size="sm">View all</Button>
      </div>
      <div className="space-y-4">
        {recentActivity.map((activity) => (
          <div key={activity.id} className="flex items-center gap-4 py-3 border-t border-line first:border-0">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
              activity.type === "payment" ? "bg-moss" :
              activity.type === "invoice" ? "bg-accent" :
              "bg-brick"
            }`} />
            <div className="flex-1 min-w-0">
              <p className="font-body text-sm text-ink">{activity.description}</p>
              <p className="font-body text-xs text-ink-3">{activity.time}</p>
            </div>
            <span className="font-mono text-sm text-ink tabular-nums font-medium">{activity.amount}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function InvoicesTable() {
  const columns = [
    { key: "id", header: "Invoice", align: "left" as const },
    { key: "customer", header: "Customer", align: "left" as const },
    { key: "date", header: "Date", align: "left" as const },
    { key: "due", header: "Due", align: "left" as const },
    { key: "amount", header: "Amount", align: "right" as const, numeric: true },
    { key: "status", header: "Status", align: "left" as const, render: (row: typeof recentInvoices[0]) => (
      <Badge tone={
        row.status === "paid" ? "positive" :
        row.status === "overdue" ? "negative" :
        "warning"
      }>{row.status}</Badge>
    )},
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-medium text-ink">Recent invoices</h2>
        <Button variant="primary" size="sm">New invoice</Button>
      </div>
      <DataTable columns={columns} rows={recentInvoices} />
    </Card>
  );
}

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-paper px-6 py-12 md:px-16">
      <PageHeader
        title="Dashboard"
        description="Overview of your invoicing and collections for the current period."
      />

      <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Monthly revenue"
          value="$47,200"
          delta={{ value: "12.3%", direction: "up" }}
          caption="vs last month"
        />
        <StatTile
          label="Outstanding balance"
          value="$18,450"
          delta={{ value: "8.1%", direction: "down" }}
          caption="vs last month"
        />
        <StatTile
          label="On-time payment rate"
          value="87%"
          delta={{ value: "2.4%", direction: "up" }}
          caption="vs last month"
        />
        <StatTile
          label="Active customers"
          value="24"
          delta={{ value: "3", direction: "up" }}
          caption="vs last month"
        />
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        <WeeklyChart />
        <ActivityFeed />
      </div>

      <div className="mt-8">
        <InvoicesTable />
      </div>
    </main>
  );
}
