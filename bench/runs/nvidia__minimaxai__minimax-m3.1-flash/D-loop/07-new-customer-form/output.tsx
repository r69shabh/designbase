import { useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Field } from "@/components/Field";
import { PageHeader } from "@/components/PageHeader";

interface CustomerDetails {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postalCode: string;
  country: string;
  taxId: string;
  paymentTerms: string;
}

const initialDetails: CustomerDetails = {
  companyName: "Northwind Paper Co.",
  contactName: "Elena Whitfield",
  email: "elena.whitfield@northwindpaper.co.uk",
  phone: "+44 20 7946 0812",
  addressLine1: "18 Farringdon Lane",
  addressLine2: "Unit 4, Clerkenwell Works",
  city: "London",
  postalCode: "EC1R 3AU",
  country: "United Kingdom",
  taxId: "GB 421 8834 07",
  paymentTerms: "Net 30",
};

export default function NewCustomerForm() {
  const [details, setDetails] = useState<CustomerDetails>(initialDetails);
  const [saved, setSaved] = useState(false);

  const update =
    (field: keyof CustomerDetails) => (event: ChangeEvent<HTMLInputElement>) => {
      setDetails((current) => ({ ...current, [field]: event.target.value }));
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
        description="Record the company, billing address and default payment terms for a new customer account."
      />

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-8">
        <Card title="Company details">
          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Company name"
              required
              value={details.companyName}
              onChange={update("companyName")}
              placeholder="Northwind Paper Co."
              autoComplete="organization"
            />
            <Field
              label="Contact name"
              required
              value={details.contactName}
              onChange={update("contactName")}
              placeholder="Elena Whitfield"
              autoComplete="name"
            />
            <Field
              label="Email"
              type="email"
              required
              value={details.email}
              onChange={update("email")}
              placeholder="name@company.co.uk"
              autoComplete="email"
              hint="Invoices and statements are sent here."
            />
            <Field
              label="Phone"
              type="tel"
              value={details.phone}
              onChange={update("phone")}
              placeholder="+44 20 7946 0812"
              autoComplete="tel"
              hint="Include the country code."
            />
          </div>
        </Card>

        <Card title="Billing address">
          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Address line 1"
              className="md:col-span-2"
              required
              value={details.addressLine1}
              onChange={update("addressLine1")}
              placeholder="18 Farringdon Lane"
              autoComplete="address-line1"
            />
            <Field
              label="Address line 2"
              className="md:col-span-2"
              value={details.addressLine2}
              onChange={update("addressLine2")}
              placeholder="Unit 4, Clerkenwell Works"
              autoComplete="address-line2"
              hint="Optional."
            />
            <Field
              label="City"
              required
              value={details.city}
              onChange={update("city")}
              placeholder="London"
              autoComplete="address-level2"
            />
            <Field
              label="Postal code"
              required
              value={details.postalCode}
              onChange={update("postalCode")}
              placeholder="EC1R 3AU"
              autoComplete="postal-code"
            />
            <Field
              label="Country"
              required
              value={details.country}
              onChange={update("country")}
              placeholder="United Kingdom"
              autoComplete="country-name"
            />
          </div>
        </Card>

        <Card title="Billing details">
          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Tax ID"
              value={details.taxId}
              onChange={update("taxId")}
              placeholder="GB 421 8834 07"
              hint="VAT or tax registration number shown on invoices."
            />
            <Field
              label="Default payment terms"
              list="payment-terms"
              value={details.paymentTerms}
              onChange={update("paymentTerms")}
              placeholder="Net 30"
              hint="Applied to new invoices unless changed per invoice."
            />
          </div>

          <datalist id="payment-terms">
            <option value="Due on receipt" />
            <option value="Net 15" />
            <option value="Net 30" />
            <option value="Net 45" />
            <option value="Net 60" />
          </datalist>

          {saved && (
            <p role="status" className="mt-6 font-body text-sm text-moss">
              Customer record created for {details.companyName}.
            </p>
          )}

          <footer className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary">
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create customer
            </Button>
          </footer>
        </Card>
      </form>
    </main>
  );
}
