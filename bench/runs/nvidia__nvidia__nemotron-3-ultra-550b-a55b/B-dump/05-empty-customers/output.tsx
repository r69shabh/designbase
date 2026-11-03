import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";

export default function CustomersPage() {
  return (
    <main className="px-6 py-12 md:px-16">
      <PageHeader
        title="Customers"
        description="Add your first customer to start tracking relationships and activity."
        actions={<Button variant="primary">Add customer</Button>}
      />

      <div className="mb-6 flex gap-3">
        <Field
          label="Search"
          placeholder="Name, email, company…"
          className="max-w-xs"
        />
      </div>

      <EmptyState
        title="No customers yet"
        body="When you add customers they'll appear here with their contact details, status, and recent activity."
        action={<Button variant="primary">Add your first customer</Button>}
      />
    </main>
  );
}
