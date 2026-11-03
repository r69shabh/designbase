import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { SideNav } from "@/components/SideNav";

const navigation = [
  { label: "Overview", href: "#overview" },
  { label: "Customers", href: "#customers", active: true },
  { label: "Invoices", href: "#invoices" },
  { label: "Payments", href: "#payments" },
  { label: "Settings", href: "#settings" },
];

const firstSteps = [
  {
    number: "01",
    title: "Add a customer",
    body: "Record a name, email and billing address. You can amend these details at any time.",
  },
  {
    number: "02",
    title: "Send an invoice",
    body: "Pick a customer, add line items, then send the invoice by email or as a PDF.",
  },
  {
    number: "03",
    title: "Track what is owed",
    body: "Payments update the customer balance automatically, so you always know who to chase.",
  },
];

export default function CustomersPage() {
  return (
    <div className="flex min-h-screen flex-col bg-paper font-body text-ink md:flex-row">
      <SideNav product="Ledger" items={navigation} />

      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        <PageHeader
          eyebrow="Workspace"
          title="Customers"
          description="Everyone you invoice, kept in one ledger. Add your first customer to begin."
          actions={<Button variant="primary">Add customer</Button>}
        />

        <EmptyState
          title="No customers yet"
          body="Customers you add will appear here with their contact details, invoice history and outstanding balance."
          action={<Button variant="secondary">Add your first customer</Button>}
        />

        <section className="mt-12">
          <h2 className="font-display text-lg font-medium text-ink">How it works</h2>
          <p className="mt-2 max-w-prose font-body text-sm text-ink-2">
            Three steps from an empty ledger to a sent invoice.
          </p>
          <ol className="mt-6 grid gap-6 sm:grid-cols-3">
            {firstSteps.map((step) => (
              <li key={step.number} className="border-t border-line pt-4">
                <span className="font-mono text-xs text-ink-3">{step.number}</span>
                <h3 className="mt-2 font-body text-base font-medium text-ink">
                  {step.title}
                </h3>
                <p className="mt-1 font-body text-sm text-ink-2">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-12 border-t border-line pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-prose font-body text-sm text-ink-2">
              Already keep a list of customers? Bring them across from a spreadsheet.
            </p>
            <Button variant="ghost" size="sm">
              Import from CSV
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
