import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { DataTable, type Column } from "@/components/DataTable";
import { Badge } from "@/components/Badge";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { useState } from "react";

interface Invoice {
  id: string;
  number: string;
  customer: string;
  issueDate: string;
  dueDate: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  amount: number;
}

const sampleInvoices: Invoice[] = [
  { id: "1", number: "INV-2024-001", customer: "Acme Corporation", issueDate: "2024-01-15", dueDate: "2024-02-14", status: "paid", amount: 12500.00 },
  { id: "2", number: "INV-2024-002", customer: "Globex Industries", issueDate: "2024-01-20", dueDate: "2024-02-19", status: "sent", amount: 8750.50 },
  { id: "3", number: "INV-2024-003", customer: "Wayne Enterprises", issueDate: "2024-02-01", dueDate: "2024-03-02", status: "overdue", amount: 23400.00 },
  { id: "4", number: "INV-2024-004", customer: "Stark Industries", issueDate: "2024-02-10", dueDate: "2024-03-11", status: "draft", amount: 5600.75 },
  { id: "5", number: "INV-2024-005", customer: "Umbrella Corp", issueDate: "2024-02-15", dueDate: "2024-03-16", status: "paid", amount: 18900.00 },
  { id: "6", number: "INV-2024-006", customer: "Cyberdyne Systems", issueDate: "2024-02-20", dueDate: "2024-03-21", status: "sent", amount: 31200.25 },
  { id: "7", number: "INV-2024-007", customer: "Massive Dynamic", issueDate: "2024-02-25", dueDate: "2024-03-26", status: "cancelled", amount: 7800.00 },
  { id: "8", number: "INV-2024-008", customer: "Initech", issueDate: "2024-03-01", dueDate: "2024-03-31", status: "overdue", amount: 4500.00 },
];

const statusTones: Record<Invoice["status"], "neutral" | "positive" | "warning" | "negative" | "accent"> = {
  draft: "neutral",
  sent: "accent",
  paid: "positive",
  overdue: "negative",
  cancelled: "warning",
};

const statusLabels: Record<Invoice["status"], string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

const columns: Column<Invoice>[] = [
  { key: "number", header: "Number", align: "left" },
  { key: "customer", header: "Customer", align: "left" },
  { key: "issueDate", header: "Issue date", align: "left" },
  { key: "dueDate", header: "Due date", align: "left" },
  {
    key: "status",
    header: "Status",
    align: "left",
    render: (row) => <Badge tone={statusTones[row.status]}>{statusLabels[row.status]}</Badge>,
  },
  { key: "amount", header: "Amount", align: "right", numeric: true, render: (row) => `$${row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
];

export default function InvoicesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredInvoices = sampleInvoices.filter((invoice) => {
    const matchesSearch = invoice.number.toLowerCase().includes(search.toLowerCase()) ||
      invoice.customer.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <main className="px-6 py-12 md:px-16 bg-paper min-h-screen">
      <PageHeader
        title="Invoices"
        description="Track and manage all invoices."
        actions={<Button variant="primary" size="md">New invoice</Button>}
      />

      <div className="mt-6 flex flex-col md:flex-row gap-3 items-start md:items-center">
        <Field
          label="Search"
          placeholder="Search by number or customer"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-72"
        />
        <Field
          label="Status"
          className="w-full md:w-48"
          as="select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </Field>
      </div>

      {filteredInvoices.length > 0 ? (
        <DataTable columns={columns} rows={filteredInvoices} />
      ) : (
        <EmptyState
          title="No invoices found"
          body="Adjust your search or filter, or create a new invoice to get started."
          action={<Button variant="primary" size="md">New invoice</Button>}
        />
      )}
    </main>
  );
}
