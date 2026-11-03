import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Field } from "@/components/Field";
import { PageHeader } from "@/components/PageHeader";

export default function NewCustomerPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <PageHeader
        eyebrow="Customers"
        title="Add a new customer"
        description="Record the company, primary contact and billing details. The default payment terms apply to every invoice issued to this customer."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" type="button">Cancel</Button>
            <Button variant="primary" type="submit">Save customer</Button>
          </div>
        }
      />
      <form className="flex flex-col gap-8">
        <Card title="Company">
          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Company name"
              name="company_name"
              defaultValue="Meridian & Hale Trading Co."
              autoComplete="organization"
              required
            />
            <Field
              label="Tax ID"
              name="tax_id"
              defaultValue="91-7742036"
              hint="US EIN in XX-XXXXXXX format"
              required
            />
          </div>
        </Card>

        <Card title="Contact">
          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Contact name"
              name="contact_name"
              defaultValue="Elena Vasquez"
              autoComplete="name"
              required
            />
            <Field
              label="Email"
              name="email"
              type="email"
              defaultValue="elena.vasquez@meridianhale.com"
              autoComplete="email"
              required
            />
            <Field
              label="Phone"
              name="phone"
              type="tel"
              defaultValue="+1 (415) 555-0132"
              autoComplete="tel"
              hint="Include the country code for international numbers"
            />
          </div>
        </Card>

        <Card title="Billing">
          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Billing address"
              name="billing_address"
              defaultValue="428 Harbor Lane, Suite 12, Portland, OR 97209"
              autoComplete="street-address"
              className="md:col-span-2"
              required
            />
            <Field
              label="Default payment terms"
              name="payment_terms"
              defaultValue="Net 30"
              hint="Applied to new invoices: Net 15, Net 30 or due on receipt"
              required
            />
          </div>
        </Card>
      </form>
    </main>
  );
}
