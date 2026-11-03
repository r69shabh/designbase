import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { DataTable, type Column } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { SideNav } from "@/components/SideNav";
import { StatTile } from "@/components/StatTile";

const money = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface LineItem {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
  amount: number;
}

interface Payment {
  id: string;
  date: string;
  method: string;
  reference: string;
  amount: number;
  status: "settled" | "pending" | "failed";
}

const lineItems: LineItem[] = [
  { id: "li-1", description: "Editorial design — chapter structure and style guide", qty: 12, unitPrice: 120, amount: 1440 },
  { id: "li-2", description: "Typesetting and layout", qty: 8, unitPrice: 95, amount: 760 },
  { id: "li-3", description: "Cover illustration", qty: 1, unitPrice: 1200, amount: 1200 },
  { id: "li-4", description: "Print proofing and colour correction", qty: 3, unitPrice: 150, amount: 450 },
];

const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
const tax = Math.round(subtotal * 0.08 * 100) / 100;
const total = subtotal + tax;
const paid = 2000;
const balance = total - paid;

const payments: Payment[] = [
  { id: "pay-1", date: "2025-02-20", method: "Bank transfer", reference: "ACH-88213", amount: 1500, status: "settled" },
  { id: "pay-2", date: "2025-03-02", method: "Card ending 4242", reference: "CH-19044", amount: 500, status: "settled" },
  { id: "pay-3", date: "2025-03-10", method: "Cheque", reference: "CHQ-2210", amount: 500, status: "pending" },
];

const statusLabel: Record<Payment["status"], string> = {
  settled: "Settled",
  pending: "Pending",
  failed: "Failed",
};

const statusTone: Record<Payment["status"], "positive" | "warning" | "negative"> = {
  settled: "positive",
  pending: "warning",
  failed: "negative",
};

const lineItemColumns: Column<LineItem>[] = [
  { key: "description", header: "Description" },
  { key: "qty", header: "Qty", align: "right", numeric: true },
  { key: "unitPrice", header: "Unit price", align: "right", numeric: true, render: (row) => money(row.unitPrice) },
  { key: "amount", header: "Amount", align: "right", numeric: true, render: (row) => money(row.amount) },
];

const paymentColumns: Column<Payment>[] = [
  { key: "date", header: "Date", render: (row) => <span className="font-mono">{row.date}</span> },
  { key: "method", header: "Method" },
  { key: "reference", header: "Reference", render: (row) => <span className="font-mono">{row.reference}</span> },
  { key: "amount", header: "Amount", align: "right", numeric: true, render: (row) => money(row.amount) },
  {
    key: "status",
    header: "Status",
    render: (row) => <Badge tone={statusTone[row.status]}>{statusLabel[row.status]}</Badge>,
  },
];

export default function InvoiceDetail() {
  return (
    <div className="flex min-h-screen bg-paper">
      <SideNav
        product="Almanac"
        items={[
          { label: "Overview", href: "#" },
          { label: "Invoices", href: "#", active: true, count: 12 },
          { label: "Customers", href: "#", count: 48 },
          { label: "Projects", href: "#" },
          { label: "Settings", href: "#" },
        ]}
      />
      <main className="flex-1 px-6 py-12 md:px-16">
        <PageHeader
          eyebrow="Invoices"
          title="INV-2041"
          description="Issued February 12, 2025 to Northwind Mercantile. Payment terms Net 30."
          actions={
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Send reminder</Button>
              <Button variant="secondary">Download PDF</Button>
              <Button variant="danger">Void invoice</Button>
            </div>
          }
        />

        <div className="mb-8 flex flex-wrap items-center gap-3">
          <Badge tone="warning">Partially paid</Badge>
          <span className="font-mono text-xs text-ink-3">Due 2025-03-14 · 12 days overdue</span>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Total" value={money(total)} />
          <StatTile label="Paid" value={money(paid)} caption="2 settled payments" />
          <StatTile label="Balance due" value={money(balance)} />
          <StatTile label="Due date" value="Mar 14, 2025" caption="Net 30" />
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2">
          <Card title="Bill to">
            <div className="flex flex-col gap-1">
              <p className="font-body text-base font-medium text-ink">Northwind Mercantile</p>
              <p className="font-body text-sm text-ink-2">Attn: Accounts payable</p>
              <p className="font-body text-sm text-ink-2">418 Harbor Street</p>
              <p className="font-body text-sm text-ink-2">Portland, OR 97209</p>
              <p className="font-body text-sm text-ink-2">ap@northwind.example</p>
            </div>
          </Card>
          <Card title="Bill from">
            <div className="flex flex-col gap-1">
              <p className="font-body text-base font-medium text-ink">Almanac Press Ltd.</p>
              <p className="font-body text-sm text-ink-2">14 Ledger Lane</p>
              <p className="font-body text-sm text-ink-2">Portland, OR 97205</p>
              <p className="font-body text-sm text-ink-2">billing@almanac.example</p>
              <p className="mt-2 font-mono text-xs text-ink-3">Tax ID 88-1234567</p>
            </div>
          </Card>
        </div>

        <Card title="Line items" className="mt-16">
          <DataTable columns={lineItemColumns} rows={lineItems} />
          <div className="mt-4 flex flex-col gap-2 md:ml-auto md:w-64">
            <div className="flex justify-between font-mono text-sm text-ink-2">
              <span>Subtotal</span>
              <span>{money(subtotal)}</span>
            </div>
            <div className="flex justify-between font-mono text-sm text-ink-2">
              <span>Tax (8%)</span>
              <span>{money(tax)}</span>
            </div>
            <div className="flex justify-between border-t border-ink pt-2 font-mono text-base font-medium text-ink">
              <span>Total</span>
              <span>{money(total)}</span>
            </div>
          </div>
        </Card>

        <Card title="Payment history" className="mt-16">
          <DataTable columns={paymentColumns} rows={payments} />
        </Card>
      </main>
    </div>
  );
}
