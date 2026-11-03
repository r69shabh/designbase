import { SideNav } from "@/components/SideNav";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/Button";

const navItems = [
  { label: "Overview", href: "/overview" },
  { label: "Customers", href: "/customers", active: true, count: 0 },
  { label: "Invoices", href: "/invoices", count: 0 },
  { label: "Payments", href: "/payments", count: 0 },
  { label: "Settings", href: "/settings" },
];

export default function CustomersPage() {
  return (
    <div className="flex min-h-screen bg-paper">
      <SideNav product="Almanac" items={navItems} />
      <main className="flex-1 px-6 py-12 md:px-16">
        <PageHeader
          eyebrow="Sales"
          title="Customers"
          description="Everyone you do business with, in one place. Add your first customer to start sending invoices and tracking payments."
          actions={<Button variant="secondary">Import customers</Button>}
        />
        <EmptyState
          title="No customers yet"
          body="This account is brand new, so there is nothing here yet. Add your first customer to start sending invoices and getting paid."
          action={<Button variant="primary">Add your first customer</Button>}
        />
      </main>
    </div>
  );
}
