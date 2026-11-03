import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { DataTable } from "@/components/DataTable";

const invoice = {
  id: "INV-2024-001247",
  status: "sent",
  issueDate: "2024-01-15",
  dueDate: "2024-02-14",
  billFrom: {
    name: "Almanac Press",
    address: "1200 Paper Mill Road",
    city: "Portland, OR 97214",
    email: "billing@almanacpress.com",
  },
  billTo: {
    name: "Meridian Books",
    address: "4500 Oak Street",
    city: "Seattle, WA 98101",
    email: "accounts@meridianbooks.com",
  },
  lineItems: [
    { description: "Editorial Services — Q4 Manuscript Review", quantity: 1, unitPrice: 2500, total: 2500 },
    { description: "Copyediting — 120 pages @ $45/page", quantity: 120, unitPrice: 45, total: 5400 },
    { description: "Proofreading — 120 pages @ $25/page", quantity: 120, unitPrice: 25, total: 3000 },
    { description: "Indexing — 450 entries @ $8/entry", quantity: 450, unitPrice: 8, total: 3600 },
  ],
  subtotal: 14500,
  tax: 1160,
  total: 15660,
  payments: [
    { date: "2024-01-20", amount: 5000, method: "Bank Transfer", reference: "TXN-884721" },
    { date: "2024-02-01", amount: 5000, method: "Bank Transfer", reference: "TXN-891034" },
  ],
  balanceDue: 5660,
};

const statusTones: Record<string, "neutral" | "positive" | "warning" | "negative" | "accent"> = {
  draft: "neutral",
  sent: "warning",
  paid: "positive",
  overdue: "negative",
  voided: "neutral",
};

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

const lineItemColumns = [
  { key: "description", header: "Description" },
  { key: "quantity", header: "Qty", align: "right" as const, numeric: true },
  { key: "unitPrice", header: "Unit Price", align: "right" as const, numeric: true, render: (v: number) => formatCurrency(v * 100) },
  { key: "total", header: "Total", align: "right" as const, numeric: true, render: (v: number) => formatCurrency(v * 100) },
];

const paymentColumns = [
  { key: "date", header: "Date" },
  { key: "amount", header: "Amount", align: "right" as const, numeric: true, render: (v: number) => formatCurrency(v * 100) },
  { key: "method", header: "Method" },
  { key: "reference", header: "Reference" },
];

export default function InvoiceDetailPage() {
  return (
    <main className="px-6 py-12 md:px-16">
      <PageHeader
        eyebrow="Invoice"
        title={invoice.id}
        description={`Issued ${formatDate(invoice.issueDate)} · Due ${formatDate(invoice.dueDate)}`}
        actions={
          <div className="flex gap-3">
            <Button variant="secondary" size="sm">Download PDF</Button>
            <Button variant="danger" size="sm">Void Invoice</Button>
            <Button variant="primary" size="sm">Send Reminder</Button>
          </div>
        }
      />

      <div className="mb-12 grid gap-6 md:grid-cols-3">
        <Card title="Status">
          <div className="flex items-center gap-4">
            <Badge tone={statusTones[invoice.status]}>{invoice.status}</Badge>
            <div className="font-body text-sm text-ink-2">
              Balance due: <span className="font-mono font-medium text-ink">{formatCurrency(invoice.balanceDue * 100)}</span>
            </div>
          </div>
        </Card>

        <Card title="Bill From" className="md:col-span-2">
          <address className="font-body text-base text-ink-2 not-italic">
            <p className="font-medium text-ink">{invoice.billFrom.name}</p>
            <p>{invoice.billFrom.address}</p>
            <p>{invoice.billFrom.city}</p>
            <p><a href={`mailto:${invoice.billFrom.email}`} className="text-accent hover:underline">{invoice.billFrom.email}</a></p>
          </address>
        </Card>

        <Card title="Bill To" className="md:col-span-2">
          <address className="font-body text-base text-ink-2 not-italic">
            <p className="font-medium text-ink">{invoice.billTo.name}</p>
            <p>{invoice.billTo.address}</p>
            <p>{invoice.billTo.city}</p>
            <p><a href={`mailto:${invoice.billTo.email}`} className="text-accent hover:underline">{invoice.billTo.email}</a></p>
          </address>
        </Card>
      </div>

      <Card title="Line Items">
        <DataTable
          columns={lineItemColumns}
          rows={invoice.lineItems.map((item, i) => ({ ...item, id: i }))}
        />
        <div className="mt-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-end">
          <div className="flex items-baseline gap-4 font-body text-base text-ink-2">
            <span>Subtotal</span>
            <span className="font-mono font-medium text-ink w-32 text-right">{formatCurrency(invoice.subtotal * 100)}</span>
          </div>
          <div className="flex items-baseline gap-4 font-body text-base text-ink-2">
            <span>Tax (8%)</span>
            <span className="font-mono font-medium text-ink w-32 text-right">{formatCurrency(invoice.tax * 100)}</span>
          </div>
          <div className="flex items-baseline gap-4 font-display text-lg font-medium text-ink border-t border-line pt-2">
            <span>Total</span>
            <span className="font-mono w-32 text-right">{formatCurrency(invoice.total * 100)}</span>
          </div>
        </div>
      </Card>

      <Card title="Payment History">
        {invoice.payments.length > 0 ? (
          <DataTable
            columns={paymentColumns}
            rows={invoice.payments.map((p, i) => ({ ...p, id: i }))}
          />
        ) : (
          <p className="font-body text-base text-ink-3">No payments recorded.</p>
        )}
      </Card>
    </main>
  );
}
