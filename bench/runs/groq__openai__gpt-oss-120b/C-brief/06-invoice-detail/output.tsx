import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { DataTable } from "@/components/DataTable";

type LineItem = {
  description: string;
  qty: number;
  unitPrice: number;
  total: number;
};

type Payment = {
  date: string;
  method: string;
  amount: number;
  status: "Paid" | "Pending" | "Failed";
};

export default function InvoiceDetailPage() {
  // ----- Sample data ---------------------------------------------------------
  const invoice = {
    id: "INV-00123",
    issued: "2024‑03‑01",
    due: "2024‑03‑31",
    status: "Pending" as const,
    total: 1245.0,
  };

  const billFrom = {
    name: "Acme Corp.",
    address: ["123 Market St.", "Suite 400", "Springfield, IL 62701"],
    email: "billing@acme.example.com",
  };

  const billTo = {
    name: "John Doe",
    address: ["789 Elm St.", "Apt. 12B", "Shelbyville, IL 62565"],
    email: "john.doe@example.com",
  };

  const lineItems: LineItem[] = [
    { description: "Consulting services – March", qty: 10, unitPrice: 100, total: 1000 },
    { description: "Travel expenses", qty: 1, unitPrice: 245, total: 245 },
  ];

  const payments: Payment[] = [
    { date: "2024‑03‑05", method: "Bank transfer", amount: 500, status: "Paid" },
    { date: "2024‑03‑20", method: "Credit card", amount: 745, status: "Pending" },
  ];

  // ----- Table definitions ----------------------------------------------------
  const lineItemColumns = [
    { key: "description", header: "Description" },
    { key: "qty", header: "Qty", numeric: true, align: "right" as const },
    {
      key: "unitPrice",
      header: "Unit price",
      numeric: true,
      align: "right" as const,
      render: (v: number) => <span className="font-mono">{`$${v.toFixed(2)}`}</span>,
    },
    {
      key: "total",
      header: "Total",
      numeric: true,
      align: "right" as const,
      render: (v: number) => <span className="font-mono font-medium">{`$${v.toFixed(2)}`}</span>,
    },
  ];

  const paymentColumns = [
    { key: "date", header: "Date" },
    { key: "method", header: "Method" },
    {
      key: "amount",
      header: "Amount",
      numeric: true,
      align: "right" as const,
      render: (v: number) => <span className="font-mono">{`$${v.toFixed(2)}`}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (v: Payment["status"]) => {
        const tone = v === "Paid" ? "positive" : v === "Pending" ? "warning" : "negative";
        return <Badge tone={tone}>{v}</Badge>;
      },
    },
  ];

  // ----- Helpers --------------------------------------------------------------
  const statusTone: Record<typeof invoice.status, "neutral" | "positive" | "warning" | "negative" | "accent"> = {
    Paid: "positive",
    Pending: "warning",
    Overdue: "negative",
    Draft: "neutral",
  };

  // ----- Render ---------------------------------------------------------------
  return (
    <main className="bg-paper text-ink p-6 md:p-16">
      <PageHeader
        eyebrow="Invoice"
        title={`Invoice #${invoice.id}`}
        description={`Issued ${invoice.issued} • Due ${invoice.due}`}
        actions={
          <div className="flex gap-3">
            <Button variant="secondary" size="sm">
              Send reminder
            </Button>
            <Button variant="primary" size="sm">
              Download PDF
            </Button>
            <Button variant="danger" size="sm">
              Void invoice
            </Button>
          </div>
        }
      />

      {/* Invoice summary */}
      <Card className="mb-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Badge tone={statusTone[invoice.status]}>{invoice.status}</Badge>
            <span className="font-mono text-base">{`#${invoice.id}`}</span>
          </div>
          <div className="font-display text-2xl font-medium">
            <span className="font-mono">{`$${invoice.total.toFixed(2)}`}</span>
          </div>
        </div>
      </Card>

      {/* Parties */}
      <div className="grid gap-12 md:grid-cols-2 mb-12">
        <Card title="Bill from">
          <p className="font-body text-base text-ink-2">{billFrom.name}</p>
          {billFrom.address.map((line, i) => (
            <p key={i} className="font-body text-sm text-ink-2">
              {line}
            </p>
          ))}
          <p className="font-body text-sm text-ink-2 mt-2">{billFrom.email}</p>
        </Card>

        <Card title="Bill to">
          <p className="font-body text-base text-ink-2">{billTo.name}</p>
          {billTo.address.map((line, i) => (
            <p key={i} className="font-body text-sm text-ink-2">
              {line}
            </p>
          ))}
          <p className="font-body text-sm text-ink-2 mt-2">{billTo.email}</p>
        </Card>
      </div>

      {/* Line items */}
      <Card title="Line items" className="mb-12">
        <DataTable columns={lineItemColumns} rows={lineItems} />
      </Card>

      {/* Payment history */}
      <Card title="Payment history">
        <DataTable columns={paymentColumns} rows={payments} />
      </Card>
    </main>
  );
}
