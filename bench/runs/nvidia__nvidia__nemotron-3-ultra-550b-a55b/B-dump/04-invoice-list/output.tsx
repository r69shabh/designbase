import { Button } from "@/components/Button";
import { DataTable } from "@/components/DataTable";
import { Field } from "@/components/Field";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import type { ReactNode } from "react";

type Status = "paid" | "pending" | "overdue" | "draft";

interface Invoice {
  id: string;
  number: string;
  customer: string;
  issueDate: string;
  dueDate: string;
  status: Status;
  amount: number;
}

const STATUS_TONES: Record<Status, "positive" | "warning" | "negative" | "neutral"> = {
  paid: "positive",
  pending: "warning",
  overdue: "negative",
  draft: "neutral",
};

const STATUS_LABELS: Record<Status, string> = {
  paid: "Paid",
  pending: "Pending",
  overdue: "Overdue",
  draft: "Draft",
};

const sampleInvoices: Invoice[] = [
  {
    id: "1",
    number: "INV-2024-001",
    customer: "Acme Corporation",
    issueDate: "2024-01-15",
    dueDate: "2024-02-14",
    status: "paid",
    amount: 12500.00,
  },
  {
    id: "2",
    number: "INV-2024-002",
    customer: "Globex Inc.",
    issueDate: "2024-01-20",
    dueDate: "2024-02-19",
    status: "pending",
    amount: 8750.50,
  },
  {
    id: "3",
    number: "INV-2024-003",
    customer: "Wayne Enterprises",
    issueDate: "2024-01-10",
    dueDate: "2024-02-09",
    status: "overdue",
    amount: 23400.00,
  },
  {
    id: "4",
    number: "INV-2024-004",
    customer: "Stark Industries",
    issueDate: "2024-01-25",
    dueDate: "2024-02-24",
    status: "draft",
    amount: 5600.75,
  },
  {
    id: "5",
    number: "INV-2024-005",
    customer: "Umbrella Corp",
    issueDate: "2024-01-05",
    dueDate: "2024-02-04",
    status: "paid",
    amount: 18900.00,
  },
  {
    id: "6",
    number: "INV-2024-006",
    customer: "Cyberdyne Systems",
    issueDate: "2024-01-28",
    dueDate: "2024-02-27",
    status: "pending",
    amount: 31200.25,
  },
  {
    id: "7",
    number: "INV-2024-007",
    customer: "Massive Dynamic",
    issueDate: "2024-01-12",
    dueDate: "2024-02-11",
    status: "overdue",
    amount: 9800.00,
  },
  {
    id: "8",
    number: "INV-2024-008",
    customer: "Initech",
    issueDate: "2024-01-30",
    dueDate: "2024-03-01",
    status: "draft",
    amount: 4200.00,
  },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function InvoicesPage() {
  const columns = [
    {
      key: "number",
      header: "Number",
      render: (row: Invoice) => (
        <span className="font-mono text-sm text-ink">{row.number}</span>
      ),
    },
    {
      key: "customer",
      header: "Customer",
    },
    {
      key: "issueDate",
      header: "Issue date",
      render: (row: Invoice) => formatDate(row.issueDate),
    },
    {
      key: "dueDate",
      header: "Due date",
      render: (row: Invoice) => formatDate(row.dueDate),
    },
    {
      key: "status",
      header: "Status",
      render: (row: Invoice) => (
        <Badge tone={STATUS_TONES[row.status]}>{STATUS_LABELS[row.status]}</Badge>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right" as const,
      numeric: true,
      render: (row: Invoice) => (
        <span className="font-mono tabular-nums text-ink">{formatCurrency(row.amount)}</span>
      ),
    },
  ];

  return (
    <main className="px-6 py-12 md:px-16">
      <PageHeader
        title="Invoices"
        description="Track and manage all invoices across your customers."
        actions={<Button variant="primary">New invoice</Button>}
      />

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Field
          label="Search"
          placeholder="Search by number, customer…"
          className="w-full max-w-md"
        />
        <div className="flex gap-3">
          <Field
            label="Status"
            type="select"
            className="w-48"
          >
            <option value="">All statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
            <option value="draft">Draft</option>
          </Field>
        </div>
      </div>

      <DataTable columns={columns} rows={sampleInvoices} />
    </main>
  );
}
