import { useState } from "react";
import { SideNav } from "@/components/SideNav";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Field } from "@/components/Field";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";

const navItems = [
  { label: "General", href: "/settings", active: true },
  { label: "Members", href: "/settings/members" },
  { label: "Billing", href: "/settings/billing" },
  { label: "Integrations", href: "/settings/integrations" },
];

const currencies = [
  { code: "USD", label: "US Dollar ($)" },
  { code: "EUR", label: "Euro (€)" },
  { code: "GBP", label: "British Pound (£)" },
  { code: "CAD", label: "Canadian Dollar (CA$)" },
  { code: "AUD", label: "Australian Dollar (A$)" },
];

const paymentTerms = [
  { value: "due_on_receipt", label: "Due on receipt" },
  { value: "net_7", label: "Net 7" },
  { value: "net_15", label: "Net 15" },
  { value: "net_30", label: "Net 30" },
  { value: "net_45", label: "Net 45" },
  { value: "net_60", label: "Net 60" },
];

const notificationOptions = [
  { key: "emailInvoices", label: "Invoice sent", description: "When an invoice is sent to a client" },
  { key: "emailPayments", label: "Payment received", description: "When a payment is recorded" },
  { key: "emailOverdue", label: "Invoice overdue", description: "When an invoice becomes overdue" },
  { key: "emailReminders", label: "Reminder sent", description: "When an automatic reminder is sent" },
  { key: "emailWeekly", label: "Weekly summary", description: "Weekly digest of workspace activity" },
];

export default function WorkspaceSettings() {
  const [profile, setProfile] = useState({ name: "Acme Corporation", email: "billing@acme.com" });
  const [invoicing, setInvoicing] = useState({ paymentTerms: "net_30", currency: "USD" });
  const [notifications, setNotifications] = useState({
    emailInvoices: true,
    emailPayments: true,
    emailOverdue: true,
    emailReminders: false,
    emailWeekly: true,
  });

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleInvoicingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setInvoicing({ ...invoicing, [e.target.name]: e.target.value });
  };

  const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNotifications({ ...notifications, [e.target.name]: e.target.checked });
  };

  return (
    <div className="flex min-h-screen bg-paper">
      <SideNav product="Almanac" items={navItems} />
      <main className="flex-1 px-6 py-12 md:px-16">
        <PageHeader
          eyebrow="Settings"
          title="Workspace"
          description="Manage your workspace profile, invoicing defaults, and notification preferences."
        />

        <div className="mx-auto max-w-2xl flex flex-col gap-8">
          <Card title="Profile">
            <div className="grid gap-6 md:grid-cols-2">
              <Field
                label="Workspace name"
                name="name"
                value={profile.name}
                onChange={handleProfileChange}
                placeholder="Acme Corporation"
              />
              <Field
                label="Billing email"
                name="email"
                type="email"
                value={profile.email}
                onChange={handleProfileChange}
                placeholder="billing@acme.com"
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
                name="paymentTerms"
                as="select"
                value={invoicing.paymentTerms}
                onChange={handleInvoicingChange}
              >
                {paymentTerms.map((term) => (
                  <option key={term.value} value={term.value}>
                    {term.label}
                  </option>
                ))}
              </Field>
              <Field
                label="Default currency"
                name="currency"
                as="select"
                value={invoicing.currency}
                onChange={handleInvoicingChange}
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </Field>
            </div>
            <p className="mt-4 font-body text-sm text-ink-2">
              These defaults apply to new invoices. You can override them per invoice.
            </p>
            <footer className="mt-6 flex justify-end">
              <Button variant="secondary">Save changes</Button>
            </footer>
          </Card>

          <Card title="Notification preferences">
            <p className="font-body text-sm text-ink-2">
              Choose which email notifications you receive for this workspace.
            </p>
            <div className="mt-6 flex flex-col gap-4">
              {notificationOptions.map((opt) => (
                <label
                  key={opt.key}
                  className="flex items-start gap-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    name={opt.key}
                    checked={notifications[opt.key as keyof typeof notifications]}
                    onChange={handleNotificationChange}
                    className="mt-1 h-4 w-4 rounded-sm border-line text-accent focus:outline-accent"
                  />
                  <div>
                    <span className="font-body text-sm font-medium text-ink">{opt.label}</span>
                    <p className="font-body text-xs text-ink-3">{opt.description}</p>
                  </div>
                </label>
              ))}
            </div>
            <footer className="mt-6 flex justify-end">
              <Button variant="secondary">Save changes</Button>
            </footer>
          </Card>

          <Card title="Danger zone">
            <div className="flex flex-col gap-4">
              <p className="font-body text-sm text-ink-2">
                Deleting your workspace will permanently remove all invoices, clients, and
                settings. This action cannot be undone.
              </p>
              <Button variant="danger">Delete workspace</Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
