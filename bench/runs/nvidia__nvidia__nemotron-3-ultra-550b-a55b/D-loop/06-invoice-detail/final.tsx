import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { DataTable } from "@/components/DataTable";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Payment {
  id: string;
  date: string;
  amount: number;
  method: string;
  reference: string;
}

const invoice = {
  number: "INV-2024-001",
  status: "sent" as const,
  issueDate: "2024-01-15",
  dueDate: "2024-02-14",
  currency: "USD",
  billFrom: {
    name: "Almanac Studio",
    address: "1200 Paper Mill Road",
    city: "Portland, OR 97214",
    email: "billing@almanac.studio",
    taxId: "US-12-3456789",
  },
  billTo: {
    name: "Meridian Print Co.",
    address: "4500 Inkwell Avenue",
    city: "Seattle, WA 98101",
    email: "accounts@meridianprint.com",
    taxId: "US-98-7654321",
  },
  lineItems: [
    { id: "1", description: "Editorial design — Brand guidelines v2", quantity: 1, unitPrice: 4800, total: 4800 },
    { id: "2", description: "Type system development — Display & text families", quantity: 1, unitPrice: 3200, total: 3200 },
    { id: "3", description: "Component library — React + Tailwind implementation", quantity: 1, unitPrice: 5600, total: 5600 },
    { id: "4", description: "Design tokens & documentation site", quantity: 1, unitPrice: 2400, total: 2400 },
    { id: "5", description: "Revisions (2 rounds included)", quantity: 2, unitPrice: 0, total: 0 },
  ] as LineItem[],
  payments: [
    { id: "PAY-001", date: "2024-01-20", amount: 8000, method: "Bank transfer", reference: "TRX-7742" },
    { id: "PAY-002", date: "2024-02-01", amount: 4000, method: "Credit card", reference: "TRX-8891" },
  ] as Payment[],
};

const subtotal = invoice.lineItems.reduce((sum, item) => sum + item.total, 0);
const paidTotal = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
const balanceDue = subtotal - paidTotal;

const statusTones: Record<string, "neutral" | "positive" | "warning" | "negative" | "accent"> = {
  draft: "neutral",
  sent: "accent",
  paid: "positive",
  overdue: "negative",
  void: "warning",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
  void: "Void",
};

export default function InvoiceDetailPage() {
  const lineColumns = [
    { key: "description", header: "Description" },
    { key: "quantity", header: "Qty", align: "right" as const, numeric: true },
    { key: "unitPrice", header: "Unit price", align: "right" as const, numeric: true, render: (v: number) => `$${v.toLocaleString()}` },
    { key: "total", header: "Total", align: "right" as const, numeric: true, render: (v: number) => `$${v.toLocaleString()}` },
  ];

  const paymentColumns = [
    { key: "date", header: "Date" },
    { key: "amount", header: "Amount", align: "right" as const, numeric: true, render: (v: number) => `$${v.toLocaleString()}` },
    { key: "method", header: "Method" },
    { key: "reference", header: "Reference" },
  ];

  return (
    <main className="bg-paper min-h-screen">
      <div className="mx-auto max-w-6xl px-6 py-12 md:px-16">
        <PageHeader
          eyebrow="Invoice"
          title={invoice.number}
          description={`Issued ${new Date(invoice.issueDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · Due ${new Date(invoice.dueDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`}
          actions={
            <div className="flex gap-3">
              <Button variant="ghost" size="md">Download PDF</Button>
              <Button variant="danger" size="md">Void invoice</Button>
              <Button variant="primary" size="md">Send reminder</Button>
            </div>
          }
        />

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-display text-xl font-medium text-ink">Invoice header</span>
                  <Badge tone={statusTones[invoice.status]}>{statusLabels[invoice.status]}</Badge>
                </div>
                <dl className="grid gap-2 text-sm font-body text-ink-2 md:grid-cols-2">
                  <div><dt className="font-mono text-xs uppercase tracking-widest text-ink-3">Invoice number</dt><dd className="font-mono text-base text-ink">{invoice.number}</dd></div>
                  <div><dt className="font-mono text-xs uppercase tracking-widest text-ink-3">Issue date</dt><dd>{new Date(invoice.issueDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</dd></div>
                  <div><dt className="font-mono text-xs uppercase tracking-widest text-ink-3">Due date</dt><dd>{new Date(invoice.dueDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</dd></div>
                  <div><dt className="font-mono text-xs uppercase tracking-widest text-ink-3">Currency</dt><dd className="font-mono text-base text-ink">{invoice.currency}</dd></div>
                </dl>
              </div>
              <div className="text-right">
                <p className="font-mono text-xs uppercase tracking-widest text-ink-3">Balance due</p>
                <p className="font-display text-2xl font-medium text-ink mt-1">${balanceDue.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="font-display text-lg font-medium text-ink mb-4">Bill from</h2>
            <address className="font-body text-sm text-ink-2 not-italic space-y-1">
              <p className="font-medium text-ink">{invoice.billFrom.name}</p>
              <p>{invoice.billFrom.address}</p>
              <p>{invoice.billFrom.city}</p>
              <p><a href={`mailto:${invoice.billFrom.email}`} className="text-accent hover:underline">{invoice.billFrom.email}</a></p>
              <p className="font-mono text-xs text-ink-3">Tax ID: {invoice.billFrom.taxId}</p>
            </address>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Card>
            <h2 className="font-display text-lg font-medium text-ink mb-4">Bill to</h2>
            <address className="font-body text-sm text-ink-2 not-italic space-y-1">
              <p className="font-medium text-ink">{invoice.billTo.name}</p>
              <p>{invoice.billTo.address}</p>
              <p>{invoice.billTo.city}</p>
              <p><a href={`mailto:${invoice.billTo.email}`} className="text-accent hover:underline">{invoice.billTo.email}</a></p>
              <p className="font-mono text-xs text-ink-3">Tax ID: {invoice.billTo.taxId}</p>
            </address>
          </Card>

          <Card>
            <h2 className="font-display text-lg font-medium text-ink mb-4">Payment summary</h2>
            <dl className="space-y-3 font-body text-sm text-ink-2">
              <div className="flex justify-between border-b border-line pb-3">
                <dt>Subtotal</dt>
                <dd className="font-mono text-ink">${subtotal.toLocaleString()}</dd>
              </div>
              <div className="flex justify-between border-b border-line pb-3">
                <dt>Payments received</dt>
                <dd className="font-mono text-moss">${paidTotal.toLocaleString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-ink">Balance due</dt>
                <dd className="font-display text-lg font-medium text-ink">${balanceDue.toLocaleString()}</dd>
              </div>
            </dl>
          </Card>
        </div>

        <Card className="mt-6">
          <h2 className="font-display text-lg font-medium text-ink mb-4">Line items</h2>
          <DataTable columns={lineColumns} rows={invoice.lineItems} />
          <div className="mt-4 flex justify-end">
            <p className="font-display text-xl font-medium text-ink">${subtotal.toLocaleString()}</p>
          </div>
        </Card>

        <Card className="mt-6">
          <h2 className="font-display text-lg font-medium text-ink mb-4">Payment history</h2>
          {invoice.payments.length > 0 ? (
            <DataTable columns={paymentColumns} rows={invoice.payments} />
          ) : (
            <div className="py-12 text-center border-2 border-dashed border-line rounded-md">
              <p className="font-body text-ink-2">No payments recorded yet.</p>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
