import { useState } from "react";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";

export default function AddCustomerForm() {
  const [form, setForm] = useState({
    companyName: "Acme Corp",
    contactName: "Jane Doe",
    email: "jane.doe@acme.com",
    phone: "+1 555‑0123",
    billingAddress: "123 Main St, Springfield, IL 62704",
    taxId: "12‑3456789",
    paymentTerms: "Net 30",
  });

  const handleChange =
    (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm({ ...form, [field]: e.target.value });
    };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: submit form data
    console.log("Saving customer:", form);
  };

  const handleCancel = () => {
    // TODO: navigate away or reset
    console.log("Cancel");
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <PageHeader
        title="Add new customer"
        description="Enter the details for a new client. All fields are required unless noted."
      />
      <form onSubmit={handleSave}>
        <div className="flex flex-col gap-8">
          <Card title="Customer details">
            <div className="grid gap-6 md:grid-cols-2">
              <Field
                label="Company name"
                defaultValue={form.companyName}
                onChange={handleChange("companyName")}
                required
              />
              <Field
                label="Contact name"
                defaultValue={form.contactName}
                onChange={handleChange("contactName")}
                required
              />
              <Field
                label="Email"
                type="email"
                defaultValue={form.email}
                onChange={handleChange("email")}
                required
                hint="We'll use this address for invoices"
              />
              <Field
                label="Phone"
                type="tel"
                defaultValue={form.phone}
                onChange={handleChange("phone")}
                required
              />
              <Field
                label="Billing address"
                defaultValue={form.billingAddress}
                onChange={handleChange("billingAddress")}
                required
              />
              <Field
                label="Tax ID"
                defaultValue={form.taxId}
                onChange={handleChange("taxId")}
                hint="e.g., EIN or VAT number"
              />
              <Field
                label="Default payment terms"
                defaultValue={form.paymentTerms}
                onChange={handleChange("paymentTerms")}
                hint="e.g., Net 30, Net 45"
              />
            </div>
            <footer className="mt-6 flex justify-end gap-4">
              <Button type="button" variant="secondary" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save customer
              </Button>
            </footer>
          </Card>
        </div>
      </form>
    </main>
  );
}
