import React from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Field } from "@/components/Field";
import { Button } from "@/components/Button";

export default function WorkspaceSettings() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 bg-paper text-ink">
      <PageHeader
        eyebrow="Settings"
        title="Workspace settings"
        description="Manage workspace details, invoicing defaults, and notification preferences."
      />
      <div className="flex flex-col gap-8">
        {/* Profile */}
        <Card title="Profile">
          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Workspace name"
              defaultValue="Acme Publishing"
            />
            <Field
              label="Contact email"
              type="email"
              defaultValue="admin@acme.com"
            />
          </div>
          <footer className="mt-6 flex justify-end">
            <Button variant="secondary" size="md">
              Save changes
            </Button>
          </footer>
        </Card>

        {/* Invoicing defaults */}
        <Card title="Invoicing defaults">
          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Payment terms"
              hint="e.g., Net 30"
              defaultValue="Net 30"
            />
            <Field
              label="Currency"
              hint="ISO code"
              defaultValue="USD"
            />
          </div>
          <footer className="mt-6 flex justify-end">
            <Button variant="secondary" size="md">
              Save changes
            </Button>
          </footer>
        </Card>

        {/* Notification preferences */}
        <Card title="Notification preferences">
          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Email notifications"
              hint="Comma‑separated addresses"
              defaultValue="team@acme.com, finance@acme.com"
            />
            <Field
              label="Slack webhook URL"
              hint="Optional"
              defaultValue=""
            />
          </div>
          <footer className="mt-6 flex justify-end">
            <Button variant="secondary" size="md">
              Save changes
            </Button>
          </footer>
        </Card>

        {/* Danger zone */}
        <Card title="Danger zone">
          <p className="font-body text-sm text-ink-3 mb-4">
            Deleting this workspace is permanent and cannot be undone. All data,
            projects, and members will be lost.
          </p>
          <Button variant="danger" size="md">
            Delete workspace
          </Button>
        </Card>
      </div>
    </main>
  );
}
