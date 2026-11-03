import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { StatTile } from "@/components/StatTile";

type LineItem = {
  description: string;
  qty: string;
  unitPrice: string;
  amount: string;
};

type Payment = {
  date: string;
  method: string;
  reference: string;
  amount: string;
  status: string;
};

const lineItems: LineItem[] = [
  { description: "Brand identity design sprint", qty: "1", unitPrice: "$2,400.00", amount: "$2,400.00" },
  { description: "Editorial layout, 48 pages", qty: "1", unitPrice: "$1,600.00", amount: "$1,600.00" },
  { description: "Print production", qty: "500", unitPrice: "$1.20", amount: "$600.00" },
  { description: "Shipping and handling", qty: "1", unitPrice: "$220.00", amount: "$220.00" },
];

const payments: Payment[] = [
  { date: "Feb 28, 2025", method: "Bank transfer", reference: "TRX-88412", amount: "$1,200.00", status: "Paid" },
  { date: "Mar 18, 2025", method: "Card", reference: "CHG-20971", amount: "$0.00", status: "Failed" },
];

export default function InvoiceDetailPage() {
  return (
    <main className="bg-paper px-6 py-12 md:px-16">
      <PageHeader
        eyebrow="Invoices"
        title="INV-2041"
        description="Issued Feb 14, 2025 to Meridian Coffee Roasters. Due Mar 16, 2025 under net 30 terms."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="negative">Overdue</Badge>
            <Button variant="secondary">Download PDF</Button>
            <Button variant="danger">Void invoice</Button>
            <Button variant="primary">Send reminder</Button>
          </div>
        }
      />

      <div className="mb-6 flex flex-col gap-6 md:flex-row md:gap-8">
        <StatTile label="Total" value="$5,205.60" caption="Subtotal $4,820.00 plus 8% tax" />
        <StatTile label="Paid" value="$1,200.00" caption="One successful payment" />
        <StatTile label="Balance due" value="$4,005.60" caption="12 days past due" />
      </div>

      <div className="mb-6 grid gap-6 md:grid-cols-3">
        <Card title="Bill to">
          <div className="flex flex-col gap-1 font-body text-sm">
            <span className="font-medium text-ink">Meridian Coffee Roasters</span>
            <span className="text-ink-2">88 Alder Street, Suite 4</span>
            <span className="text-ink-2">Seattle, WA 98101</span>
            <span className="text-ink-3">accounts@meridiancoffee.com</span>
          </div>
        </Card>

        <Card title="Bill from">
          <div className="flex flex-col gap-1 font-body text-sm">
            <span className="font-medium text-ink">Harbor &amp; Pine Studio</span>
            <span className="text-ink-2">418 Wharf Lane</span>
            <span className="text-ink-2">Portland, OR 97209</span>
            <span className="text-ink-3">billing@harborpine.co</span>
          </div>
        </Card>

        <Card title="Details">
          <dl className="flex flex-col gap-2 font-body text-sm">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-ink-3">Status</dt>
              <dd>
                <Badge tone="negative">Overdue</Badge>
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-ink-3">Issued</dt>
              <dd className="font-mono text-ink">Feb 14, 2025</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-ink-3">Due</dt>
              <dd className="font-mono text-ink">Mar 16, 2025</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-ink-3">Terms</dt>
              <dd className="font-mono text-ink">Net 30</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-ink-3">PO number</dt>
              <dd className="font-mono text-ink">PO-7781</dd>
            </div>
          </dl>
        </Card>
      </div>

      <Card title="Line items" className="mb-6">
        <DataTable
          columns={[
            { key: "description", header: "Description" },
            { key: "qty", header: "Qty", numeric: true },
            { key: "unitPrice", header: "Unit price", numeric: true },
            { key: "amount", header: "Amount", numeric: true },
          ]}
          rows={lineItems}
        />
        <div className="mt-6 flex justify-end border-t border-line pt-4">
          <dl className="flex w-full max-w-xs flex-col gap-2 font-body text-sm">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-ink-2">Subtotal</dt>
              <dd className="font-mono text-ink">$4,820.00</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-ink-2">Tax (8%)</dt>
              <dd className="font-mono text-ink">$385.60</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-t border-line pt-2">
              <dt className="font-medium text-ink">Total</dt>
              <dd className="font-mono font-medium text-ink">$5,205.60</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-ink-2">Paid</dt>
              <dd className="font-mono text-moss">-$1,200.00</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-t border-line pt-2">
              <dt className="font-medium text-ink">Balance due</dt>
              <dd className="font-mono font-medium text-ink">$4,005.60</dd>
            </div>
          </dl>
        </div>
        <p className="mt-4 font-body text-xs text-ink-3">
          Please reference INV-2041 on all payments.
        </p>
      </Card>

      <Card title="Payment history">
        <DataTable
          columns={[
            { key: "date", header: "Date" },
            { key: "method", header: "Method" },
            { key: "reference", header: "Reference" },
            { key: "amount", header: "Amount", numeric: true },
            {
              key: "status",
              header: "Status",
              render: (row: Payment) => (
                <Badge tone={row.status === "Paid" ? "positive" : "negative"}>{row.status}</Badge>
              ),
            },
          ]}
          rows={payments}
        />
      </Card>
    </main>
  );
}
