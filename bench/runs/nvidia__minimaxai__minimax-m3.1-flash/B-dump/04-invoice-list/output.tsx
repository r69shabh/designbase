import { useId, useMemo, useState } from "react";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { DataTable, type Column } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { Field } from "@/components/Field";
import { PageHeader } from "@/components/PageHeader";

type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Overdue";

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
  { id: "inv-1048", number: "INV-1048", customer: "Harbourline Logistics", issueDate: "2025-03-04", dueDate: "2025-04-03", status: "Paid", amount: 4820 },
  { id: "inv-1049", number: "INV-1049", customer: "Meridian Coffee Roasters", issueDate: "2025-03-06", dueDate: "2025-04-05", status: "Paid", amount: 1265.5 },
  { id: "inv-1050", number: "INV-1050", customer: "Northgate Dental Group", issueDate: "2025-03-11", dueDate: "2025-04-10", status: "Sent", amount: 3120 },
  { id: "inv-1051", number: "INV-1051", customer: "Fieldstone Architecture", issueDate: "2025-03-12", dueDate: "2025-04-11", status: "Sent", amount: 8750 },
  { id: "inv-1052", number: "INV-1052", customer: "Cedar & Vine Catering", issueDate: "2025-03-14", dueDate: "2025-04-13", status: "Overdue", amount: 2140 },
  { id: "inv-1053", number: "INV-1053", customer: "Lumen Print Works", issueDate: "2025-03-18", dueDate: "2025-04-17", status: "Sent", amount: 640 },
  { id: "inv-1054", number: "INV-1054", customer: "Saltmarsh Fisheries", issueDate: "2025-03-21", dueDate: "2025-04-20", status: "Draft", amount: 5390 },
  { id: "inv-1055", number: "INV-1055", customer: "Quarry Lane Joinery", issueDate: "2025-03-24", dueDate: "2025-04-23", status: "Draft", amount: 1875 },
  { id: "inv-1056", number: "INV-1056", customer: "Brightwater Utilities", issueDate: "2025-03-26", dueDate: "2025-04-25", status: "Sent", amount: 11240 },
  { id: "inv-1057", number: "INV-1057", customer: "Orchard Lane Bakery", issueDate: "2025-03-28", dueDate: "2025-04-27", status: "Paid", amount: 960.25 },
];

const statusTone: Record<InvoiceStatus, "neutral" | "accent" | "positive" | "negative"> = {
  Draft: "neutral",
  Sent: "accent",
  Paid: "positive",
  Overdue: "negative",
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function formatDate(iso: string) {
  return dateFormat.format(new Date(`${iso}T00:00:00Z`));
}

export default function InvoicesPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"All" | InvoiceStatus>("All");
  const selectId = useId();

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return invoices.filter((invoice) => {
      const matchesStatus = status === "All" || invoice.status === status;
      const matchesQuery =
        term === "" ||
        invoice.number.toLowerCase().includes(term) ||
        invoice.customer.toLowerCase().includes(term);
      return matchesStatus && matchesQuery;
    });
  }, [query, status]);

  const total = filtered.reduce((sum, invoice) => sum + invoice.amount, 0);

  const columns: Column<Invoice>[] = [
    {
      key: "number",
      header: "Number",
      render: (row) => <span className="font-mono text-sm text-ink">{row.number}</span>,
    },
    { key: "customer", header: "Customer" },
    {
      key: "issueDate",
      header: "Issue date",
      render: (row) => <span className="font-mono text-sm text-ink-2">{formatDate(row.issueDate)}</span>,
    },
    {
      key: "dueDate",
      header: "Due date",
      render: (row) => <span className="font-mono text-sm text-ink-2">{formatDate(row.dueDate)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge tone={statusTone[row.status]}>{row.status}</Badge>,
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      numeric: true,
      render: (row) => currency.format(row.amount),
    },
  ];

  return (
    <main className="px-6 py-12 md:px-16">
      <PageHeader
        eyebrow="Billing"
        title="Invoices"
        description="Every invoice raised for your customers, with issue dates, due dates and payment status."
        actions={
          <Button variant="primary" onClick={() => window.location.assign("/invoices/new")}>
            New invoice
          </Button>
        }
      />

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end">
        <Field
          label="Search"
          type="search"
          placeholder="Search by number or customer"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="md:w-80"
        />

        <div className="flex flex-col gap-2 md:w-48">
          <label htmlFor={selectId} className="font-body text-sm font-medium text-ink">
            Status
          </label>
          <select
            id={selectId}
            value={status}
            onChange={(event) => setStatus(event.target.value as "All" | InvoiceStatus)}
            className="h-12 rounded-md border border-line bg-paper px-3 font-body text-base text-ink focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-accent"
          >
            <option value="All">All statuses</option>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>

        <p className="font-mono text-xs text-ink-3 md:ml-auto md:pb-3">
          {filtered.length} of {invoices.length} invoices
        </p>
      </div>

      {filtered.length > 0 ? (
        <>
          <DataTable columns={columns} rows={filtered} />
          <div className="mt-4 flex items-baseline justify-end gap-3">
            <span className="font-body text-sm text-ink-2">Total billed</span>
            <span className="font-mono text-base tabular-nums text-ink">{currency.format(total)}</span>
          </div>
        </>
      ) : (
        <EmptyState
          title="No invoices found"
          body="No invoice matches the current search and status filter. Clear the filters to see all invoices."
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery("");
                setStatus("All");
              }}
            >
              Clear filters
            </Button>
          }
        />
      )}
    </main>
  );
}
