import type { ReactNode } from "react";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { DataTable } from "@/components/DataTable";
import type { Column } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { SideNav } from "@/components/SideNav";
import { StatTile } from "@/components/StatTile";

interface Invoice {
  id: string;
  customer: string;
  issued: string;
  due: string;
  amount: string;
  status: "Paid" | "Sent" | "Pending" | "Overdue" | "Draft";
}

const navItems = [
  { label: "Dashboard", href: "#", active: true },
  { label: "Invoices", href: "#", count: 9 },
  { label: "Customers", href: "#", count: 128 },
  { label: "Payments", href: "#" },
  { label: "Reports", href: "#" },
  { label: "Settings", href: "#" },
];

const weeks: { label: string; value: string; height: string; current?: boolean }[] = [
  { label: "Jan 6", value: "$1.8k", height: "h-6" },
  { label: "Jan 13", value: "$2.4k", height: "h-8" },
  { label: "Jan 20", value: "$2.1k", height: "h-6" },
  { label: "Jan 27", value: "$3.0k", height: "h-12" },
  { label: "Feb 3", value: "$2.6k", height: "h-8" },
  { label: "Feb 10", value: "$3.4k", height: "h-12" },
  { label: "Feb 17", value: "$4.1k", height: "h-16" },
  { label: "Feb 24", value: "$4.9k", height: "h-16", current: true },
];

const activity: { message: ReactNode; time: string }[] = [
  {
    message: (
      <>
        Payment received — <span className="font-mono text-xs">INV-1042</span> ·{" "}
        <span className="font-mono">$4,800.00</span> from Northwind Studio
      </>
    ),
    time: "2h ago",
  },
  {
    message: (
      <>
        Invoice <span className="font-mono text-xs">INV-1041</span> sent to Acme Corp
      </>
    ),
    time: "5h ago",
  },
  {
    message: (
      <>
        Reminder sent for <span className="font-mono text-xs">INV-1038</span>, overdue 6 days
      </>
    ),
    time: "Yesterday",
  },
  { message: "New customer added: Fern & Field", time: "Yesterday" },
  {
    message: (
      <>
        Payout of <span className="font-mono">$12,300.00</span> sent to your bank account
      </>
    ),
    time: "Mar 2",
  },
];

const invoices: Invoice[] = [
  { id: "INV-1042", customer: "Northwind Studio", issued: "Feb 18, 2025", due: "Mar 20, 2025", amount: "$4,800.00", status: "Paid" },
  { id: "INV-1041", customer: "Acme Corp", issued: "Feb 17, 2025", due: "Mar 19, 2025", amount: "$2,150.00", status: "Sent" },
  { id: "INV-1040", customer: "Fern & Field", issued: "Feb 14, 2025", due: "Mar 16, 2025", amount: "$960.00", status: "Pending" },
  { id: "INV-1039", customer: "Bluepine Labs", issued: "Feb 10, 2025", due: "Mar 12, 2025", amount: "$7,300.00", status: "Sent" },
  { id: "INV-1038", customer: "Harbor & Main", issued: "Jan 28, 2025", due: "Feb 27, 2025", amount: "$1,240.00", status: "Overdue" },
  { id: "INV-1037", customer: "Copper Kettle Co.", issued: "Feb 5, 2025", due: "Mar 7, 2025", amount: "$3,575.00", status: "Draft" },
];

const statusTone: Record<Invoice["status"], "positive" | "accent" | "warning" | "negative" | "neutral"> = {
  Paid: "positive",
  Sent: "accent",
  Pending: "warning",
  Overdue: "negative",
  Draft: "neutral",
};

const columns: Column<Invoice>[] = [
  {
    key: "id",
    header: "Invoice",
    render: (row) => <span className="font-mono text-xs">{row.id}</span>,
  },
  { key: "customer", header: "Customer" },
  {
    key: "issued",
    header: "Issued",
    render: (row) => <span className="font-mono text-xs text-ink-2">{row.issued}</span>,
  },
  {
    key: "due",
    header: "Due",
    render: (row) => <span className="font-mono text-xs text-ink-2">{row.due}</span>,
  },
  { key: "amount", header: "Amount", align: "right", numeric: true },
  {
    key: "status",
    header: "Status",
    render: (row) => <Badge tone={statusTone[row.status]}>{row.status}</Badge>,
  },
];

export default function Dashboard() {
  return (
    <div className="flex min-h-screen flex-col bg-paper font-body text-ink md:flex-row">
      <SideNav product="Ledgerline" items={navItems} />

      <main className="min-w-0 flex-1 px-6 py-12 md:px-16">
        <div className="flex flex-col gap-12">
          <PageHeader
            eyebrow="Overview"
            title="Dashboard"
            description="Revenue, collections and receivables for February 2025, at a glance."
            actions={
              <div className="flex flex-wrap gap-3">
                <Button variant="ghost">Export report</Button>
                <Button variant="primary">New invoice</Button>
              </div>
            }
          />

          <section aria-label="Key metrics" className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="Monthly revenue"
              value="$48,250.00"
              delta={{ value: "12.4%", direction: "up" }}
              caption="vs last month"
            />
            <StatTile
              label="Outstanding balance"
              value="$12,840.00"
              caption="across 9 open invoices"
            />
            <StatTile
              label="On-time payment rate"
              value="94.2%"
              delta={{ value: "1.8%", direction: "up" }}
              caption="last 30 days"
            />
            <StatTile
              label="Active customers"
              value="128"
              delta={{ value: "6", direction: "up" }}
              caption="new this month"
            />
          </section>

          <section className="grid grid-cols-1 gap-8 md:grid-cols-5">
            <div className="min-w-0 md:col-span-3">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-display text-lg font-semibold text-ink">Weekly collections</h2>
                <span className="font-mono text-xs text-ink-3">Last 8 weeks</span>
              </div>
              <div className="mt-4 border border-line rounded-md p-6">
                <div className="overflow-x-auto">
                  <div
                    role="img"
                    aria-label="Bar chart of weekly collections over the last 8 weeks, rising from $1.8k to $4.9k"
                    className="flex w-max min-w-full gap-3"
                  >
                    {weeks.map((week) => (
                      <div key={week.label} className="flex w-12 flex-none flex-col items-center gap-2 sm:w-auto sm:flex-1">
                        <div className="flex h-24 w-full flex-col items-center justify-end gap-1">
                          <span className={`font-mono text-xs ${week.current ? "text-ink" : "text-ink-3"}`}>
                            {week.value}
                          </span>
                          <div
                            className={`w-full rounded-sm ${week.current ? "bg-accent" : "bg-ink-3"} ${week.height}`}
                          />
                        </div>
                        <span className="whitespace-nowrap font-mono text-xs text-ink-3">{week.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="mt-6 border-t border-line pt-3 font-mono text-xs text-ink-3">
                  $24,300.00 collected over the last 8 weeks
                </p>
              </div>
            </div>

            <div className="min-w-0 md:col-span-2">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-display text-lg font-semibold text-ink">Recent activity</h2>
                <span className="font-mono text-xs text-ink-3">Today</span>
              </div>
              <div className="mt-4 border border-line rounded-md p-6">
                <ul className="divide-y divide-line">
                  {activity.map((item, index) => (
                    <li key={index} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3 first:pt-0 last:pb-0">
                      <span className="min-w-0 text-sm text-ink">{item.message}</span>
                      <span className="shrink-0 font-mono text-xs text-ink-3">{item.time}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section aria-label="Recent invoices" className="min-w-0">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-display text-lg font-semibold text-ink">Recent invoices</h2>
              <Button variant="ghost" size="sm">View all</Button>
            </div>
            <div className="mt-4">
              <DataTable columns={columns} rows={invoices} />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
