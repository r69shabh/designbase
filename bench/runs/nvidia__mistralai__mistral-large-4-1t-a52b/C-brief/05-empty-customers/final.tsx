import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";

const firstSteps = [
  {
    n: "01",
    title: "Add a customer",
    body: "Record a name, email and billing address so you can reach them later.",
  },
  {
    n: "02",
    title: "Send an invoice",
    body: "Create your first invoice from their profile and send it by email.",
  },
  {
    n: "03",
    title: "Record a payment",
    body: "Mark invoices as paid as money arrives, and keep the ledger balanced.",
  },
];

export default function CustomersPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <PageHeader
        eyebrow="Sales"
        title="Customers"
        description="Everyone you do business with, kept in one ledger. Add a customer to start sending invoices and tracking payments."
        actions={<Button variant="primary">Add customer</Button>}
      />

      <div className="flex flex-col gap-8">
        <EmptyState
          title="No customers yet"
          body="When you add a customer, their details, invoices and notes will appear here."
          action={<Button variant="secondary">Add your first customer</Button>}
        />

        <Card title="First steps">
          <ol className="flex flex-col gap-6">
            {firstSteps.map((step) => (
              <li key={step.n} className="flex gap-4">
                <span className="font-mono text-sm text-ink-3">{step.n}</span>
                <div className="flex flex-col gap-1">
                  <span className="font-body text-sm font-medium text-ink">{step.title}</span>
                  <p className="font-body text-sm text-ink-2">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </main>
  );
}
