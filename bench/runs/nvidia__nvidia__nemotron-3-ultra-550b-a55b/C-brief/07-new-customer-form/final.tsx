import { Field } from "@/components/Field";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { useState } from "react";

type PaymentTerm = "net-15" | "net-30" | "net-45" | "net-60" | "due-on-receipt";

const PAYMENT_TERMS: { value: PaymentTerm; label: string }[] = [
  { value: "due-on-receipt", label: "Due on receipt" },
  { value: "net-15", label: "Net 15" },
  { value: "net-30", label: "Net 30" },
  { value: "net-45", label: "Net 45" },
  { value: "net-60", label: "Net 60" },
];

interface FormData {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  billingAddress: string;
  taxId: string;
  paymentTerms: PaymentTerm;
}

const initialData: FormData = {
  companyName: "Acme Corporation",
  contactName: "Jane Doe",
  email: "jane.doe@acme.com",
  phone: "+1 (555) 123-4567",
  billingAddress: "123 Main Street, Suite 400\nSpringfield, IL 62704\nUSA",
  taxId: "12-3456789",
  paymentTerms: "net-30",
};

export default function AddCustomerForm() {
  const [formData, setFormData] = useState<FormData>(initialData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.companyName.trim()) newErrors.companyName = "Company name is required";
    if (!formData.contactName.trim()) newErrors.contactName = "Contact name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Enter a valid email address";
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    if (!formData.billingAddress.trim()) newErrors.billingAddress = "Billing address is required";
    if (!formData.taxId.trim()) newErrors.taxId = "Tax ID is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      console.log("Submitting customer:", formData);
      alert("Customer saved (check console)");
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <PageHeader
        title="Add customer"
        description="Enter the customer details below. Required fields are marked."
      />

      <Card>
        <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
          <Field
            label="Company name"
            name="companyName"
            value={formData.companyName}
            onChange={(e) => handleChange("companyName", e.target.value)}
            error={errors.companyName}
            hint="Legal entity name"
            required
            autoComplete="organization"
          />

          <Field
            label="Contact name"
            name="contactName"
            value={formData.contactName}
            onChange={(e) => handleChange("contactName", e.target.value)}
            error={errors.contactName}
            hint="Primary point of contact"
            required
            autoComplete="name"
          />

          <Field
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            error={errors.email}
            hint="Used for invoices and notifications"
            required
            autoComplete="email"
            className="md:col-span-2"
          />

          <Field
            label="Phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            error={errors.phone}
            hint="Include country code"
            required
            autoComplete="tel"
          />

          <Field
            label="Tax ID"
            name="taxId"
            value={formData.taxId}
            onChange={(e) => handleChange("taxId", e.target.value)}
            error={errors.taxId}
            hint="VAT number, EIN, or local tax identifier"
            required
            autoComplete="off"
          />

          <div className="md:col-span-2">
            <label htmlFor="billingAddress" className="font-body text-sm font-medium text-ink">
              Billing address
            </label>
            <textarea
              id="billingAddress"
              name="billingAddress"
              value={formData.billingAddress}
              onChange={(e) => handleChange("billingAddress", e.target.value)}
              error={errors.billingAddress}
              className={`h-28 rounded-md border bg-paper px-3 font-body text-base text-ink placeholder:text-ink-3 focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-accent resize-y ${errors.billingAddress ? "border-brick" : "border-line"}`}
              required
              autoComplete="billing street-address"
            />
            {errors.billingAddress && (
              <p className="font-body text-sm text-brick mt-2">{errors.billingAddress}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="paymentTerms" className="font-body text-sm font-medium text-ink">
              Default payment terms
            </label>
            <select
              id="paymentTerms"
              name="paymentTerms"
              value={formData.paymentTerms}
              onChange={(e) => handleChange("paymentTerms", e.target.value as PaymentTerm)}
              className="mt-2 h-12 rounded-md border border-line bg-paper px-3 font-body text-base text-ink focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-accent"
            >
              {PAYMENT_TERMS.map((term) => (
                <option key={term.value} value={term.value}>
                  {term.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-line">
            <Button type="button" variant="ghost" onClick={() => setFormData(initialData)}>
              Reset
            </Button>
            <Button type="button" variant="secondary" onClick={() => window.history.back()}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save customer
            </Button>
          </div>
        </form>
      </Card>
    </main>
  );
}
