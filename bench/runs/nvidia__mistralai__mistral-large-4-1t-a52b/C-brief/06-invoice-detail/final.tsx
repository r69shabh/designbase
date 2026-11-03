import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { StatTile } from "@/components/StatTile";

interface LineItem {
  item: string;
  sku: string;
  qty: number;
  unitPrice: string;
  amount: string;
}

interface Payment {
  date: string;
  method: string;
  reference: string;
  amount: string;
  status: "Paid" | "Declined";
}

const lineItems: LineItem[] = [
  { item: "Desk lamp, walnut", sku: "NW-LMP-04", qty: 4, unitPrice: "$189.00", amount: "$756.00" },
  { item: "Task chair, ergonomic", sku: "NW-CHR-11", qty: 2, unitPrice: "$640.00", amount: "$1,280.00" },
  { item: "Cable management kit", sku: "NW-CBL-02", qty: 6, unitPrice: "$24.50", amount: "$147.00" },
  { item: "Assembly and delivery", sku: "NW-SVC-01", qty: 1, unitPrice: "$220.00", amount: "$220.00" },
];

const payments: Payment[] = [
  { date: "Mar 3, 2025", method: "Bank transfer", reference: "ACH-88213", amount: "$1,000.00", status: "Paid" },
  { date: "Feb 24, 2025", method: "Card", reference: "Visa ending 4242", amount: "$2,595.24", status: "Declined" },
];

export default function InvoiceDetailPage() {
  return (
    <main className="bg-paper px-6 py-12 font-body text-ink md:px-16">
      <PageHeader
        eyebrow="Invoices"
        title="INV-2025-0142"
        description="Issued Feb 10, 2025 to Meridian Studio under PO 7781. Payment was due Mar 12, 2025."
        actions={
          <>
            <Button variant="danger">Void invoice</Button>
            <Button variant="secondary">Download PDF</Button>
            <Button variant="primary">Send reminder</Button>
          </>
        }
      />

      <div className="mb-8 flex flex-wrap items-center gap-3">
        <Badge tone="negative">Overdue</Badge>
        <span className="font-mono text-sm text-ink-3">Due Mar 12, 2025 · 12 days overdue</span>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
        <StatTile label="Total" value="$2,595.24" caption="Issued Feb 10, 2025" />
        <StatTile label="Paid" value="$1,000.00" caption="One payment received" />
        <StatTile label="Balance due" value="$1,595.24" delta={{ value: "12 days overdue", direction: "down" }} />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card title="Bill to">
          <div className="space-y-1 text-sm">
            <p className="font-medium text-ink">Meridian Studio</p>
            <p className="text-ink-2">418 Alder Street</p>
            <p className="text-ink-2">Portland, OR 97204</p>
            <p className="text-ink-2">United States</p>
            <p className="pt-2 font-mono text-xs text-ink-3">billing@meridianstudio.com</p>
          </div>
        </Card>
        <Card title="Bill from">
          <div className="space-y-1 text-sm">
            <p className="font-medium text-ink">Northwind Supply Co.</p>
            <p className="text-ink-2">88 Foundry Lane, Suite 4</p>
            <p className="text-ink-2">Portland, OR 97209</p>
            <p className="pt-2 font-mono text-xs text-ink-3">accounts@northwindsupply.co</p>
            <p className="font-mono text-xs text-ink-3">(503) 555-0117 · Tax ID 91-2234567</p>
          </div>
        </Card>
      </div>

      <Card title="Line items" className="mb-8" action={<Badge tone="neutral">4 items</Badge>}>
        <DataTable
          columns={[
            { key: "item", header: "Item" },
            { key: "sku", header: "SKU" },
            { key: "qty", header: "Qty", numeric: true },
            { key: "unitPrice", header: "Unit price", numeric: true },
            { key: "amount", header: "Amount", numeric: true },
          ]}
          rows={lineItems}
        />
        <div className="mt-6 flex justify-end border-t border-line pt-4">
          <dl className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex items-baseline justify-between">
              <dt className="text-ink-2">Subtotal</dt>
              <dd className="font-mono text-ink">$2,403.00</dd>
            </div>
            <div className="flex items-baseline justify-between">
              <dt className="text-ink-2">Tax (8%)</dt>
              <dd className="font-mono text-ink">$192.24</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-line pt-2">
              <dt className="font-medium text-ink">Total</dt>
              <dd className="font-mono font-medium text-ink">$2,595.24</dd>
            </div>
          </dl>
        </div>
      </Card>

      <Card title="Payment history" action={<Badge tone="neutral">2 attempts</Badge>}>
        <DataTable
          columns={[
            { key: "date", header: "Date" },
            { key: "method", header: "Method" },
            { key: "reference", header: "Reference" },
            { key: "amount", header: "Amount", numeric: true },
            {
              key: "status",
              header: "Status",
              render: (payment) => (
                <Badge tone={payment.status === "Paid" ? "positive" : "negative"}>{payment.status}</Badge>
              ),
            },
          ]}
          rows={payments}
        />
        <p className="mt-4 text-sm text-ink-3">One reminder was sent on Mar 14, 2025. No reply yet.</p>
      </Card>
    </main>
  );
}
