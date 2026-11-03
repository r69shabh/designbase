import { useId, useState } from "react";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Field } from "@/components/Field";
import { PageHeader } from "@/components/PageHeader";
import { SideNav } from "@/components/SideNav";

const navItems = [
  { label: "Overview", href: "#overview" },
  { label: "Invoices", href: "#invoices", count: 24 },
  { label: "Clients", href: "#clients", count: 11 },
  { label: "Settings", href: "#settings", active: true },
];

const paymentTermOptions = [
  { value: "due-on-receipt", label: "Due on receipt" },
  { value: "net-7", label: "Net 7" },
  { value: "net-15", label: "Net 15" },
  { value: "net-30", label: "Net 30" },
  { value: "net-60", label: "Net 60" },
];

const currencyOptions = [
  { value: "USD", label: "USD — US dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — Pound sterling" },
  { value: "CAD", label: "CAD — Canadian dollar" },
  { value: "AUD", label: "AUD — Australian dollar" },
];

const notificationOptions = [
  {
    key: "invoicePaid",
    label: "Payment received",
    description: "Send an email when an invoice is settled in full.",
  },
  {
    key: "overdueReminders",
    label: "Overdue reminders",
    description: "Nudge clients automatically when an invoice passes its due date.",
  },
  {
    key: "newClient",
    label: "New client activity",
    description: "Notify the workspace when a client is added or a draft is created.",
  },
  {
    key: "weeklyDigest",
    label: "Weekly digest",
    description: "A Monday summary of revenue, outstanding invoices and activity.",
  },
] as const;

type NotificationKey = (typeof notificationOptions)[number]["key"];

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-body text-sm font-medium text-ink">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 rounded-md border border-line bg-paper px-3 font-body text-base text-ink focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-accent"
      >
        {children}
      </select>
    </div>
  );
}

function SaveFooter({
  section,
  savedSection,
  onSave,
  variant = "secondary",
}: {
  section: string;
  savedSection: string | null;
  onSave: (section: string) => void;
  variant?: "primary" | "secondary";
}) {
  return (
    <footer className="mt-6 flex items-center justify-end gap-3">
      {savedSection === section && (
        <span className="font-body text-xs text-moss">Saved</span>
      )}
      <Button type="button" variant={variant} onClick={() => onSave(section)}>
        Save changes
      </Button>
    </footer>
  );
}

export default function WorkspaceSettingsPage() {
  const [fullName, setFullName] = useState("Amara Osei");
  const [email, setEmail] = useState("amara@northwindstudio.co");
  const [paymentTerms, setPaymentTerms] = useState("net-30");
  const [currency, setCurrency] = useState("USD");
  const [taxRate, setTaxRate] = useState("8.25");
  const [invoicePrefix, setInvoicePrefix] = useState("NS-");
  const [notifications, setNotifications] = useState<Record<NotificationKey, boolean>>({
    invoicePaid: true,
    overdueReminders: true,
    newClient: false,
    weeklyDigest: true,
  });
  const [confirmation, setConfirmation] = useState("");
  const [savedSection, setSavedSection] = useState<string | null>(null);

  const handleSave = (section: string) => {
    setSavedSection(section);
  };

  const toggleNotification = (key: NotificationKey) => {
    setNotifications((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <div className="flex min-h-screen bg-paper">
      <SideNav product="Northwind" items={navItems} />

      <main className="flex-1 px-6 py-12 md:px-16">
        <div className="mx-auto w-full max-w-3xl">
          <PageHeader
            eyebrow="Northwind Studio"
            title="Workspace settings"
            description="Manage the details your team and your clients see, and choose how this workspace behaves."
            actions={<Badge tone="neutral">Owner</Badge>}
          />

          <div className="flex flex-col gap-8">
            <Card title="Profile" action={<Badge tone="neutral">Owner</Badge>}>
              <div className="grid gap-6 md:grid-cols-2">
                <Field
                  label="Full name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  hint="Shown on invoices and receipts."
                />
                <Field
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  hint="Used for sign-in and billing receipts."
                />
              </div>
              <SaveFooter
                section="profile"
                savedSection={savedSection}
                onSave={handleSave}
                variant="primary"
              />
            </Card>

            <Card title="Invoicing defaults">
              <div className="grid gap-6 md:grid-cols-2">
                <SelectField
                  label="Payment terms"
                  value={paymentTerms}
                  onChange={setPaymentTerms}
                >
                  {paymentTermOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectField>

                <SelectField
                  label="Currency"
                  value={currency}
                  onChange={setCurrency}
                >
                  {currencyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectField>

                <Field
                  label="Default tax rate"
                  type="text"
                  inputMode="decimal"
                  value={taxRate}
                  onChange={(event) => setTaxRate(event.target.value)}
                  hint="Percentage applied to new invoices."
                />

                <Field
                  label="Invoice number prefix"
                  value={invoicePrefix}
                  onChange={(event) => setInvoicePrefix(event.target.value)}
                  hint="Next invoice will be NS-0041."
                />
              </div>
              <SaveFooter
                section="invoicing"
                savedSection={savedSection}
                onSave={handleSave}
              />
            </Card>

            <Card title="Notifications">
              <p className="mb-6 font-body text-sm text-ink-2">
                Choose which workspace events send an email to you and your teammates.
              </p>
              <ul className="flex flex-col gap-4">
                {notificationOptions.map((option) => (
                  <li key={option.key} className="flex items-start gap-3">
                    <input
                      id={`notify-${option.key}`}
                      type="checkbox"
                      checked={notifications[option.key]}
                      onChange={() => toggleNotification(option.key)}
                      className="mt-1 h-4 w-4 shrink-0 rounded-sm border border-ink accent-accent focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-accent"
                    />
                    <label
                      htmlFor={`notify-${option.key}`}
                      className="flex flex-col gap-1"
                    >
                      <span className="font-body text-sm font-medium text-ink">
                        {option.label}
                      </span>
                      <span className="font-body text-sm text-ink-3">
                        {option.description}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              <SaveFooter
                section="notifications"
                savedSection={savedSection}
                onSave={handleSave}
              />
            </Card>

            <Card title="Danger zone">
              <div className="flex flex-col gap-4">
                <p className="font-body text-sm text-ink-2">
                  Deleting this workspace permanently removes 24 invoices, 11 client
                  records and every saved template. This cannot be undone.
                </p>
                <Field
                  label="Type NORTHWIND STUDIO to confirm"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  placeholder="NORTHWIND STUDIO"
                />
                <footer className="flex justify-end">
                  <Button
                    type="button"
                    variant="danger"
                    disabled={confirmation !== "NORTHWIND STUDIO"}
                  >
                    Delete workspace
                  </Button>
                </footer>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
