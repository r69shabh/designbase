import React from "react";
import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { StatTile } from "@/components/StatTile";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/Badge";

type Invoice = {
  id: string;
  number: string;
  customer: string;
  amount: number;
  due: string;
  status: "Paid" | "Pending" | "Overdue";
};

const invoiceColumns = [
  { key: "number", header: "Invoice #", align: "left" as const },
  { key: "customer", header: "Customer", align: "left" as const },
  {
    key: "amount",
    header: "Amount",
    align: "right" as const,
    numeric: true,
    render: (row: Invoice) => `$${row.amount.toLocaleString()}`,
  },
  { key: "due", header: "Due date", align: "left" as const },
  {
    key: "status",
    header: "Status",
    align: "left" as const,
    render: (row: Invoice) => {
      const tone = row.status === "Paid" ? "positive" : row.status === "Pending" ? "warning" : "negative";
      return <Badge tone={tone}>{row.status}</Badge>;
    },
  },
];

const invoices: Invoice[] = [
  {
    id: "1",
    number: "INV‑1001",
    customer: "Acme Corp",
    amount: 1240,
    due: "2024‑10‑15",
    status: "Paid",
  },
  {
    id: "2",
    number: "INV‑1002",
    customer: "Beta LLC",
    amount: 560,
    due: "2024‑10‑20",
    status: "Pending",
  },
  {
    id: "3",
    number: "INV‑1003",
    customer: "Gamma Co",
    amount: 980,
    due: "2024‑10‑05",
    status: "Overdue",
  },
];

type Activity = {
  id: string;
  description: string;
  timestamp: string;
};

const recentActivity: Activity[] = [
  {
    id: "a1",
    description: "Payment received from Acme Corp",
    timestamp: "2024‑10‑01 14:32",
  },
  {
    id: "a2",
    description: "Invoice INV‑1002 sent to Beta LLC",
    timestamp: "2024‑09‑30 09:15",
  },
  {
    id: "a3",
    description: "Reminder email sent to Gamma Co (overdue)",
    timestamp: "2024‑09‑28 16:45",
  },
];

export default function Dashboard() {
  return (
    <main className="bg-paper min-h-screen px-6 py-12 md:px-12">
      <PageHeader
        title="Dashboard"
        description="Overview of your invoicing activity"
        actions={<Button variant="primary">New invoice</Button>}
      />

      {/* Stat tiles */}
      <section className="mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <StatTile
            label="Monthly revenue"
            value="$12,340"
            delta={{ value: "5%", direction: "up" }}
            caption="vs last month"
          />
          <StatTile
            label="Outstanding balance"
            value="$2,150"
            delta={{ value: "2%", direction: "down" }}
            caption="since last week"
          />
          <StatTile
            label="On‑time payment rate"
            value="93%"
            delta={{ value: "1%", direction: "up" }}
            caption="vs target"
          />
          <StatTile label="Customers" value="128" caption="active this month" />
        </div>
      </section>

      {/* Weekly collections chart */}
      <section className="mt-12">
        <h2 className="font-display text-2xl text-ink mb-4">Weekly collections</h2>
        <div className="h-24 bg-paper-2 border border-line rounded-md flex items-center justify-center">
          <svg
            aria-label="weekly collections chart"
            className="w-full h-full"
            role="img"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              points="0,80 20,60 40,70 60,40 80,55 100,30"
            />
          </svg>
        </div>
      </section>

      {/* Recent activity */}
      <section className="mt-12">
        <h2 className="font-display text-2xl text-ink mb-4">Recent activity</h2>
        <ul className="space-y-3">
          {recentActivity.map((item) => (
            <li key={item.id} className="font-body text-ink-2">
              <span>{item.description}</span>
              <time className="block text-ink-3 text-xs">{item.timestamp}</time>
            </li>
          ))}
        </ul>
      </section>

      {/* Recent invoices */}
      <section className="mt-12">
        <h2 className="font-display text-2xl text-ink mb-4">Recent invoices</h2>
        <DataTable columns={invoiceColumns} rows={invoices} />
      </section>
    </main>
  );
}
