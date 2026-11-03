"use client";

import { useState } from "react";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Field } from "@/components/Field";
import { PageHeader } from "@/components/PageHeader";

const workspaceName = "Fern & Field Studio";

const notificationPreferences = [
  { label: "Invoice paid", hint: "Email Mara when a client settles an invoice.", checked: true },
  { label: "New client signed", hint: "Email Mara when a proposal is accepted.", checked: true },
  { label: "Weekly digest", hint: "A Monday-morning summary of workspace activity.", checked: false },
  { label: "Product updates", hint: "Occasional notes about new features and changes.", checked: false },
];

export default function WorkspaceSettingsPage() {
  const [confirmName, setConfirmName] = useState("");

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Profile, invoicing defaults, and notification preferences for Fern & Field Studio."
      />

      <div className="flex flex-col gap-8">
        <Card title="Profile">
          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Workspace name"
              defaultValue={workspaceName}
              hint="Shown on invoices and client-facing pages."
            />
            <Field
              label="Email"
              type="email"
              defaultValue="mara@fernandfield.co"
              hint="Used for sign-in and billing notices."
            />
          </div>
          <p className="mt-6 font-mono text-xs text-ink-3">Workspace ID ws_8f3k2mq · Created March 2023</p>
          <footer className="mt-6 flex justify-end">
            <Button variant="primary">Save changes</Button>
          </footer>
        </Card>

        <Card title="Invoicing defaults">
          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Payment terms" defaultValue="Net 30" hint="Applied to every new invoice." />
            <Field label="Currency" defaultValue="USD — US dollar" hint="Totals and taxes are shown in this currency." />
          </div>
          <footer className="mt-6 flex justify-end">
            <Button variant="secondary">Save defaults</Button>
          </footer>
        </Card>

        <Card title="Notifications">
          <ul className="flex flex-col gap-4">
            {notificationPreferences.map((pref) => (
              <li key={pref.label}>
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    defaultChecked={pref.checked}
                    className="mt-1 h-4 w-4 shrink-0 accent-accent"
                  />
                  <span className="flex flex-col gap-1">
                    <span className="font-body text-sm font-medium text-ink">{pref.label}</span>
                    <span className="font-body text-sm text-ink-3">{pref.hint}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <footer className="mt-6 flex justify-end">
            <Button variant="secondary">Save preferences</Button>
          </footer>
        </Card>

        <Card title="Danger zone" action={<Badge tone="negative">Irreversible</Badge>}>
          <p className="max-w-prose font-body text-sm text-ink-2">
            Deleting this workspace permanently removes all clients, invoices, and files. This action cannot be undone.
          </p>
          <div className="mt-6 max-w-sm">
            <Field
              label="Confirm workspace name"
              placeholder={workspaceName}
              value={confirmName}
              onChange={(event) => setConfirmName(event.target.value)}
              hint={`Type "${workspaceName}" to enable deletion.`}
            />
          </div>
          <footer className="mt-6 flex justify-end">
            <Button variant="danger" disabled={confirmName !== workspaceName}>
              Delete workspace
            </Button>
          </footer>
        </Card>
      </div>
    </main>
  );
}
