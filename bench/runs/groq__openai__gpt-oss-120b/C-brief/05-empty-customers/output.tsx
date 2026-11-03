import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/Button";

export default function CustomersPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <PageHeader
        title="Customers"
        description="Manage the companies you work with. Add a customer to start tracking orders and invoices."
      />
      <div className="mt-12 flex flex-col items-center">
        <EmptyState
          title="No customers yet"
          body="Add a customer to start tracking orders and invoices."
          action={<Button variant="primary">Add first customer</Button>}
        />
      </div>
    </main>
  );
}
