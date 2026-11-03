import { PageHeader } from "@/components/PageHeader";
import { Field } from "@/components/Field";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";

type InvoiceStatus = "paid" | "pending" | "overdue" | "draft";

interface Invoice {
  id: string;
  number: string;
  customer: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  amount: number;
}

const statusTones: Record<InvoiceStatus, "positive" | "warning" | "negative" | "neutral"> = {
  paid: "positive",
  pending: "warning",
  overdue: "negative",
  draft: "neutral",
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
    customer: "Globex Industries",
    issueDate: "2024-01-20",
    dueDate: "2024-02-19",
    status: "pending",
    amount: 8750.50,
  },
  {
    id: "3",
    number: "INV-2024-003",
    customer: "Wayne Enterprises",
    issueDate: "2024-01-25",
    dueDate: "2024-02-24",
    status: "overdue",
    amount: 23400.00,
  },
  {
    id: "4",
    number: "INV-2024-004",
    customer: "Stark Industries",
    issueDate: "2024-02-01",
    dueDate: "2024-03-02",
    status: "draft",
    amount: 5600.75,
  },
  {
    id: "5",
    number: "INV-2024-005",
    customer: "Umbrella Corp",
    issueDate: "2024-02-05",
    dueDate: "2024-03-06",
    status: "paid",
    amount: 18900.00,
  },
  {
    id: "6",
    number: "INV-2024-006",
    customer: "Cyberdyne Systems",
    issueDate: "2024-02-10",
    dueDate: "2024-03-11",
    status: "pending",
    amount: 31200.25,
  },
];

const columns = [
  { key: "number", header: "Number", align: "left" as const },
  { key: "customer", header: "Customer", align: "left" as const },
  { key: "issueDate", header: "Issue date", align: "left" as const },
  { key: "dueDate", header: "Due date", align: "left" as const },
  { key: "status", header: "Status", align: "left" as const, render: (row: Invoice) => (
    <Badge tone={statusTones[row.status]}>{row.status}</Badge>
  )},
  { key: "amount", header: "Amount", align: "right" as const, numeric: true, render: (row: Invoice) => (
    <span className="font-mono tabular-nums">${row.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
  )},
];

export default function InvoicesPage() {
  return (
    <main className="px-6 py-12 md:px-16">
      <PageHeader
        title="Invoices"
        description="Track and manage all invoices."
        actions={
          <Button variant="primary" size="md">
            Create invoice
          </Button>
        }
      />

      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end md:gap-6">
        <Field
          label="Search invoices"
          placeholder="Search by number, customer…"
          className="w-full md:w-80"
        />
        <Field
          label="Status"
          className="w-full md:w-48"
          as="select"
        >
          <option value="">All statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
          <option value="draft">Draft</option>
        </Field>
      </div>

      <DataTable columns={columns} rows={sampleInvoices} />
    </main>
  );
}
