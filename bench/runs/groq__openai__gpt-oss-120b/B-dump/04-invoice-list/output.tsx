import { PageHeader } from "@/components/PageHeader";
import { DataTable, Column } from "@/components/DataTable";
import { Field } from "@/components/Field";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";

type Invoice = {
  id: string;
  number: string;
  customer: string;
  issueDate: string;
  dueDate: string;
  status: "paid" | "pending" | "overdue";
  amount: number;
};

const sampleInvoices: Invoice[] = [
  {
    id: "1",
    number: "INV‑00123",
    customer: "Acme Corp",
    issueDate: "2024‑09‑01",
    dueDate: "2024‑09‑15",
    status: "paid",
    amount: 1240.0,
  },
  {
    id: "2",
    number: "INV‑00124",
    customer: "Beta LLC",
    issueDate: "2024‑09‑05",
    dueDate: "2024‑09‑20",
    status: "pending",
    amount: 560.5,
  },
  {
    id: "3",
    number: "INV‑00125",
    customer: "Gamma Co",
    issueDate: "2024‑08‑28",
    dueDate: "2024‑09‑12",
    status: "overdue",
    amount: 312.75,
  },
];

const statusTone: Record<Invoice["status"], "positive" | "warning" | "negative"> = {
  paid: "positive",
  pending: "warning",
  overdue: "negative",
};

export default function InvoicesPage() {
  const columns: Column<Invoice>[] = [
    {
      key: "number",
      header: "Invoice #",
      align: "left",
    },
    {
      key: "customer",
      header: "Customer",
      align: "left",
    },
    {
      key: "issueDate",
      header: "Issue date",
      align: "left",
    },
    {
      key: "dueDate",
      header: "Due date",
      align: "left",
    },
    {
      key: "status",
      header: "Status",
      align: "left",
      render: (row) => (
        <Badge tone={statusTone[row.status]}>
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </Badge>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      numeric: true,
      render: (row) => `$${row.amount.toFixed(2)}`,
    },
  ];

  return (
    <main className="px-6 py-12 md:px-16 bg-paper">
      <PageHeader
        title="Invoices"
        description="All invoices issued to your customers."
        actions={<Button variant="primary">New invoice</Button>}
      />

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex-1">
          <Field label="Search" placeholder="Search invoices…" />
        </div>

        <div className="flex-1">
          <label className="font-body text-sm font-medium text-ink mb-2 block">
            Status
          </label>
          <select className="h-12 w-full rounded-md border bg-paper px-3 font-body text-base text-ink focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-accent">
            <option value="">All statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      <DataTable columns={columns} rows={sampleInvoices} />
    </main>
  );
}
