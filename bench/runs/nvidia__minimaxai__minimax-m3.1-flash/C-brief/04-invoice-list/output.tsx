"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { DataTable, type Column } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { Field } from "@/components/Field";
import { PageHeader } from "@/components/PageHeader";

type InvoiceStatus = "Paid" | "Pending" | "Overdue" | "Draft";
type StatusFilter = "All" | InvoiceStatus;

interface Invoice {
  id: string;
  number: string;
  customer: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  amount: number;
}

const invoices: Invoice[] = [
  {
    id: "inv-1048",
    number: "INV-1048",
    customer: "Harbour & Finch Ltd",
    issueDate: "12 Mar 2025",
    dueDate: "11 Apr 2025",
    status: "Paid",
    amount: 4820,
  },
  {
    id: "inv-1047",
    number: "INV-1047",
    customer: "Meridian Press Co.",
    issueDate: "10 Mar 2025",
    dueDate: "9 Apr 2025",
    status: "Pending",
    amount: 1275.5,
  },
  {
    id: "inv-1046",
    number: "INV-1046",
    customer: "Oakfield Grocers",
    issueDate: "4 Mar 2025",
    dueDate: "3 Apr 2025",
    status: "Overdue",
    amount: 936,
  },
  {
    id: "inv-1045",
    number: "INV-1045",
    customer: "Lark & Thistle Studio",
    issueDate: "28 Feb 2025",
    dueDate: "30 Mar 2025",
    status: "Paid",
    amount: 2140,
  },
  {
    id: "inv-1044",
    number: "INV-1044",
    customer: "Northbank Hardware",
    issueDate: "24 Feb 2025",
    dueDate: "26 Mar 2025",
    status: "Pending",
    amount: 3680.25,
  },
  {
    id: "inv-1043",
    number: "INV-1043",
    customer: "Cedar Row Bakery",
    issueDate: "18 Feb 2025",
    dueDate: "20 Mar 2025",
    status: "Overdue",
    amount: 742.8,
  },
  {
    id: "inv-1042",
    number: "INV-1042",
    customer: "Quarry Lane Books",
    issueDate: "14 Feb 2025",
    dueDate: "16 Mar 2025",
    status: "Draft",
    amount: 1590,
  },
  {
    id: "inv-1041",
    number: "INV-1041",
    customer: "Saltmarsh Fisheries",
    issueDate: "6 Feb 2025",
    dueDate: "8 Mar 2025",
    status: "Paid",
    amount: 6215,
  },
];

const statusTones: Record<
  InvoiceStatus,
  "neutral" | "positive" | "warning" | "negative" | "accent"
> = {
  Paid: "positive",
  Pending: "warning",
  Overdue: "negative",
  Draft: "neutral",
};

const statusOptions: StatusFilter[] = ["All", "Paid", "Pending", "Overdue", "Draft"];

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const columns: Column<Invoice>[] = [
  {
    key: "number",
    header: "Number",
    render: (row) => <span className="font-mono tabular-nums">{row.number}</span>,
  },
  { key: "customer", header: "Customer" },
  { key: "issueDate", header: "Issue date" },
  { key: "dueDate", header: "Due date" },
  {
    key: "status",
    header: "Status",
    render: (row) => <Badge tone={statusTones[row.status]}>{row.status}</Badge>,
  },
  {
    key: "amount",
    header: "Amount",
    align: "right",
    numeric: true,
    render: (row) => currency.format(row.amount),
  },
];

export default function InvoicesPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("All");

  const filteredInvoices = useMemo(() => {
    const term = query.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const matchesQuery =
        term === "" ||
        invoice.number.toLowerCase().includes(term) ||
        invoice.customer.toLowerCase().includes(term);
      const matchesStatus = status === "All" || invoice.status === status;

      return matchesQuery && matchesStatus;
    });
  }, [query, status]);

  const hasFilters = query.trim() !== "" || status !== "All";

  const clearFilters = () => {
    setQuery("");
    setStatus("All");
  };

  return (
    <main className="px-6 py-12 md:px-16">
      <PageHeader
        eyebrow="Accounts receivable"
        title="Invoices"
        description="Every invoice raised, what has been settled, and what is still outstanding."
        actions={<Button variant="primary">New invoice</Button>}
      />

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:gap-6">
        <Field
          label="Search invoices"
          type="search"
          placeholder="Number or customer"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="md:w-96"
        />

        <div className="flex flex-col gap-2 md:w-48">
          <label
            htmlFor="invoice-status"
            className="font-body text-sm font-medium text-ink"
          >
            Status
          </label>
          <select
            id="invoice-status"
            value={status}
            onChange={(event) => setStatus(event.target.value as StatusFilter)}
            className="h-12 rounded-md border border-line bg-paper px-3 font-body text-base text-ink focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-accent"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option === "All" ? "All statuses" : option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="mb-3 font-mono text-xs text-ink-3">
        {filteredInvoices.length} of {invoices.length} invoices
      </p>

      {filteredInvoices.length > 0 ? (
        <DataTable columns={columns} rows={filteredInvoices} />
      ) : (
        <EmptyState
          title="No invoices to show"
          body={
            hasFilters
              ? "No invoice matches the current search and status filter."
              : "Invoices you create will be listed here with their customer, dates and amount."
          }
          action={
            hasFilters ? (
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : (
              <Button variant="secondary">Create invoice</Button>
            )
          }
        />
      )}
    </main>
  );
}
