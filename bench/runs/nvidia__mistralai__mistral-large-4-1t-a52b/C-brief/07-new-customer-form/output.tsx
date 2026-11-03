import { useState } from "react";
import type { FormEvent } from "react";

import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Field } from "@/components/Field";
import { Button } from "@/components/Button";

type FieldKey = "companyName" | "contactName" | "email" | "billingAddress";
type Errors = Partial<Record<FieldKey, string>>;

export default function NewCustomerPage() {
  const [errors, setErrors] = useState<Errors>({});
  const [notice, setNotice] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const next: Errors = {};
    if (!String(data.get("companyName") ?? "").trim()) {
      next.companyName = "Enter a company name.";
    }
    if (!String(data.get("contactName") ?? "").trim()) {
      next.contactName = "Enter a contact name.";
    }
    const email = String(data.get("email") ?? "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = "Enter a valid email address.";
    }
    if (!String(data.get("billingAddress") ?? "").trim()) {
      next.billingAddress = "Enter a billing address.";
    }
    setErrors(next);

    if (Object.keys(next).length > 0) {
      setNotice(null);
      return;
    }

    const intent = String(data.get("intent") ?? "save");
    setNotice(
      intent === "save-another"
        ? "Customer saved. The form is cleared for the next entry."
        : "Customer saved."
    );
    if (intent === "save-another") {
      form.querySelectorAll("input").forEach((input) => {
        input.value = "";
      });
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <PageHeader
        eyebrow="Customers"
        title="Add a new customer"
        description="Capture the company, its primary contact and billing details. The customer becomes available for invoicing once saved."
        actions={
          <Button variant="primary" type="submit" form="new-customer-form" name="intent" value="save">
            Save customer
          </Button>
        }
      />

      <form id="new-customer-form" noValidate onSubmit={handleSubmit} className="flex flex-col gap-8">
        {notice && (
          <p role="status" className="font-body text-sm text-moss">
            {notice}
          </p>
        )}

        <Card title="Company">
          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Company name"
              name="companyName"
              defaultValue="Alder & Finch Trading Co."
              autoComplete="organization"
              required
              error={errors.companyName}
              className="md:col-span-2"
            />
            <Field
              label="Tax ID"
              name="taxId"
              defaultValue="91-2047735"
              hint="US EIN, VAT number or local tax identifier."
              autoComplete="off"
            />
            <Field
              label="Default payment terms"
              name="paymentTerms"
              defaultValue="Net 30"
              list="payment-terms"
              hint="Applied to every new invoice for this customer."
            />
          </div>
          <datalist id="payment-terms">
            <option value="Due on receipt" />
            <option value="Net 15" />
            <option value="Net 30" />
            <option value="Net 60" />
          </datalist>
        </Card>

        <Card title="Contact">
          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Contact name"
              name="contactName"
              defaultValue="Mara Ellison"
              autoComplete="name"
              required
              error={errors.contactName}
            />
            <Field
              label="Email"
              name="email"
              type="email"
              defaultValue="mara.ellison@alderfinch.com"
              autoComplete="email"
              required
              error={errors.email}
            />
            <Field
              label="Phone"
              name="phone"
              type="tel"
              defaultValue="+1 (503) 555-0117"
              autoComplete="tel"
              hint="Include the country code for international numbers."
              className="md:col-span-2"
            />
          </div>
        </Card>

        <Card title="Billing">
          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Billing address"
              name="billingAddress"
              defaultValue="48 Merchant Row, Suite 12, Portland, OR 97205, United States"
              autoComplete="street-address"
              hint="Street, city, postal code and country."
              required
              error={errors.billingAddress}
              className="md:col-span-2"
            />
          </div>
          <footer className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" type="button">
              Cancel
            </Button>
            <Button variant="secondary" type="submit" name="intent" value="save-another">
              Save and add another
            </Button>
          </footer>
        </Card>
      </form>
    </main>
  );
}
