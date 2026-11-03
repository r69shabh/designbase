import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { DataTable, type Column } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";

type SampleCustomer = {
  id: string;
  name: string;
  contact: string;
  email: string;
  status: "Active" | "Awaiting payment" | "Draft";
  balance: number;
};

const sampleCustomers: SampleCustomer[] = [
  {
    id: "cus_01",
    name: "Northwind Trading Co.",
    contact: "Priya Raman",
    email: "accounts@northwindtrading.com",
    status: "Active",
    balance: 4820,
  },
  {
    id: "cus_02",
    name: "Harbour & Vine",
    contact: "Daniel Okafor",
    email: "daniel@harbourandvine.co",
    status: "Active",
    balance: 1260,
  },
  {
    id: "cus_03",
    name: "Meridian Studio",
    contact: "Elena Fischer",
    email: "elena@meridianstudio.de",
    status: "Awaiting payment",
    balance: 940,
  },
  {
    id: "cus_04",
    name: "Foxglove Bakery",
    contact: "Sam Whitfield",
    email: "sam@foxglovebakery.com",
    status: "Draft",
    balance: 0,
  },
];

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const statusTone: Record<SampleCustomer["status"], "positive" | "warning" | "neutral"> = {
  Active: "positive",
  "Awaiting payment": "warning",
  Draft: "neutral",
};

const columns: Column<SampleCustomer>[] = [
  { key: "name", header: "Customer" },
  { key: "contact", header: "Contact" },
  { key: "email", header: "Email" },
  {
    key: "status",
    header: "Status",
    render: (row) => <Badge tone={statusTone[row.status]}>{row.status}</Badge>,
  },
  {
    key: "balance",
    header: "Balance",
    align: "right",
    numeric: true,
    render: (row) => currency.format(row.balance),
  },
];

const steps = [
  {
    title: "Add a customer",
    body: "Record a name, an email address and a phone number. You can fill in the rest later.",
  },
  {
    title: "Keep a note",
    body: "Attach notes to the record so anyone on the team knows the history of the account.",
  },
  {
    title: "Bill them",
    body: "Raise an invoice against the customer and watch the balance update on this list.",
  },
];

export default function CustomersPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <PageHeader
        eyebrow="Directory"
        title="Customers"
        description="One record for everyone you work with, holding contact details, notes and billing history together."
        actions={<Button variant="primary">Add customer</Button>}
      />

      <div className="flex flex-col gap-12">
        <EmptyState
          title="No customers yet"
          body="Customers you add will appear here as a list, with their contact details, notes and outstanding balance in one place."
          action={<Button variant="secondary">Import from CSV</Button>}
        />

        <section aria-labelledby="preview-heading" className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 id="preview-heading" className="font-display text-xl font-medium text-ink">
              What a customer record holds
            </h2>
            <p className="font-body text-sm text-ink-2">
              An example of the list you will build. These records are examples only and nothing has been saved yet.
            </p>
          </div>

          <DataTable columns={columns} rows={sampleCustomers} />
        </section>

        <section aria-labelledby="steps-heading" className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 id="steps-heading" className="font-display text-xl font-medium text-ink">
              Three steps to get going
            </h2>
            <p className="font-body text-sm text-ink-2">
              A short path from an empty list to your first invoice.
            </p>
          </div>

          <ol className="flex flex-col gap-4">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="flex gap-4 border-b border-line pb-4 last:border-b-0 last:pb-0"
              >
                <span className="font-mono text-sm tabular-nums text-ink-3">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="flex flex-col gap-1">
                  <h3 className="font-body text-base font-medium text-ink">{step.title}</h3>
                  <p className="font-body text-sm text-ink-2">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}
