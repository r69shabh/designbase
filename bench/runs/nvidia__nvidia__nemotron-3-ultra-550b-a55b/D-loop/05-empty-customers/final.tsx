import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/Button";

export default function CustomersPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <PageHeader
        eyebrow="Customers"
        title="Customers"
        description="Your customer list will appear here once you add your first customer."
        actions={
          <Button variant="primary" size="md">
            Add customer
          </Button>
        }
      />

      <EmptyState
        title="No customers yet"
        body="When you add customers they'll show up in a table here with their name, email, and status."
        action={
          <Button variant="primary" size="md">
            Add customer
          </Button>
        }
      />
    </main>
  );
}
