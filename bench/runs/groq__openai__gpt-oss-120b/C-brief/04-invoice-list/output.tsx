import { useState, ChangeEvent } from "react";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { DataTable, Column } from "@/components/DataTable";
import { Badge } from "@/components/Badge";
import { PageHeader } from "@/components/PageHeader";

type Invoice = {
  id: string;
  number: string;
  customer: string;
  issueDate: string;
  dueDate: string;
  status: "Paid" | "Pending" | "Overdue";
  amount: string;
};

const sampleInvoices: Invoice[] = [
  {
    id: "1",
    number: "INV‑001",
    customer: "Acme Corp",
    issueDate: "2024‑09‑01",
    dueDate: "2024‑09‑15",
    status: "Paid",
    amount: "$1,200.00",
  },
  {
    id: "2",
    number: "INV‑002",
    customer: "Beta LLC",
    issueDate: "2024‑09‑05",
    dueDate: "2024‑09‑20",
    status: "Pending",
    amount: "$850.00",
  },
  {
    id: "3",
    number: "INV‑003",
    customer: "Gamma Co",
    issueDate: "2024‑08‑28",
    dueDate: "2024‑09‑12",
    status: "Overdue",
    amount: "$2,450.00",
  },
];

export default function InvoicesPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<Invoice["status"] | "All">("All");

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleStatus = (e: ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value as typeof status);
  };

  const filteredRows = sampleInvoices.filter((inv) => {
    const matchesSearch =
      inv.number.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === "All" || inv.status === status;
    return matchesSearch && matchesStatus;
  });

  const columns: Column<Invoice>[] = [
    { key: "number", header: "Number" },
    { key: "customer", header: "Customer" },
    { key: "issueDate", header: "Issue date" },
    { key: "dueDate", header: "Due date" },
    {
      key: "status",
      header: "Status",
      render: (row) => {
        const toneMap: Record<Invoice["status"], "positive" | "warning" | "negative"> = {
          Paid: "positive",
          Pending: "warning",
          Overdue: "negative",
        };
        return <Badge tone={toneMap[row.status]}>{row.status}</Badge>;
      },
    },
    {
      key: "amount",
      header: "Amount",
      numeric: true,
      align: "right",
    },
  ];

  return (
    <main className="px-6 py-12 md:px-16 bg-paper text-ink">
      <PageHeader
        title="Invoices"
        actions={<Button variant="primary">New invoice</Button>}
      />
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:gap-6">
        <Field
          label="Search"
          placeholder="Search invoices…"
          value={search}
          onChange={handleSearch}
          className="flex-1 md:flex-none md:w-64"
        />
        <div className="flex flex-col">
          <label htmlFor="status-filter" className="font-body text-sm font-medium text-ink">
            Status
          </label>
          <select
            id="status-filter"
            value={status}
            onChange={handleStatus}
            className="h-12 w-48 rounded-md border bg-paper px-3 font-body text-base text-ink focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-accent border-line"
          >
            <option value="All">All</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>
      </div>
      {filteredRows.length ? (
        <DataTable columns={columns} rows={filteredRows} />
      ) : (
        <p className="text-ink-3 font-body text-base">No invoices match your criteria.</p>
      )}
    </main>
  );
}
