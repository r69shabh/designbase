import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/Button";

export default function CustomersPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <PageHeader
        title="Customers"
        description="Add your first customer to start tracking relationships, orders, and history."
        actions={
          <Button variant="primary" size="md">
            Add customer
          </Button>
        }
      />

      <EmptyState
        title="No customers yet"
        body="When you add customers they'll appear here with their contact details, order history, and any notes you've saved."
        action={
          <Button variant="primary" size="md">
            Add your first customer
          </Button>
        }
      />
    </main>
  );
}
