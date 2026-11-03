import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { SideNav } from "@/components/SideNav";

const navItems = [
  { label: "Overview", href: "/" },
  { label: "Customers", href: "/customers", active: true, count: 0 },
  { label: "Invoices", href: "/invoices", count: 0 },
  { label: "Payments", href: "/payments", count: 0 },
  { label: "Reports", href: "/reports" },
  { label: "Settings", href: "/settings" },
];

const steps = [
  {
    n: "01",
    title: "Add a customer",
    body: "Name, email and billing address. It takes under a minute.",
  },
  {
    n: "02",
    title: "Send an invoice",
    body: "Choose the customer, add line items and set a due date.",
  },
  {
    n: "03",
    title: "Record a payment",
    body: "Mark invoices as paid and watch open balances settle.",
  },
];

export default function CustomersPage() {
  return (
    <div className="flex min-h-screen bg-paper font-body text-ink">
      <SideNav product="Almanac" items={navItems} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 md:px-12">
        <PageHeader
          eyebrow="Sales"
          title="Customers"
          description="Everyone you bill, kept in one ledger. Add your first customer to start sending invoices and recording payments."
          actions={<Button variant="primary">Add customer</Button>}
        />
        <div className="flex flex-col gap-8">
          <EmptyState
            title="No customers yet"
            body="Your ledger is empty. Add your first customer and they will appear here with their invoices, payments and open balance."
            action={<Button variant="secondary">Add your first customer</Button>}
          />
          <Card title="Getting started">
            <ol className="flex flex-col gap-6">
              {steps.map((step) => (
                <li key={step.n} className="flex items-start gap-4">
                  <span className="font-mono text-xs text-ink-3">{step.n}</span>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-ink">{step.title}</p>
                    <p className="text-sm text-ink-2">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </main>
    </div>
  );
}
