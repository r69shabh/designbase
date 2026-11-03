import { Field } from "@/components/Field";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { useState } from "react";

const PAYMENT_TERMS = [
  { value: "net_15", label: "Net 15" },
  { value: "net_30", label: "Net 30" },
  { value: "net_45", label: "Net 45" },
  { value: "net_60", label: "Net 60" },
  { value: "due_on_receipt", label: "Due on receipt" },
];

export default function AddCustomerForm() {
  const [formData, setFormData] = useState({
    companyName: "Acme Corporation",
    contactName: "Jane Smith",
    email: "jane.smith@acme.com",
    phone: "+1 (555) 123-4567",
    billingAddress: "100 Main Street, Suite 400\nSan Francisco, CA 94105\nUnited States",
    taxId: "12-3456789",
    paymentTerms: "net_30",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.companyName.trim()) newErrors.companyName = "Company name is required";
    if (!formData.contactName.trim()) newErrors.contactName = "Contact name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Enter a valid email address";
    if (!formData.billingAddress.trim()) newErrors.billingAddress = "Billing address is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      console.log("Customer created:", formData);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <PageHeader
        title="Add customer"
        description="Enter the customer details below. Required fields are marked."
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <Card>
          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Company name"
              hint="Legal business name"
              value={formData.companyName}
              onChange={(e) => handleChange("companyName", e.target.value)}
              error={errors.companyName}
              required
            />
            <Field
              label="Contact name"
              hint="Primary point of contact"
              value={formData.contactName}
              onChange={(e) => handleChange("contactName", e.target.value)}
              error={errors.contactName}
              required
            />
            <Field
              label="Email"
              type="email"
              hint="Used for invoices and notifications"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              error={errors.email}
              required
            />
            <Field
              label="Phone"
              type="tel"
              hint="Include country code"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
            />
            <div className="md:col-span-2">
              <Field
                label="Billing address"
                as="textarea"
                rows={4}
                hint="Street, city, state, ZIP, country"
                value={formData.billingAddress}
                onChange={(e) => handleChange("billingAddress", e.target.value)}
                error={errors.billingAddress}
                required
                className="resize-y min-h-[120px]"
              />
            </div>
            <Field
              label="Tax ID"
              hint="EIN, VAT number, or local tax identifier"
              value={formData.taxId}
              onChange={(e) => handleChange("taxId", e.target.value)}
            />
            <div className="md:col-span-2">
              <label htmlFor="payment-terms" className="font-body text-sm font-medium text-ink">
                Default payment terms
              </label>
              <select
                id="payment-terms"
                value={formData.paymentTerms}
                onChange={(e) => handleChange("paymentTerms", e.target.value)}
                className="mt-2 h-12 w-full rounded-md border border-line bg-paper px-3 font-body text-base text-ink focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-accent"
              >
                {PAYMENT_TERMS.map((term) => (
                  <option key={term.value} value={term.value}>
                    {term.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <footer className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => window.history.back()}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Add customer
            </Button>
          </footer>
        </Card>
      </form>
    </main>
  );
}
