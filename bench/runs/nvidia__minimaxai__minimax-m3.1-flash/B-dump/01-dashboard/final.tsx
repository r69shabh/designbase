import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { DataTable, type Column } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { SideNav } from "@/components/SideNav";
import { StatTile } from "@/components/StatTile";

type Tone = "neutral" | "positive" | "warning" | "negative" | "accent";

type Invoice = {
  id: string;
  number: string;
  customer: string;
  issued: string;
  due: string;
  amount: number;
  status: string;
  tone: Tone;
};

const navItems = [
  { label: "Overview", href: "/", active: true },
  { label: "Invoices", href: "/invoices", count: 24 },
  { label: "Customers", href: "/customers", count: 128 },
  { label: "Payments", href: "/payments", count: 3 },
  { label: "Reports", href: "/reports" },
  { label: "Settings", href: "/settings" },
];

const weeklyCollections = [
  { week: "May 6", amount: 28400 },
  { week: "May 13", amount: 31250 },
  { week: "May 20", amount: 26800 },
  { week: "May 27", amount: 35600 },
  { week: "Jun 3", amount: 33100 },
  { week: "Jun 10", amount: 40250 },
  { week: "Jun 17", amount: 37900 },
  { week: "Jun 24", amount: 46300 },
];

const activity = [
  {
    id: "a1",
    title: "Payment received from Northwind Traders",
    detail: "$12,400.00 · 2 hours ago",
    label: "Paid",
    tone: "positive" as Tone,
  },
  {
    id: "a2",
    title: "Invoice INV-2051 sent to Kestrel Labs",
    detail: "$8,250.00 · 5 hours ago",
    label: "Sent",
    tone: "accent" as Tone,
  },
  {
    id: "a3",
    title: "Overdue notice sent to Atlas Supply",
    detail: "$3,100.00 · Yesterday",
    label: "Overdue",
    tone: "negative" as Tone,
  },
  {
    id: "a4",
    title: "New customer added: Harbor & Finch",
    detail: "Yesterday",
    label: "New",
    tone: "neutral" as Tone,
  },
  {
    id: "a5",
    title: "Payment received from Meridian Co",
    detail: "$6,780.00 · 2 days ago",
    label: "Paid",
    tone: "positive" as Tone,
  },
];

const invoices: Invoice[] = [
  {
    id: "1",
    number: "INV-2051",
    customer: "Kestrel Labs",
    issued: "Jun 18",
    due: "Jul 2",
    amount: 12400,
    status: "Paid",
    tone: "positive",
  },
  {
    id: "2",
    number: "INV-2050",
    customer: "Northwind Traders",
    issued: "Jun 17",
    due: "Jul 1",
    amount: 8250,
    status: "Sent",
    tone: "accent",
  },
  {
    id: "3",
    number: "INV-2049",
    customer: "Meridian Co",
    issued: "Jun 14",
    due: "Jun 28",
    amount: 4960,
    status: "Overdue",
    tone: "negative",
  },
  {
    id: "4",
    number: "INV-2048",
    customer: "Atlas Supply",
    issued: "Jun 12",
    due: "Jun 26",
    amount: 3100,
    status: "Overdue",
    tone: "negative",
  },
  {
    id: "5",
    number: "INV-2047",
    customer: "Harbor & Finch",
    issued: "Jun 10",
    due: "Jun 24",
    amount: 7820,
    status: "Paid",
    tone: "positive",
  },
  {
    id: "6",
    number: "INV-2046",
    customer: "Kestrel Labs",
    issued: "Jun 8",
    due: "Jun 22",
    amount: 2340,
    status: "Draft",
    tone: "neutral",
  },
];

const invoiceColumns: Column<Invoice>[] = [
  {
    key: "number",
    header: "Invoice",
    render: (row) => <span className="font-mono text-xs text-ink">{row.number}</span>,
  },
  { key: "customer", header: "Customer" },
  {
    key: "issued",
    header: "Issued",
    render: (row) => <span className="font-mono text-xs">{row.issued}</span>,
  },
  {
    key: "due",
    header: "Due",
    render: (row) => <span className="font-mono text-xs">{row.due}</span>,
  },
  {
    key: "amount",
    header: "Amount",
    align: "right",
    numeric: true,
    render: (row) => `$${row.amount.toLocaleString("en-US")}`,
  },
  {
    key: "status",
    header: "Status",
    render: (row) => <Badge tone={row.tone}>{row.status}</Badge>,
  },
];

const CHART_WIDTH = 560;
const CHART_HEIGHT = 160;
const CHART_MAX = 50000;

const chartPoints = weeklyCollections.map((entry, index) => ({
  x: (index * CHART_WIDTH) / (weeklyCollections.length - 1),
  y: CHART_HEIGHT - (entry.amount / CHART_MAX) * CHART_HEIGHT,
}));

const linePath = chartPoints
  .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
  .join(" ");

const areaPath = `${linePath} L ${CHART_WIDTH} ${CHART_HEIGHT} L 0 ${CHART_HEIGHT} Z`;

export default function Dashboard() {
  return (
    <div className="flex min-h-screen bg-paper">
      <aside className="hidden md:block">
        <SideNav product="Ledgerline" items={navItems} />
      </aside>

      <main className="flex-1 px-6 py-12 md:px-16">
        <div className="mb-8 md:hidden">
          <span className="font-display text-lg font-semibold text-ink">Ledgerline</span>
        </div>

        <PageHeader
          eyebrow="June 2024"
          title="Overview"
          description="Revenue, collections and invoice health across your customer base."
          actions={
            <>
              <Button variant="secondary">Export</Button>
              <Button variant="primary">New invoice</Button>
            </>
          }
        />

        <section className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <StatTile
            label="Monthly revenue"
            value="$184,320"
            delta={{ value: "12.4%", direction: "up" }}
            caption="vs. May"
          />
          <StatTile
            label="Outstanding balance"
            value="$42,180"
            caption="12 open invoices"
          />
          <StatTile
            label="On-time payment rate"
            value="94.2%"
            delta={{ value: "2.1 pts", direction: "up" }}
            caption="last 30 days"
          />
          <StatTile
            label="Customers"
            value="128"
            delta={{ value: "6", direction: "up" }}
            caption="4 new this month"
          />
        </section>

        <section className="mt-16 grid gap-8 lg:grid-cols-3">
          <Card
            className="lg:col-span-2"
            title="Weekly collections"
            action={
              <Button variant="ghost" size="sm">
                View report
              </Button>
            }
          >
            <div className="flex gap-3">
              <div className="flex h-40 flex-col justify-between text-right font-mono text-xs text-ink-3">
                <span>$50k</span>
                <span>$25k</span>
                <span>$0</span>
              </div>
              <div className="min-w-0 flex-1">
                <svg
                  viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                  preserveAspectRatio="none"
                  className="h-40 w-full"
                  role="img"
                  aria-label="Weekly collections rose from 28,400 dollars in early May to 46,300 dollars in late June."
                >
                  {[0, 40, 80, 120, 160].map((y) => (
                    <line
                      key={y}
                      x1={0}
                      y1={y}
                      x2={CHART_WIDTH}
                      y2={y}
                      className="stroke-line"
                      strokeWidth={1}
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                  <path d={areaPath} className="fill-paper-2" />
                  <path
                    d={linePath}
                    fill="none"
                    className="stroke-accent"
                    strokeWidth={2}
                    vectorEffect="non-scaling-stroke"
                  />
                  {chartPoints.map((point, index) => (
                    <circle
                      key={weeklyCollections[index].week}
                      cx={point.x}
                      cy={point.y}
                      r={3}
                      className="fill-accent"
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                </svg>
                <div className="mt-2 flex justify-between font-mono text-xs text-ink-3">
                  {weeklyCollections.map((entry, index) => (
                    <span
                      key={entry.week}
                      className={index % 2 === 0 ? "" : "hidden sm:inline"}
                    >
                      {entry.week}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-6 font-body text-sm text-ink-3">
              Total collected over the last eight weeks:{" "}
              <span className="font-mono text-ink-2">$279,600.00</span>
            </p>
          </Card>

          <Card
            title="Recent activity"
            action={
              <Button variant="ghost" size="sm">
                View all
              </Button>
            }
          >
            <ul className="flex flex-col gap-4">
              {activity.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-body text-sm text-ink">{item.title}</span>
                    <span className="font-mono text-xs text-ink-3">{item.detail}</span>
                  </div>
                  <Badge tone={item.tone}>{item.label}</Badge>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        <section className="mt-16">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h2 className="font-display text-lg font-medium text-ink">Recent invoices</h2>
            <Button variant="ghost" size="sm">
              All invoices
            </Button>
          </div>
          <DataTable columns={invoiceColumns} rows={invoices} />
        </section>
      </main>
    </div>
  );
}
