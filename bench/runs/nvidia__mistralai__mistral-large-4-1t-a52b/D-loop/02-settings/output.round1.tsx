import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Field } from "@/components/Field";
import { PageHeader } from "@/components/PageHeader";

const notificationPreferences = [
  {
    id: "invoice-paid",
    label: "Invoice paid",
    description: "Email me as soon as a client pays an invoice.",
    enabled: true,
  },
  {
    id: "invoice-overdue",
    label: "Invoice overdue",
    description: "A weekly digest of invoices past their due date.",
    enabled: true,
  },
  {
    id: "new-client",
    label: "New client signed",
    description: "Email me when a new client signs a contract.",
    enabled: false,
  },
  {
    id: "product-updates",
    label: "Product updates",
    description: "Occasional notes about new features and changes.",
    enabled: false,
  },
];

export default function WorkspaceSettingsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Profile, invoicing defaults, and notification preferences for Meridian Studio."
      />

      <div className="flex flex-col gap-8">
        <Card title="Profile" action={<Badge tone="accent">Admin</Badge>}>
          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Full name" name="name" defaultValue="June Okafor" autoComplete="name" />
            <Field
              label="Email address"
              name="email"
              type="email"
              defaultValue="june@meridian.studio"
              hint="Sign-in and invoice receipts go to this address."
              autoComplete="email"
            />
          </div>
          <footer className="mt-6 flex justify-end">
            <Button type="button" variant="secondary">
              Save changes
            </Button>
          </footer>
        </Card>

        <Card title="Invoicing defaults">
          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Payment terms"
              name="payment-terms"
              defaultValue="Net 30"
              hint="Applied to every new invoice."
            />
            <Field
              label="Currency"
              name="currency"
              defaultValue="USD"
              hint="ISO 4217 code, for example EUR or GBP."
            />
          </div>
          <footer className="mt-6 flex justify-end">
            <Button type="button" variant="secondary">
              Save defaults
            </Button>
          </footer>
        </Card>

        <Card title="Notifications">
          <ul className="flex flex-col gap-4">
            {notificationPreferences.map((preference) => (
              <li
                key={preference.id}
                className="flex items-center justify-between gap-4 border-b border-line pb-4 last:border-b-0 last:pb-0"
              >
                <span className="flex flex-col gap-1">
                  <span className="flex items-center gap-2">
                    <span className="font-body text-sm font-medium text-ink">
                      {preference.label}
                    </span>
                    <Badge tone={preference.enabled ? "positive" : "neutral"}>
                      {preference.enabled ? "On" : "Off"}
                    </Badge>
                  </span>
                  <span className="font-body text-sm text-ink-3">{preference.description}</span>
                </span>
                <Button type="button" variant="ghost" size="sm">
                  {preference.enabled ? "Turn off" : "Turn on"}
                </Button>
              </li>
            ))}
          </ul>
          <footer className="mt-6 flex justify-end">
            <Button type="button" variant="secondary">
              Save preferences
            </Button>
          </footer>
        </Card>

        <Card title="Danger zone">
          <p className="max-w-prose font-body text-sm text-ink-2">
            Deleting Meridian Studio permanently removes every project, invoice, and client
            record in the workspace. This action cannot be undone.
          </p>
          <div className="mt-6">
            <Field
              label="Confirm workspace name"
              name="confirm-workspace"
              hint="Type Meridian Studio to confirm deletion."
            />
          </div>
          <footer className="mt-6 flex justify-end">
            <Button type="button" variant="danger">
              Delete workspace
            </Button>
          </footer>
        </Card>
      </div>
    </main>
  );
}
