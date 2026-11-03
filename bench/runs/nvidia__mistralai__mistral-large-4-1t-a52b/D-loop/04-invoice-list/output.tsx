import { useState } from "react";

import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { DataTable, type Column } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { Field } from "@/components/Field";
import { PageHeader } from "@/components/PageHeader";

type InvoiceStatus = "paid" | "pending" | "overdue" | "draft";

interface Invoice {
  id: string;
  number: string;
  customer: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  amount: number; // in cents
}

const INVOICES: Invoice[] = [
  { id: "1", number: "INV-2025-018", customer: "Alder & Co.", issueDate: "2025-06-18", dueDate: "2025-07-18", status: "paid", amount: 1250000 },
  { id: "2", number: "INV-2025-017", customer: "Northwind Press", issueDate: "2025-06-12", dueDate: "2025-07-12", status: "pending", amount: 348500 },
  { id: "3", number: "INV-2025-016", customer: "Fieldnote Labs", issueDate: "2025-06-05", dueDate: "2025-07-05", status: "pending", amount: 89900 },
  { id: "4", number: "INV-2025-015", customer: "Copperline Coffee", issueDate: "2025-05-28", dueDate: "2025-06-27", status: "overdue", amount: 512000 },
  { id: "5", number: "INV-2025-014", customer: "Harrow Books", issueDate: "2025-05-20", dueDate: "2025-06-19", status: "overdue", amount: 174250 },
  { id: "6", number: "INV-2025-013", customer: "Bluefin Analytics", issueDate: "2025-05-14", dueDate: "2025-06-13", status: "paid", amount: 2100000 },
  { id: "7", number: "INV-2025-012", customer: "Juniper Design", issueDate: "2025-05-06", dueDate: "2025-06-06", status: "paid", amount: 640000 },
  { id: "8", number: "INV-2025-011", customer: "Atlas Freight", issueDate: "2025-04-29", dueDate: "2025-05-29", status: "draft", amount: 980000 },
];

const STATUS_META: Record<InvoiceStatus, { label: string; tone: "neutral" | "positive" | "warning" | "negative" }> = {
  paid: { label: "Paid", tone: "positive" },
  pending: { label: "Pending", tone: "warning" },
  overdue: { label: "Overdue", tone: "negative" },
  draft: { label: "Draft", tone: "neutral" },
};

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "overdue", label: "Overdue" },
  { value: "draft", label: "Draft" },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number]["value"];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

function formatAmount(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

const columns: Column<Invoice>[] = [
  { key: "number", header: "Number", numeric: true },
  { key: "customer", header: "Customer" },
  {
    key: "issueDate",
    header: "Issue date",
    render: (inv) => <span className="font-mono">{formatDate(inv.issueDate)}</span>,
  },
  {
    key: "dueDate",
    header: "Due date",
    render: (inv) => <span className="font-mono">{formatDate(inv.dueDate)}</span>,
  },
  {
    key: "status",
    header: "Status",
    render: (inv) => {
      const meta = STATUS_META[inv.status];
      return <Badge tone={meta.tone}>{meta.label}</Badge>;
    },
  },
  { key: "amount", header: "Amount", align: "right", numeric: true, render: (inv) => formatAmount(inv.amount) },
];

export default function InvoicesPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const filtered = INVOICES.filter((inv) => {
    const matchesStatus = status === "all" || inv.status === status;
    const q = query.trim().toLowerCase();
    const matchesQuery =
      q === "" || inv.number.toLowerCase().includes(q) || inv.customer.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  const hasActiveFilters = query.trim() !== "" || status !== "all";

  return (
    <main className="px-6 py-12 md:px-16">
      <div className="mb-8">
        <PageHeader
          eyebrow="Billing"
          title="Invoices"
          description="Every invoice you have issued, with due dates and payment status."
          actions={<Button variant="primary">New invoice</Button>}
        />
      </div>

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:gap-6">
        <Field
          label="Search"
          placeholder="Invoice number or customer"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full md:flex-1"
        />
        <div className="flex flex-col gap-2">
          <span className="font-body text-sm font-medium text-ink">Status</span>
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((filter) => (
              <Button
                key={filter.value}
                size="sm"
                variant={status === filter.value ? "secondary" : "ghost"}
                aria-pressed={status === filter.value}
                onClick={() => setStatus(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
        <p className="font-mono text-xs text-ink-3 md:ml-auto md:self-end">
          {filtered.length} of {INVOICES.length} invoices
        </p>
      </div>

      {filtered.length > 0 ? (
        <DataTable columns={columns} rows={filtered} />
      ) : (
        <EmptyState
          title={hasActiveFilters ? "No invoices match" : "No invoices yet"}
          body={
            hasActiveFilters
              ? "Try a different search term or clear the status filter."
              : "Create your first invoice to start billing customers."
          }
          action={
            hasActiveFilters ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery("");
                  setStatus("all");
                }}
              >
                Clear filters
              </Button>
            ) : (
              <Button variant="secondary">New invoice</Button>
            )
          }
        />
      )}
    </main>
  );
}
