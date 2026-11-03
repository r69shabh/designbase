import { useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Field } from "@/components/Field";
import { PageHeader } from "@/components/PageHeader";

type CustomerForm = {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  taxId: string;
  paymentTerms: string;
};

const initialCustomer: CustomerForm = {
  companyName: "Northwind Paper Co.",
  contactName: "Elena Marsh",
  email: "elena.marsh@northwindpaper.co",
  phone: "+1 (415) 555-0142",
  street: "1180 Bryant Street",
  city: "San Francisco",
  postalCode: "94103",
  country: "United States",
  taxId: "US-94-2837461",
  paymentTerms: "Net 30",
};

const paymentTermOptions = [
  "Due on receipt",
  "Net 15",
  "Net 30",
  "Net 45",
  "Net 60",
];

export default function NewCustomerForm() {
  const [customer, setCustomer] = useState<CustomerForm>(initialCustomer);
  const [saved, setSaved] = useState(false);

  const update =
    (key: keyof CustomerForm) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setCustomer((previous) => ({ ...previous, [key]: event.target.value }));
      setSaved(false);
    };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaved(true);
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <PageHeader
        eyebrow="Customers"
        title="Add a new customer"
        description="Record the company, billing address and payment terms you invoice on."
        actions={
          <div className="flex items-center gap-3">
            <Button variant="ghost" type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="new-customer-form">
              Save customer
            </Button>
          </div>
        }
      />

      {saved && (
        <p role="status" className="mt-4 font-body text-sm text-moss">
          {customer.companyName} was added to your customer list.
        </p>
      )}

      <form
        id="new-customer-form"
        onSubmit={handleSubmit}
        className="mt-8 flex flex-col gap-8"
      >
        <Card title="Company details">
          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Company name"
              name="companyName"
              autoComplete="organization"
              value={customer.companyName}
              onChange={update("companyName")}
              required
              className="md:col-span-2"
            />
            <Field
              label="Contact name"
              name="contactName"
              autoComplete="name"
              value={customer.contactName}
              onChange={update("contactName")}
              required
            />
            <Field
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              value={customer.email}
              onChange={update("email")}
              required
            />
            <Field
              label="Phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={customer.phone}
              onChange={update("phone")}
              hint="Used for invoice reminders."
            />
          </div>
        </Card>

        <Card title="Billing address">
          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Street address"
              name="street"
              autoComplete="street-address"
              value={customer.street}
              onChange={update("street")}
              required
              className="md:col-span-2"
            />
            <Field
              label="City"
              name="city"
              autoComplete="address-level2"
              value={customer.city}
              onChange={update("city")}
              required
            />
            <Field
              label="Postal code"
              name="postalCode"
              autoComplete="postal-code"
              value={customer.postalCode}
              onChange={update("postalCode")}
              required
            />
            <Field
              label="Country"
              name="country"
              autoComplete="country-name"
              value={customer.country}
              onChange={update("country")}
              required
              className="md:col-span-2"
            />
          </div>
        </Card>

        <Card title="Billing">
          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Tax ID"
              name="taxId"
              value={customer.taxId}
              onChange={update("taxId")}
              hint="Printed on invoices and credit notes."
            />
            <div className="flex flex-col gap-2">
              <label
                htmlFor="payment-terms"
                className="font-body text-sm font-medium text-ink"
              >
                Default payment terms
              </label>
              <select
                id="payment-terms"
                name="paymentTerms"
                value={customer.paymentTerms}
                onChange={update("paymentTerms")}
                aria-describedby="payment-terms-hint"
                className="h-12 rounded-md border border-line bg-paper px-3 font-body text-base text-ink focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-accent"
              >
                {paymentTermOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <p
                id="payment-terms-hint"
                className="font-body text-sm text-ink-3"
              >
                Applied to new invoices unless you override them.
              </p>
            </div>
          </div>
        </Card>
      </form>
    </main>
  );
}
