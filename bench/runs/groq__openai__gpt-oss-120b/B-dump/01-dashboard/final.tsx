import React from "react";
import { SideNav } from "@/components/SideNav";
import { PageHeader } from "@/components/PageHeader";
import { StatTile } from "@/components/StatTile";
import { Card } from "@/components/Card";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";

type Invoice = {
  id: string;
  number: string;
  customer: string;
  amount: string;
  due: string;
  status: "paid" | "pending" | "overdue";
};

export default function Dashboard() {
  // Sample navigation
  const navItems = [
    { label: "Dashboard", href: "#", active: true },
    { label: "Invoices", href: "#" },
    { label: "Customers", href: "#" },
    { label: "Settings", href: "#" },
  ];

  // Stat tiles data
  const stats = [
    {
      label: "Monthly revenue",
      value: "$12,340",
      delta: { value: "5.2%", direction: "up" as const },
      caption: "vs last month",
    },
    {
      label: "Outstanding balance",
      value: "$2,870",
      delta: { value: "1.8%", direction: "down" as const },
      caption: "since last week",
    },
    {
      label: "On‑time payment rate",
      value: "93%",
      delta: { value: "0.4%", direction: "up" as const },
      caption: "of invoices",
    },
    {
      label: "Customers",
      value: "124",
    },
  ];

  // Recent activity mock
  const activities = [
    "Invoice #INV‑1023 paid by Acme Corp.",
    "Invoice #INV‑1024 sent to Beta LLC.",
    "Payment received from Gamma Co.",
    "Invoice #INV‑1025 overdue for Delta Inc.",
  ];

  // Recent invoices mock
  const invoices: Invoice[] = [
    {
      id: "1",
      number: "INV‑1023",
      customer: "Acme Corp.",
      amount: "$1,200",
      due: "2024‑10‑01",
      status: "paid",
    },
    {
      id: "2",
      number: "INV‑1024",
      customer: "Beta LLC",
      amount: "$850",
      due: "2024‑10‑05",
      status: "pending",
    },
    {
      id: "3",
      number: "INV‑1025",
      customer: "Delta Inc.",
      amount: "$2,300",
      due: "2024‑09‑28",
      status: "overdue",
    },
    {
      id: "4",
      number: "INV‑1026",
      customer: "Gamma Co.",
      amount: "$640",
      due: "2024‑10‑03",
      status: "paid",
    },
  ];

  const invoiceColumns = [
    { key: "number", header: "Invoice", align: "left" as const },
    { key: "customer", header: "Customer", align: "left" as const },
    {
      key: "amount",
      header: "Amount",
      align: "right" as const,
      numeric: true,
    },
    { key: "due", header: "Due date", align: "left" as const },
    {
      key: "status",
      header: "Status",
      align: "left" as const,
      render: (row: Invoice) => {
        const toneMap: Record<Invoice["status"], "positive" | "warning" | "negative"> = {
          paid: "positive",
          pending: "warning",
          overdue: "negative",
        };
        const labelMap: Record<Invoice["status"], string> = {
          paid: "Paid",
          pending: "Pending",
          overdue: "Overdue",
        };
        return <Badge tone={toneMap[row.status]}>{labelMap[row.status]}</Badge>;
      },
    },
  ];

  return (
    <div className="flex min-h-screen bg-paper">
      <SideNav product="InvoicePro" items={navItems} />
      <main className="flex-1 px-6 py-12 md:px-16">
        <PageHeader
          title="Dashboard"
          description="Overview of your invoicing activity."
          actions={<Button variant="primary">New invoice</Button>}
        />

        {/* Stat tiles */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((s) => (
            <StatTile
              key={s.label}
              label={s.label}
              value={s.value}
              delta={s.delta}
              caption={s.caption}
            />
          ))}
        </div>

        {/* Cards */}
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {/* Weekly collections chart placeholder */}
          <Card className="lg:col-span-2">
            <h3 className="font-display text-lg font-medium text-ink mb-4">
              Weekly collections
            </h3>
            <div className="h-48 flex items-center justify-center border border-line bg-paper-2 text-ink-3">
              {/* Replace with real chart */}
              Chart goes here
            </div>
          </Card>

          {/* Recent activity */}
          <Card title="Recent activity">
            <ul className="list-disc pl-5 space-y-2 text-ink-2 font-body text-sm">
              {activities.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Recent invoices table */}
        <section className="mt-16">
          <h2 className="font-display text-xl font-medium text-ink mb-4">
            Recent invoices
          </h2>
          <DataTable columns={invoiceColumns} rows={invoices} />
        </section>
      </main>
    </div>
  );
}
