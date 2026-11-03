import { useMemo, useState } from "react";

import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { DataTable, type Column } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { Field } from "@/components/Field";
import { PageHeader } from "@/components/PageHeader";

type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Overdue";
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
    id: "inv-0142",
    number: "INV-2025-0142",
    customer: "Northwind Trading Co.",
    issueDate: "2025-01-08",
    dueDate: "2025-02-07",
    status: "Paid",
    amount: 4820,
  },
  {
    id: "inv-0143",
    number: "INV-2025-0143",
    customer: "Harbor & Pine Studio",
    issueDate: "2025-01-15",
    dueDate: "2025-02-14",
    status: "Paid",
    amount: 1265.5,
  },
  {
    id: "inv-0144",
    number: "INV-2025-0144",
    customer: "Meridian Health Partners",
    issueDate: "2025-01-22",
    dueDate: "2025-02-21",
    status: "Overdue",
    amount: 9340,
  },
  {
    id: "inv-0145",
    number: "INV-2025-0145",
    customer: "Copperline Manufacturing",
    issueDate: "2025-02-03",
    dueDate: "2025-03-05",
    status: "Sent",
    amount: 6725.75,
  },
  {
    id: "inv-0146",
    number: "INV-2025-0146",
    customer: "Atlas Freight Logistics",
    issueDate: "2025-02-11",
    dueDate: "2025-03-13",
    status: "Sent",
    amount: 3180,
  },
  {
    id: "inv-0147",
    number: "INV-2025-0147",
    customer: "Juniper Coffee Roasters",
    issueDate: "2025-02-19",
    dueDate: "2025-03-21",
    status: "Paid",
    amount: 742.25,
  },
  {
    id: "inv-0148",
    number: "INV-2025-0148",
    customer: "Larkspur Design Co.",
    issueDate: "2025-03-04",
    dueDate: "2025-04-03",
    status: "Draft",
    amount: 2150,
  },
  {
    id: "inv-0149",
    number: "INV-2025-0149",
    customer: "Stonebridge Legal Group",
    issueDate: "2025-03-12",
    dueDate: "2025-04-11",
    status: "Sent",
    amount: 5600,
  },
  {
    id: "inv-0150",
    number: "INV-2025-0150",
    customer: "Verdant Agricultural Co-op",
    issueDate: "2025-03-25",
    dueDate: "2025-04-24",
    status: "Overdue",
    amount: 12890.4,
  },
  {
    id: "inv-0151",
    number: "INV-2025-0151",
    customer: "Brightwater Utilities",
    issueDate: "2025-04-02",
    dueDate: "2025-05-02",
    status: "Paid",
    amount: 3980,
  },
];

const statusTones: Record<
  InvoiceStatus,
  "neutral" | "accent" | "positive" | "negative"
> = {
  Draft: "neutral",
  Sent: "accent",
  Paid: "positive",
  Overdue: "negative",
};

const statusOptions: StatusFilter[] = ["All", "Draft", "Sent", "Paid", "Overdue"];

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return `${day} ${monthNames[month - 1]} ${year}`;
}

function formatAmount(amount: number): string {
  return currencyFormatter.format(amount);
}

const columns: Column<Invoice>[] = [
  { key: "number", header: "Number", numeric: true },
  { key: "customer", header: "Customer" },
  { key: "issueDate", header: "Issue date", render: (row) => formatDate(row.issueDate) },
  {
    key: "dueDate",
    header: "Due date",
    render: (row) =>
      row.status === "Overdue" ? (
        <span className="text-brick">{formatDate(row.dueDate)}</span>
      ) : (
        formatDate(row.dueDate)
      ),
  },
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
    render: (row) => formatAmount(row.amount),
  },
];

export default function InvoicesPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("All");

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const matchesStatus = status === "All" || invoice.status === status;
      const matchesTerm =
        term === "" ||
        invoice.number.toLowerCase().includes(term) ||
        invoice.customer.toLowerCase().includes(term);

      return matchesStatus && matchesTerm;
    });
  }, [query, status]);

  const clearFilters = () => {
    setQuery("");
    setStatus("All");
  };

  return (
    <main className="px-6 py-12 md:px-16">
      <PageHeader
        eyebrow="Ledger"
        title="Invoices"
        description="Every invoice raised for your customers, with dates, status and amounts outstanding."
        actions={<Button variant="primary">Create invoice</Button>}
      />

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:gap-6">
        <Field
          label="Search invoices"
          type="search"
          placeholder="Search by number or customer"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full md:w-96"
        />

        <div className="flex w-full flex-col gap-2 md:w-64">
          <label htmlFor="invoice-status" className="font-body text-sm font-medium text-ink">
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

        <p className="font-mono text-xs text-ink-3 md:ml-auto md:pb-3">
          {rows.length} of {invoices.length} invoices
        </p>
      </div>

      {rows.length > 0 ? (
        <DataTable columns={columns} rows={rows} />
      ) : (
        <EmptyState
          title="No invoices found"
          body="Nothing matches this search and status filter. Try a different term, or create a new invoice to get started."
          action={
            <Button variant="secondary" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      )}
    </main>
  );
}
