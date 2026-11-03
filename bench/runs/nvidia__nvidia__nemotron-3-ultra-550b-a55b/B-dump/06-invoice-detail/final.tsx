import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { SideNav } from "@/components/SideNav";
import type { NavItem } from "@/components/SideNav";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Invoices", href: "/invoices", active: true },
  { label: "Clients", href: "/clients" },
  { label: "Reports", href: "/reports" },
  { label: "Settings", href: "/settings" },
];

const invoice = {
  id: "INV-2024-0042",
  status: "sent" as const,
  issueDate: "2024-01-15",
  dueDate: "2024-02-14",
  currency: "USD",
  from: {
    name: "Almanac Studio",
    email: "billing@almanac.studio",
    address: "1200 Paper Lane, Suite 300",
    city: "Portland, OR 97205",
    taxId: "US-EIN-12-3456789",
  },
  to: {
    name: "Meridian Collective",
    email: "ap@meridian.co",
    address: "450 Market Street, Floor 12",
    city: "San Francisco, CA 94105",
    taxId: "US-EIN-98-7654321",
  },
  lineItems: [
    { id: "1", description: "Brand identity system", qty: 1, unitPrice: 12000, total: 12000 },
    { id: "2", description: "Website design & development", qty: 1, unitPrice: 28000, total: 28000 },
    { id: "3", description: "Monthly retainer (Jan–Mar)", qty: 3, unitPrice: 4500, total: 13500 },
    { id: "4", description: "Stock photography license", qty: 1, unitPrice: 1200, total: 1200 },
  ],
  payments: [
    { id: "p1", date: "2024-01-20", method: "Bank transfer", amount: 15000, ref: "TXN-88421" },
    { id: "p2", date: "2024-02-01", method: "Credit card", amount: 10000, ref: "TXN-89103" },
  ],
  subtotal: 54700,
  tax: 4376,
  total: 59076,
  paid: 25000,
  balance: 34076,
};

const statusConfig = {
  draft: { label: "Draft", tone: "neutral" as const },
  sent: { label: "Sent", tone: "accent" as const },
  paid: { label: "Paid", tone: "positive" as const },
  overdue: { label: "Overdue", tone: "negative" as const },
  void: { label: "Void", tone: "warning" as const },
} as const;

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(amount);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function InvoiceDetailPage() {
  const status = statusConfig[invoice.status];

  const lineColumns = [
    { key: "description", header: "Description", align: "left" as const },
    { key: "qty", header: "Qty", align: "right" as const, numeric: true },
    { key: "unitPrice", header: "Unit price", align: "right" as const, numeric: true, render: (r: typeof invoice.lineItems[0]) => formatCurrency(r.unitPrice) },
    { key: "total", header: "Total", align: "right" as const, numeric: true, render: (r: typeof invoice.lineItems[0]) => formatCurrency(r.total) },
  ];

  const paymentColumns = [
    { key: "date", header: "Date", align: "left" as const, render: (r: typeof invoice.payments[0]) => formatDate(r.date) },
    { key: "method", header: "Method", align: "left" as const },
    { key: "amount", header: "Amount", align: "right" as const, numeric: true, render: (r: typeof invoice.payments[0]) => formatCurrency(r.amount) },
    { key: "ref", header: "Reference", align: "left" as const },
  ];

  return (
    <div className="flex min-h-screen bg-paper">
      <SideNav product="Almanac" items={navItems} />
      <main className="flex-1 px-6 py-12 md:px-16">
        <PageHeader
          eyebrow="Invoice"
          title={invoice.id}
          description={`Issued ${formatDate(invoice.issueDate)} · Due ${formatDate(invoice.dueDate)}`}
          actions={
            <div className="flex gap-3">
              <Button variant="secondary">Download PDF</Button>
              <Button variant="danger">Void invoice</Button>
              <Button variant="primary">Send reminder</Button>
            </div>
          }
        />

        <div className="flex flex-col gap-8 md:grid md:grid-cols-3">
          <Card className="md:col-span-2">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <Badge tone={status.tone}>{status.label}</Badge>
                  <span className="font-mono text-sm text-ink-3">#{invoice.id}</span>
                </div>
                <dl className="grid gap-2 font-body text-sm text-ink-2 md:grid-cols-2">
                  <dt>Issue date</dt>
                  <dd className="font-mono text-ink">{formatDate(invoice.issueDate)}</dd>
                  <dt>Due date</dt>
                  <dd className="font-mono text-ink">{formatDate(invoice.dueDate)}</dd>
                  <dt>Currency</dt>
                  <dd className="font-mono text-ink">{invoice.currency}</dd>
                </dl>
              </div>
            </div>

            <div className="mt-8 grid gap-8 md:grid-cols-2">
              <div>
                <h3 className="font-body text-xs uppercase tracking-widest text-ink-3 mb-3">Bill from</h3>
                <address className="font-body text-sm text-ink-2 not-italic leading-relaxed">
                  <p className="font-medium text-ink">{invoice.from.name}</p>
                  <p>{invoice.from.email}</p>
                  <p>{invoice.from.address}</p>
                  <p>{invoice.from.city}</p>
                  <p>Tax ID: <span className="font-mono">{invoice.from.taxId}</span></p>
                </address>
              </div>
              <div>
                <h3 className="font-body text-xs uppercase tracking-widest text-ink-3 mb-3">Bill to</h3>
                <address className="font-body text-sm text-ink-2 not-italic leading-relaxed">
                  <p className="font-medium text-ink">{invoice.to.name}</p>
                  <p>{invoice.to.email}</p>
                  <p>{invoice.to.address}</p>
                  <p>{invoice.to.city}</p>
                  <p>Tax ID: <span className="font-mono">{invoice.to.taxId}</span></p>
                </address>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="font-body text-xs uppercase tracking-widest text-ink-3 mb-4">Totals</h3>
            <dl className="space-y-3 font-body text-sm">
              <div className="flex justify-between"><dt className="text-ink-2">Subtotal</dt><dd className="font-mono text-ink tabular-nums">{formatCurrency(invoice.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-2">Tax (8%)</dt><dd className="font-mono text-ink tabular-nums">{formatCurrency(invoice.tax)}</dd></div>
              <div className="border-t border-line pt-3 flex justify-between"><dt className="font-medium text-ink">Total</dt><dd className="font-display text-lg font-medium text-ink tabular-nums">{formatCurrency(invoice.total)}</dd></div>
              <div className="border-t border-line pt-3 flex justify-between text-moss"><dt className="font-medium">Paid</dt><dd className="font-mono tabular-nums">{formatCurrency(invoice.paid)}</dd></div>
              <div className="border-t border-line pt-3 flex justify-between text-brick"><dt className="font-medium">Balance due</dt><dd className="font-display text-lg font-medium tabular-nums">{formatCurrency(invoice.balance)}</dd></div>
            </dl>
          </Card>
        </div>

        <Card className="mt-8">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display text-lg font-medium text-ink">Line items</h2>
            <span className="font-mono text-xs text-ink-3">{invoice.lineItems.length} items</span>
          </div>
          <DataTable columns={lineColumns} rows={invoice.lineItems} />
        </Card>

        <Card className="mt-8">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display text-lg font-medium text-ink">Payment history</h2>
            <span className="font-mono text-xs text-ink-3">{invoice.payments.length} payments</span>
          </div>
          {invoice.payments.length > 0 ? (
            <DataTable columns={paymentColumns} rows={invoice.payments} />
          ) : (
            <p className="font-body text-sm text-ink-3">No payments recorded yet.</p>
          )}
        </Card>
      </main>
    </div>
  );
}
