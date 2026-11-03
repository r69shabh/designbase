import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Field } from "@/components/Field";
import { Button } from "@/components/Button";

export default function NewCustomerForm() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 md:px-16">
      <PageHeader
        title="New customer"
        description="Add a new customer to your directory. Required fields are marked."
      />

      <div className="flex flex-col gap-8">
        <Card title="Basic information">
          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Company name"
              placeholder="Acme Corporation"
              defaultValue="Acme Corporation"
              required
            />
            <Field
              label="Contact name"
              placeholder="Jane Doe"
              defaultValue="Jane Doe"
              required
            />
            <Field
              label="Email"
              type="email"
              placeholder="jane.doe@acme.com"
              defaultValue="jane.doe@acme.com"
              required
            />
            <Field
              label="Phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              defaultValue="+1 (555) 123-4567"
            />
          </div>
          <footer className="mt-6 flex justify-end gap-3">
            <Button variant="ghost">Cancel</Button>
            <Button variant="primary">Save customer</Button>
          </footer>
        </Card>

        <Card title="Billing address">
          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Street address"
              placeholder="123 Main Street"
              defaultValue="123 Main Street"
              required
            />
            <Field
              label="Address line 2"
              placeholder="Suite 400"
              defaultValue="Suite 400"
            />
            <Field
              label="City"
              placeholder="San Francisco"
              defaultValue="San Francisco"
              required
            />
            <Field
              label="State / Province"
              placeholder="CA"
              defaultValue="CA"
              required
            />
            <Field
              label="Postal code"
              placeholder="94105"
              defaultValue="94105"
              required
            />
            <Field
              label="Country"
              placeholder="United States"
              defaultValue="United States"
              required
            />
          </div>
        </Card>

        <Card title="Tax & payment">
          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Tax ID"
              placeholder="US123456789"
              defaultValue="US123456789"
            />
            <Field
              label="Default payment terms"
              placeholder="Net 30"
              defaultValue="Net 30"
              required
            />
          </div>
        </Card>
      </div>
    </main>
  );
}
