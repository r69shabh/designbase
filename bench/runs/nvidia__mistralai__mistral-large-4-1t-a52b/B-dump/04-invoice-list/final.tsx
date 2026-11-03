import { useMemo, useState } from "react";

import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { DataTable } from "@/components/DataTable";
import type { Column } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { Field } from "@/components/Field";
import { PageHeader } from "@/components/PageHeader";
import { SideNav } from "@/components/SideNav";

type InvoiceStatus = "draft" | "pending" | "paid" | "overdue";

interface Invoice {
  id: string;
  number: string;
  customer: string;
  issued: string;
  due: string;
  status: InvoiceStatus;
  amount: number;
}

const invoices: Invoice[] = [
  { id: "1", number: "INV-2025-041", customer: "Meridian Studio", issued: "Mar 28, 2025", due: "Apr 27, 2025", status: "pending", amount: 4800 },
  { id: "2", number: "INV-2025-040", customer: "Halstead & Co.", issued: "Mar 21, 2025", due: "Apr 20, 2025", status: "paid", amount: 1250 },
  { id: "3", number: "INV-2025-039", customer: "Bluewater Press", issued: "Mar 14, 2025", due: "Apr 13, 2025", status: "overdue", amount: 9600 },
  { id: "4", number: "INV-2025-038", customer: "Copperline Goods", issued: "Mar 7, 2025", due: "Apr 6, 2025", status: "paid", amount: 2325.5 },
  { id: "5", number: "INV-2025-037", customer: "Fieldnote Labs", issued: "Feb 28, 2025", due: "Mar 30, 2025", status: "overdue", amount: 780 },
  { id: "6", number: "INV-2025-036", customer: "Meridian Studio", issued: "Feb 21, 2025", due: "Mar 23, 2025", status: "paid", amount: 4800 },
  { id: "7", number: "INV-2025-035", customer: "Anvil & Oak", issued: "Feb 14, 2025", due: "Mar 16, 2025", status: "pending", amount: 3120 },
  { id: "8", number: "INV-2025-034", customer: "Bluewater Press", issued: "Feb 7, 2025", due: "Apr 9, 2025", status: "draft", amount: 1540 },
];

const statusOptions: { value: InvoiceStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
];

const statusLabel: Record<InvoiceStatus, string> = {
  draft: "Draft",
  pending: "Pending",
  paid: "Paid",
  overdue: "Overdue",
};

const statusTone: Record<InvoiceStatus, "neutral" | "warning" | "positive" | "negative"> = {
  draft: "neutral",
  pending: "warning",
  paid: "positive",
  overdue: "negative",
};

const formatAmount = (amount: number) =>
  amount.toLocaleString("en-US", { style: "currency", currency: "USD" });

const columns: Column<Invoice>[] = [
  {
    key: "number",
    header: "Number",
    render: (row) => <span className="font-mono">{row.number}</span>,
  },
  { key: "customer", header: "Customer" },
  { key: "issued", header: "Issued" },
  {
    key: "due",
    header: "Due",
    render: (row) => (
      <span className={row.status === "overdue" ? "text-brick" : undefined}>{row.due}</span>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (row) => <Badge tone={statusTone[row.status]}>{statusLabel[row.status]}</Badge>,
  },
  {
    key: "amount",
    header: "Amount",
    align: "right",
    numeric: true,
    render: (row) => formatAmount(row.amount),
  },
];

const navItems = [
  { label: "Overview", href: "#" },
  { label: "Invoices", href: "#", active: true, count: invoices.length },
  { label: "Customers", href: "#" },
  { label: "Projects", href: "#" },
  { label: "Settings", href: "#" },
];

export default function InvoicesPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<InvoiceStatus | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices.filter((invoice) => {
      const matchesStatus = status === "all" || invoice.status === status;
      const matchesQuery =
        q === "" ||
        invoice.customer.toLowerCase().includes(q) ||
        invoice.number.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [query, status]);

  const clearFilters = () => {
    setQuery("");
    setStatus("all");
  };

  return (
    <div className="flex min-h-screen flex-col bg-paper md:flex-row">
      <SideNav product="Almanac" items={navItems} />
      <main className="flex-1 px-6 py-12 md:px-16">
        <PageHeader
          eyebrow="Billing"
          title="Invoices"
          description="Every invoice issued from the studio, with due dates and payment status."
          actions={<Button variant="primary">New invoice</Button>}
        />

        <div className="mb-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <Field
            label="Search"
            placeholder="Customer or invoice number"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full md:w-64"
          />
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
            {statusOptions.map((option) => (
              <Button
                key={option.value}
                size="sm"
                variant={status === option.value ? "secondary" : "ghost"}
                aria-pressed={status === option.value}
                onClick={() => setStatus(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <p className="mb-6 font-mono text-xs text-ink-3">
          {filtered.length} of {invoices.length} invoices
        </p>

        {filtered.length > 0 ? (
          <DataTable columns={columns} rows={filtered} />
        ) : (
          <EmptyState
            title="No invoices match"
            body="Try a different search term or clear the status filter."
            action={
              <Button variant="secondary" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        )}
      </main>
    </div>
  );
}
