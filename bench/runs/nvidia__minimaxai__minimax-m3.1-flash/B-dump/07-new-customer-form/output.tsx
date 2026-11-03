import { useId, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Field } from "@/components/Field";
import { PageHeader } from "@/components/PageHeader";

type CustomerForm = {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  taxId: string;
  paymentTerms: string;
};

const initialValues: CustomerForm = {
  companyName: "Northwind Paper Co.",
  contactName: "Elena Márquez",
  email: "elena.marquez@northwindpaper.com",
  phone: "+1 (503) 555-0142",
  addressLine1: "1420 SE Water Avenue",
  addressLine2: "Suite 210",
  city: "Portland",
  region: "OR",
  postalCode: "97214",
  country: "United States",
  taxId: "US-94-3827104",
  paymentTerms: "net-30",
};

const paymentTermOptions = [
  { value: "due-on-receipt", label: "Due on receipt" },
  { value: "net-15", label: "Net 15" },
  { value: "net-30", label: "Net 30" },
  { value: "net-45", label: "Net 45" },
  { value: "net-60", label: "Net 60" },
];

export default function AddCustomerForm() {
  const [values, setValues] = useState<CustomerForm>(initialValues);
  const [saved, setSaved] = useState(false);
  const termsId = useId();

  const handleChange =
    (key: keyof CustomerForm) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setValues((current) => ({ ...current, [key]: event.target.value }));
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
        title="Add customer"
        description="Record a new billing account. The contact receives invoices and statements at the email address below."
      />

      <Card title="Customer details">
        <form onSubmit={handleSubmit} className="flex flex-col gap-12">
          <section className="flex flex-col gap-6">
            <h3 className="font-display text-lg font-medium text-ink">Company</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <Field
                label="Company name"
                value={values.companyName}
                onChange={handleChange("companyName")}
                placeholder="Northwind Paper Co."
                required
              />
              <Field
                label="Contact name"
                value={values.contactName}
                onChange={handleChange("contactName")}
                placeholder="Elena Márquez"
                required
              />
              <Field
                label="Email"
                type="email"
                value={values.email}
                onChange={handleChange("email")}
                placeholder="name@company.com"
                required
              />
              <Field
                label="Phone"
                type="tel"
                value={values.phone}
                onChange={handleChange("phone")}
                placeholder="+1 (503) 555-0142"
                hint="Used for billing questions only."
              />
            </div>
          </section>

          <section className="flex flex-col gap-6">
            <h3 className="font-display text-lg font-medium text-ink">Billing address</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <Field
                label="Address line 1"
                className="md:col-span-2"
                value={values.addressLine1}
                onChange={handleChange("addressLine1")}
                placeholder="1420 SE Water Avenue"
                required
              />
              <Field
                label="Address line 2"
                className="md:col-span-2"
                value={values.addressLine2}
                onChange={handleChange("addressLine2")}
                placeholder="Suite 210"
              />
              <Field
                label="City"
                value={values.city}
                onChange={handleChange("city")}
                placeholder="Portland"
                required
              />
              <Field
                label="State or region"
                value={values.region}
                onChange={handleChange("region")}
                placeholder="OR"
              />
              <Field
                label="Postal code"
                value={values.postalCode}
                onChange={handleChange("postalCode")}
                placeholder="97214"
                required
              />
              <Field
                label="Country"
                value={values.country}
                onChange={handleChange("country")}
                placeholder="United States"
                required
              />
            </div>
          </section>

          <section className="flex flex-col gap-6">
            <h3 className="font-display text-lg font-medium text-ink">Tax and payment</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <Field
                label="Tax ID"
                value={values.taxId}
                onChange={handleChange("taxId")}
                placeholder="US-94-3827104"
                hint="Printed on every invoice."
              />
              <div className="flex flex-col gap-2">
                <label htmlFor={termsId} className="font-body text-sm font-medium text-ink">
                  Default payment terms
                </label>
                <select
                  id={termsId}
                  value={values.paymentTerms}
                  onChange={handleChange("paymentTerms")}
                  className="h-12 rounded-md border border-line bg-paper px-3 font-body text-base text-ink focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-accent"
                >
                  {paymentTermOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="font-body text-sm text-ink-3">
                  Applied to invoices unless a specific order says otherwise.
                </p>
              </div>
            </div>
          </section>

          <footer className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => setValues(initialValues)}>
              Reset form
            </Button>
            <Button type="submit" variant="primary">
              Save customer
            </Button>
          </footer>

          <p aria-live="polite" className="font-body text-sm text-ink-3">
            {saved
              ? `${values.companyName} was added to your customer list.`
              : "All fields marked as required must be completed."}
          </p>
        </form>
      </Card>
    </main>
  );
}
