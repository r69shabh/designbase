import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Field } from "@/components/Field";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/Badge";
import { useState } from "react";

export default function WorkspaceSettings() {
  const [profile, setProfile] = useState({ name: "Acme Corporation", email: "billing@acme.com" });
  const [invoicing, setInvoicing] = useState({ paymentTerms: "net-30", currency: "USD" });
  const [notifications, setNotifications] = useState({
    invoiceCreated: true,
    invoicePaid: true,
    invoiceOverdue: true,
    weeklyDigest: false,
    marketingEmails: false,
  });

  const paymentTermsOptions = [
    { value: "due-on-receipt", label: "Due on receipt" },
    { value: "net-15", label: "Net 15" },
    { value: "net-30", label: "Net 30" },
    { value: "net-45", label: "Net 45" },
    { value: "net-60", label: "Net 60" },
  ];

  const currencyOptions = [
    { value: "USD", label: "USD — US Dollar" },
    { value: "EUR", label: "EUR — Euro" },
    { value: "GBP", label: "GBP — British Pound" },
    { value: "CAD", label: "CAD — Canadian Dollar" },
    { value: "AUD", label: "AUD — Australian Dollar" },
  ];

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <PageHeader
        eyebrow="Settings"
        title="Workspace"
        description="Manage your workspace profile, invoicing defaults, and notification preferences."
      />

      <div className="flex flex-col gap-8">
        <Card title="Profile">
          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Workspace name"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              hint="This name appears on invoices and emails."
            />
            <Field
              label="Email address"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              hint="Used for billing communications and account recovery."
            />
          </div>
          <footer className="mt-6 flex justify-end">
            <Button variant="secondary">Save changes</Button>
          </footer>
        </Card>

        <Card title="Invoicing defaults">
          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Default payment terms"
              as="select"
              value={invoicing.paymentTerms}
              onChange={(e) => setInvoicing({ ...invoicing, paymentTerms: e.target.value })}
              hint="Applied to new invoices. Can be overridden per invoice."
            >
              {paymentTermsOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Field>
            <Field
              label="Default currency"
              as="select"
              value={invoicing.currency}
              onChange={(e) => setInvoicing({ ...invoicing, currency: e.target.value })}
              hint="Currency used for new invoices and reports."
            >
              {currencyOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Field>
          </div>
          <footer className="mt-6 flex justify-end">
            <Button variant="secondary">Save changes</Button>
          </footer>
        </Card>

        <Card title="Notification preferences">
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="font-body text-base text-ink">Invoice created</span>
                <span className="font-body text-sm text-ink-3">When a new invoice is generated</span>
              </div>
              <input
                type="checkbox"
                checked={notifications.invoiceCreated}
                onChange={(e) => setNotifications({ ...notifications, invoiceCreated: e.target.checked })}
                className="h-4 w-4 rounded-sm border-line text-accent focus:outline-accent"
              />
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-line pt-6">
              <div className="flex flex-col gap-1">
                <span className="font-body text-base text-ink">Invoice paid</span>
                <span className="font-body text-sm text-ink-3">When a payment is received</span>
              </div>
              <input
                type="checkbox"
                checked={notifications.invoicePaid}
                onChange={(e) => setNotifications({ ...notifications, invoicePaid: e.target.checked })}
                className="h-4 w-4 rounded-sm border-line text-accent focus:outline-accent"
              />
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-line pt-6">
              <div className="flex flex-col gap-1">
                <span className="font-body text-base text-ink">Invoice overdue</span>
                <span className="font-body text-sm text-ink-3">When an invoice passes its due date</span>
              </div>
              <input
                type="checkbox"
                checked={notifications.invoiceOverdue}
                onChange={(e) => setNotifications({ ...notifications, invoiceOverdue: e.target.checked })}
                className="h-4 w-4 rounded-sm border-line text-accent focus:outline-accent"
              />
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-line pt-6">
              <div className="flex flex-col gap-1">
                <span className="font-body text-base text-ink">Weekly digest</span>
                <span className="font-body text-sm text-ink-3">Summary of activity every Monday</span>
              </div>
              <input
                type="checkbox"
                checked={notifications.weeklyDigest}
                onChange={(e) => setNotifications({ ...notifications, weeklyDigest: e.target.checked })}
                className="h-4 w-4 rounded-sm border-line text-accent focus:outline-accent"
              />
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-line pt-6">
              <div className="flex flex-col gap-1">
                <span className="font-body text-base text-ink">Marketing emails</span>
                <span className="font-body text-sm text-ink-3">Product updates and tips</span>
              </div>
              <input
                type="checkbox"
                checked={notifications.marketingEmails}
                onChange={(e) => setNotifications({ ...notifications, marketingEmails: e.target.checked })}
                className="h-4 w-4 rounded-sm border-line text-accent focus:outline-accent"
              />
            </div>
          </div>
          <footer className="mt-6 flex justify-end">
            <Button variant="secondary">Save changes</Button>
          </footer>
        </Card>

        <Card title="Danger zone">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <span className="font-body text-base text-ink">Delete workspace</span>
              <span className="font-body text-sm text-ink-3">
                Permanently delete this workspace and all its data. This action cannot be undone.
              </span>
            </div>
            <Button variant="danger">Delete workspace</Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
