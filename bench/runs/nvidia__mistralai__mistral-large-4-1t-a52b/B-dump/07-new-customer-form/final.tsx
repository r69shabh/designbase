import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Field } from "@/components/Field";
import { PageHeader } from "@/components/PageHeader";

interface CustomerForm {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  billingAddress: string;
  taxId: string;
  paymentTerms: string;
}

const initialCustomer: CustomerForm = {
  companyName: "Meridian Roasting Co.",
  contactName: "June Okafor",
  email: "june@meridianroasting.com",
  phone: "+1 (503) 555-0184",
  billingAddress: "482 Maple Ave, Suite 12, Portland, OR 97205",
  taxId: "91-2274830",
  paymentTerms: "Net 30",
};

export default function NewCustomerPage() {
  const [form, setForm] = useState<CustomerForm>(initialCustomer);

  const update =
    (key: keyof CustomerForm) =>
    (e: ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <PageHeader
        eyebrow="Customers"
        title="New customer"
        description="Add a company to the ledger. Billing and payment details carry over to every invoice."
      />

      <form className="flex flex-col gap-8" onSubmit={onSubmit}>
        <Card title="Company">
          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Company name"
              value={form.companyName}
              onChange={update("companyName")}
              required
              className="md:col-span-2"
            />
            <Field
              label="Tax ID"
              value={form.taxId}
              onChange={update("taxId")}
              hint="Shown on VAT and GST invoices."
              placeholder="91-0000000"
            />
          </div>
        </Card>

        <Card title="Contact">
          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Contact name"
              value={form.contactName}
              onChange={update("contactName")}
              required
            />
            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={update("email")}
              required
            />
            <Field
              label="Phone"
              type="tel"
              value={form.phone}
              onChange={update("phone")}
              hint="Include the country code."
            />
          </div>
        </Card>

        <Card title="Billing">
          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Billing address"
              value={form.billingAddress}
              onChange={update("billingAddress")}
              required
              className="md:col-span-2"
            />
            <Field
              label="Default payment terms"
              value={form.paymentTerms}
              onChange={update("paymentTerms")}
              hint="Net 15, Net 30 or Net 60."
            />
          </div>
          <footer className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save customer
            </Button>
          </footer>
        </Card>
      </form>
    </main>
  );
}
