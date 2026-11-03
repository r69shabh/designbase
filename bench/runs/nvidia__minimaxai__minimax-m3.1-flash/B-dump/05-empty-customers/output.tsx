"use client";

import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { DataTable, type Column } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { SideNav } from "@/components/SideNav";

type ExampleCustomer = {
  id: string;
  name: string;
  contact: string;
  email: string;
  terms: string;
  outstanding: string;
  status: "Active" | "Pending";
};

const navItems = [
  { label: "Overview", href: "/overview" },
  { label: "Customers", href: "/customers", active: true, count: 0 },
  { label: "Invoices", href: "/invoices", count: 0 },
  { label: "Products", href: "/products", count: 12 },
  { label: "Settings", href: "/settings" },
];

const exampleCustomers: ExampleCustomer[] = [
  {
    id: "ex-1",
    name: "Northwind Trading Co.",
    contact: "Priya Raman",
    email: "accounts@northwindtrading.com",
    terms: "Net 30",
    outstanding: "$4,820.00",
    status: "Active",
  },
  {
    id: "ex-2",
    name: "Harbor & Pine Studio",
    contact: "Daniel Okafor",
    email: "hello@harborandpine.co",
    terms: "Net 15",
    outstanding: "$1,260.50",
    status: "Active",
  },
  {
    id: "ex-3",
    name: "Meridian Health Partners",
    contact: "Sofia Alvarez",
    email: "billing@meridianhealth.org",
    terms: "Due on receipt",
    outstanding: "$0.00",
    status: "Pending",
  },
];

const exampleColumns: Column<ExampleCustomer>[] = [
  { key: "name", header: "Customer" },
  { key: "contact", header: "Contact" },
  { key: "email", header: "Email" },
  { key: "terms", header: "Payment terms" },
  {
    key: "outstanding",
    header: "Outstanding",
    align: "right",
    numeric: true,
  },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <Badge tone={row.status === "Active" ? "positive" : "warning"}>{row.status}</Badge>
    ),
  },
];

const steps = [
  {
    title: "Add a customer",
    body: "Record a billing name, contact email and address. Tax ID and payment terms are optional and can be added later.",
  },
  {
    title: "Send an invoice",
    body: "Choose a customer, add line items and send. Invoice numbers are assigned automatically in sequence.",
  },
  {
    title: "Record payments",
    body: "Log each payment against an invoice and the outstanding balance updates as you go.",
  },
];

export default function CustomersPage() {
  return (
    <div className="flex min-h-screen flex-col bg-paper md:flex-row">
      <aside className="hidden md:block md:w-64 md:shrink-0">
        <SideNav product="Ledger" items={navItems} />
      </aside>

      <div className="flex items-center justify-between border-b border-line bg-paper-2 px-6 py-4 md:hidden">
        <span className="font-display text-lg font-semibold text-ink">Ledger</span>
        <span className="font-mono text-xs uppercase tracking-widest text-ink-3">Customers</span>
      </div>

      <main className="flex-1 px-6 py-12 md:px-16">
        <PageHeader
          eyebrow="Customers"
          title="Customers"
          description="Keep every client, contact and payment history in one place. Your workspace is ready for its first record."
          actions={<Button variant="secondary">Add customer</Button>}
        />

        <EmptyState
          title="No customers yet"
          body="Add your first customer to start sending invoices, recording payments and keeping contact details in one place. It takes about a minute."
          action={<Button variant="primary">Add your first customer</Button>}
        />

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          <Card
            title="What a customer record looks like"
            className="lg:col-span-2"
            action={<Badge tone="neutral">Example</Badge>}
          >
            <p className="mb-4 font-body text-sm text-ink-3">
              Example data only. Your account has no customers yet, so this is the list you will
              see once you add one.
            </p>
            <DataTable columns={exampleColumns} rows={exampleCustomers} />
          </Card>

          <Card title="Getting started">
            <ol className="flex flex-col gap-6">
              {steps.map((step, index) => (
                <li key={step.title} className="flex gap-3">
                  <span className="font-mono text-xs text-ink-3">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="flex flex-col gap-1">
                    <h3 className="font-body text-sm font-medium text-ink">{step.title}</h3>
                    <p className="font-body text-sm text-ink-2">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <Card title="Adding many customers at once" className="mt-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <p className="max-w-prose font-body text-sm text-ink-2">
              Import a CSV with columns for name, email, address and tax ID. Existing records are
              matched by email, so nothing is duplicated. You can edit any field after the import.
            </p>
            <Button variant="secondary">Import from CSV</Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
