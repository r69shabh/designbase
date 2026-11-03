import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Field } from "@/components/Field";
import { Button } from "@/components/Button";

export default function WorkspaceSettings() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <PageHeader
        eyebrow="Settings"
        title="Workspace settings"
        description="Manage your workspace profile, invoicing defaults, and notification preferences."
      />

      <div className="flex flex-col gap-8">
        {/* Profile */}
        <Card title="Profile">
          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Workspace name"
              defaultValue="Acme Corporation"
              hint="This name appears on invoices and in the workspace switcher."
            />
            <Field
              label="Email address"
              type="email"
              defaultValue="billing@acmecorp.com"
              hint="Used for invoice delivery and account notifications."
            />
          </div>
          <footer className="mt-6 flex justify-end">
            <Button variant="secondary">Save changes</Button>
          </footer>
        </Card>

        {/* Invoicing defaults */}
        <Card title="Invoicing defaults">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="payment-terms" className="font-body text-sm font-medium text-ink">
                Default payment terms
              </label>
              <select
                id="payment-terms"
                className="h-12 rounded-md border border-line bg-paper px-3 font-body text-base text-ink focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-accent"
                defaultValue="net-30"
              >
                <option value="due-on-receipt">Due on receipt</option>
                <option value="net-7">Net 7</option>
                <option value="net-15">Net 15</option>
                <option value="net-30">Net 30</option>
                <option value="net-45">Net 45</option>
                <option value="net-60">Net 60</option>
              </select>
              <p className="font-body text-sm text-ink-3">Applied to new invoices when no terms are specified.</p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="currency" className="font-body text-sm font-medium text-ink">
                Default currency
              </label>
              <select
                id="currency"
                className="h-12 rounded-md border border-line bg-paper px-3 font-body text-base text-ink focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-accent"
                defaultValue="USD"
              >
                <option value="USD">USD — US Dollar ($)</option>
                <option value="EUR">EUR — Euro (€)</option>
                <option value="GBP">GBP — British Pound (£)</option>
                <option value="CAD">CAD — Canadian Dollar (CA$)</option>
                <option value="AUD">AUD — Australian Dollar (A$)</option>
                <option value="JPY">JPY — Japanese Yen (¥)</option>
              </select>
              <p className="font-body text-sm text-ink-3">Used for new invoices and reports.</p>
            </div>
          </div>
          <footer className="mt-6 flex justify-end">
            <Button variant="secondary">Save changes</Button>
          </footer>
        </Card>

        {/* Notification preferences */}
        <Card title="Notification preferences">
          <div className="space-y-6">
            <Field
              type="checkbox"
              label="Email notifications"
              hint="Receive emails for workspace activity and invoice events."
              defaultChecked
              className="flex-row items-start gap-4"
            />

            <div className="border-t border-line pt-6 space-y-4">
              <Field
                type="checkbox"
                label="Invoice sent"
                hint="Notify me when an invoice is sent to a client."
                defaultChecked
                className="flex-row items-start gap-4"
              />
              <Field
                type="checkbox"
                label="Invoice viewed"
                hint="Notify me when a client views an invoice."
                defaultChecked
                className="flex-row items-start gap-4"
              />
              <Field
                type="checkbox"
                label="Invoice paid"
                hint="Notify me when an invoice is marked as paid."
                defaultChecked
                className="flex-row items-start gap-4"
              />
              <Field
                type="checkbox"
                label="Invoice overdue"
                hint="Notify me when an invoice becomes overdue."
                defaultChecked
                className="flex-row items-start gap-4"
              />
              <Field
                type="checkbox"
                label="Weekly summary"
                hint="Receive a weekly digest of workspace activity every Monday."
                className="flex-row items-start gap-4"
              />
            </div>
          </div>
          <footer className="mt-6 flex justify-end">
            <Button variant="secondary">Save changes</Button>
          </footer>
        </Card>

        {/* Danger zone */}
        <Card title="Danger zone">
          <div className="flex flex-col gap-4">
            <div>
              <p className="font-body text-base text-ink">Delete workspace</p>
              <p className="font-body text-sm text-ink-3 mt-1">
                Permanently delete this workspace and all its data — invoices, clients, and settings. This action cannot be undone.
              </p>
            </div>
            <Button variant="danger">Delete workspace</Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
