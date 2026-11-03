import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { DataTable, type Column } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { SideNav, type NavItem } from "@/components/SideNav";
import { StatTile } from "@/components/StatTile";

type InvoiceStatus = "Paid" | "Sent" | "Pending" | "Overdue";

interface Invoice {
  id: string;
  customer: string;
  issued: string;
  due: string;
  amount: string;
  status: InvoiceStatus;
}

interface ActivityItem {
  id: string;
  title: string;
  time: string;
  amount?: string;
  badge?: { label: string; tone: "neutral" | "positive" | "warning" | "negative" };
}

const statusTone: Record<InvoiceStatus, "positive" | "neutral" | "warning" | "negative"> = {
  Paid: "positive",
  Sent: "neutral",
  Pending: "warning",
  Overdue: "negative",
};

const navItems: NavItem[] = [
  { label: "Overview", href: "#", active: true },
  { label: "Invoices", href: "#", count: 14 },
  { label: "Customers", href: "#", count: 312 },
  { label: "Payments", href: "#" },
  { label: "Reports", href: "#" },
  { label: "Settings", href: "#" },
];

const invoices: Invoice[] = [
  { id: "INV-1047", customer: "Halcyon Ltd", issued: "Mar 18", due: "Apr 17", amount: "$1,850.00", status: "Sent" },
  { id: "INV-1046", customer: "Acme Corp", issued: "Mar 17", due: "Apr 16", amount: "$2,400.00", status: "Paid" },
  { id: "INV-1045", customer: "Bluefin Studio", issued: "Mar 14", due: "Apr 13", amount: "$960.00", status: "Pending" },
  { id: "INV-1044", customer: "Northwind Co", issued: "Mar 12", due: "Apr 11", amount: "$5,120.00", status: "Paid" },
  { id: "INV-1043", customer: "Marrow & Sons", issued: "Mar 10", due: "Apr 9", amount: "$3,275.00", status: "Overdue" },
  { id: "INV-1042", customer: "Fieldnote Inc", issued: "Mar 8", due: "Apr 7", amount: "$780.00", status: "Overdue" },
];

const weeks = [
  { label: "Jan 27", value: "$3.2k", height: "h-6" },
  { label: "Feb 3", value: "$4.1k", height: "h-8" },
  { label: "Feb 10", value: "$2.8k", height: "h-6" },
  { label: "Feb 17", value: "$5.2k", height: "h-12" },
  { label: "Feb 24", value: "$4.6k", height: "h-8" },
  { label: "Mar 3", value: "$6.1k", height: "h-16" },
  { label: "Mar 10", value: "$5.4k", height: "h-12" },
  { label: "Mar 17", value: "$7.2k", height: "h-24" },
];

const activity: ActivityItem[] = [
  { id: "a1", title: "Acme Corp paid INV-1046", time: "2 hours ago", amount: "$2,400.00" },
  { id: "a2", title: "Invoice INV-1047 sent to Halcyon Ltd", time: "5 hours ago", badge: { label: "Sent", tone: "neutral" } },
  { id: "a3", title: "INV-1043 is overdue by 6 days", time: "1 day ago", badge: { label: "Overdue", tone: "negative" } },
  { id: "a4", title: "Northwind Co paid INV-1044", time: "1 day ago", amount: "$5,120.00" },
  { id: "a5", title: "New customer: Bluefin Studio", time: "2 days ago" },
];

const columns: Column<Invoice>[] = [
  { key: "id", header: "Invoice", render: (row) => <span className="font-mono text-sm">{row.id}</span> },
  { key: "customer", header: "Customer" },
  { key: "issued", header: "Issued" },
  { key: "due", header: "Due" },
  { key: "amount", header: "Amount", align: "right", numeric: true },
  { key: "status", header: "Status", render: (row) => <Badge tone={statusTone[row.status]}>{row.status}</Badge> },
];

export default function Dashboard() {
  return (
    <div className="flex min-h-screen flex-col bg-paper md:flex-row">
      <SideNav product="Ledgerline" items={navItems} />
      <main className="min-w-0 flex-1 px-6 py-12 md:px-16">
        <PageHeader
          eyebrow="Dashboard"
          title="Overview"
          description="Revenue, collections and recent activity across your invoices."
          actions={
            <>
              <Button variant="ghost">Export</Button>
              <Button variant="primary">New invoice</Button>
            </>
          }
        />

        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <StatTile label="Monthly revenue" value="$48,290" delta={{ value: "12.4%", direction: "up" }} caption="vs February" />
          <StatTile label="Outstanding balance" value="$12,840" caption="14 open invoices" />
          <StatTile label="On-time payment rate" value="94.2%" delta={{ value: "1.8%", direction: "up" }} caption="last 90 days" />
          <StatTile label="Active customers" value="312" delta={{ value: "12", direction: "up" }} caption="vs last month" />
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          <Card
            title="Weekly collections"
            action={<Badge tone="neutral">Last 8 weeks</Badge>}
            className="lg:col-span-2"
          >
            <p className="mb-6 font-body text-sm text-ink-2">
              $38.4k collected over the last 8 weeks, up from $31.7k in the previous period.
            </p>
            <div className="flex h-32 items-end gap-2 border-b border-ink">
              {weeks.map((w, i) => (
                <div key={w.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <span className="font-mono text-xs text-ink-3">{w.value}</span>
                  <div
                    className={`w-full rounded-t-sm ${w.height} ${i === weeks.length - 1 ? "bg-accent" : "bg-ink"}`}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              {weeks.map((w) => (
                <span key={w.label} className="flex-1 text-center font-mono text-xs text-ink-3">
                  {w.label}
                </span>
              ))}
            </div>
          </Card>

          <Card title="Recent activity">
            <ul className="flex flex-col gap-4">
              {activity.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-body text-sm text-ink">{a.title}</span>
                    <span className="font-body text-xs text-ink-3">{a.time}</span>
                  </div>
                  {a.amount ? (
                    <span className="font-mono text-sm text-ink">{a.amount}</span>
                  ) : a.badge ? (
                    <Badge tone={a.badge.tone}>{a.badge.label}</Badge>
                  ) : null}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <section className="mt-16">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h2 className="font-display text-lg font-medium text-ink">Recent invoices</h2>
            <Button variant="ghost" size="sm">View all</Button>
          </div>
          <DataTable columns={columns} rows={invoices} />
        </section>
      </main>
    </div>
  );
}
