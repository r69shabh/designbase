import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Field } from "@/components/Field";
import { PageHeader } from "@/components/PageHeader";

const notificationPreferences = [
  { name: "Invoices and payments", description: "When an invoice is sent, paid or becomes overdue.", enabled: true },
  { name: "Weekly digest", description: "A summary of workspace activity, every Monday morning.", enabled: true },
  { name: "Member activity", description: "When someone joins or leaves the workspace.", enabled: false },
  { name: "Product updates", description: "New features and changes to Almanac.", enabled: false },
];

export default function WorkspaceSettingsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Profile, invoicing defaults and notification preferences for the Fieldnote Studio workspace."
      />

      <div className="flex flex-col gap-8">
        <Card title="Profile" action={<Badge tone="accent">Owner</Badge>}>
          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Workspace name" defaultValue="Fieldnote Studio" />
            <Field label="Billing email" type="email" defaultValue="mara@fieldnote.studio" />
          </div>
          <footer className="mt-6 flex justify-end">
            <Button variant="secondary">Save changes</Button>
          </footer>
        </Card>

        <Card title="Invoicing defaults">
          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Payment terms" defaultValue="Net 30" hint="Applied to every new invoice." />
            <Field label="Currency" defaultValue="USD — US Dollar" />
          </div>
          <footer className="mt-6 flex justify-end">
            <Button variant="secondary">Save changes</Button>
          </footer>
        </Card>

        <Card title="Notifications">
          <ul className="flex flex-col gap-4">
            {notificationPreferences.map((preference) => (
              <li key={preference.name} className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="font-body text-sm font-medium text-ink">{preference.name}</span>
                  <span className="font-body text-sm text-ink-3">{preference.description}</span>
                </div>
                <Badge tone={preference.enabled ? "positive" : "neutral"}>
                  {preference.enabled ? "Enabled" : "Muted"}
                </Badge>
              </li>
            ))}
          </ul>
          <footer className="mt-6 flex justify-end">
            <Button variant="secondary">Save changes</Button>
          </footer>
        </Card>

        <Card title="Danger zone">
          <p className="max-w-prose font-body text-sm text-ink-2">
            Deleting the workspace removes all projects, invoices and members. This action cannot be undone.
          </p>
          <div className="mt-6">
            <Field label="Confirmation" placeholder="DELETE" hint="Type DELETE to permanently delete this workspace." />
          </div>
          <footer className="mt-6 flex justify-end">
            <Button variant="danger">Delete workspace</Button>
          </footer>
        </Card>
      </div>
    </main>
  );
}
