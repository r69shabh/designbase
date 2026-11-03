import { useState, type FormEvent } from "react";

import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { DataTable } from "@/components/DataTable";
import type { Column } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { Field } from "@/components/Field";
import { PageHeader } from "@/components/PageHeader";

type Member = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastActive: string;
};

type Invitation = {
  id: string;
  email: string;
  role: string;
  invitedOn: string;
  status: string;
  actions: string;
};

const members: Member[] = [
  { id: "mem-01", name: "Mara Ellison", email: "mara@almanac.press", role: "Owner", status: "Active", lastActive: "Today, 09:41" },
  { id: "mem-02", name: "Jonas Beck", email: "jonas@almanac.press", role: "Admin", status: "Active", lastActive: "Today, 08:05" },
  { id: "mem-03", name: "Priya Raman", email: "priya@almanac.press", role: "Editor", status: "Active", lastActive: "Yesterday, 17:22" },
  { id: "mem-04", name: "Tomás Rivera", email: "tomas@almanac.press", role: "Editor", status: "Active", lastActive: "Feb 2, 2026" },
  { id: "mem-05", name: "Hana Sato", email: "hana@almanac.press", role: "Viewer", status: "Active", lastActive: "Jan 28, 2026" },
];

const invitations: Invitation[] = [
  { id: "inv-01", email: "lena.kovac@example.com", role: "Editor", invitedOn: "Feb 10, 2026", status: "Pending", actions: "" },
  { id: "inv-02", email: "devon.okafor@example.com", role: "Viewer", invitedOn: "Feb 8, 2026", status: "Pending", actions: "" },
];

const memberColumns: Column<Member>[] = [
  { key: "name", header: "Name" },
  {
    key: "email",
    header: "Email",
    render: (member) => <span className="text-ink-2">{member.email}</span>,
  },
  { key: "role", header: "Role" },
  {
    key: "status",
    header: "Status",
    render: (member) => <Badge tone="positive">{member.status}</Badge>,
  },
  {
    key: "lastActive",
    header: "Last active",
    align: "right",
    render: (member) => <span className="font-mono text-ink-3">{member.lastActive}</span>,
  },
];

const invitationColumns: Column<Invitation>[] = [
  { key: "email", header: "Email" },
  { key: "role", header: "Role" },
  {
    key: "invitedOn",
    header: "Invited on",
    render: (invitation) => <span className="font-mono text-ink-3">{invitation.invitedOn}</span>,
  },
  {
    key: "status",
    header: "Status",
    render: (invitation) => <Badge tone="warning">{invitation.status}</Badge>,
  },
  {
    key: "actions",
    header: "Actions",
    align: "right",
    render: () => <Button variant="ghost" size="sm">Resend</Button>,
  },
];

export default function TeamMembersPage() {
  const [query, setQuery] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(query.toLowerCase()) ||
      member.email.toLowerCase().includes(query.toLowerCase()),
  );

  function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError("Enter a valid email address.");
      return;
    }
    setError(undefined);
    setSentTo(value);
    setEmail("");
  }

  return (
    <main className="px-6 py-12 md:px-16">
      <PageHeader
        eyebrow="Workspace settings"
        title="Team members"
        description="Everyone with access to this workspace, plus invitations that are still waiting to be accepted."
        actions={<Button variant="secondary">Export list</Button>}
      />

      <div className="flex flex-col gap-12">
        <section>
          <div className="mb-6 flex items-baseline gap-3">
            <h2 className="font-display text-xl font-medium text-ink">Members</h2>
            <span className="font-mono text-sm text-ink-3">{members.length}</span>
          </div>
          <div className="mb-6 max-w-sm">
            <Field
              label="Search members"
              type="search"
              placeholder="Name or email"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          {filteredMembers.length > 0 ? (
            <DataTable columns={memberColumns} rows={filteredMembers} />
          ) : (
            <EmptyState
              title="No members match"
              body="Try a different name or email address, or clear the search to see everyone on the team."
              action={<Button variant="ghost" onClick={() => setQuery("")}>Clear search</Button>}
            />
          )}
        </section>

        <section>
          <div className="mb-6 flex items-baseline gap-3">
            <h2 className="font-display text-xl font-medium text-ink">Pending invitations</h2>
            <span className="font-mono text-sm text-ink-3">{invitations.length}</span>
          </div>
          <DataTable columns={invitationColumns} rows={invitations} />
        </section>

        <section>
          <Card title="Invite someone by email">
            <p className="mb-6 max-w-prose font-body text-sm text-ink-2">
              They will receive an email with a link to join this workspace as a viewer. You can change their role after they accept.
            </p>
            <form className="flex flex-col gap-4 md:flex-row md:items-end" onSubmit={handleInvite}>
              <Field
                label="Email address"
                type="email"
                placeholder="name@example.com"
                hint="We will send them an invitation link."
                error={error}
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (error) setError(undefined);
                }}
                className="w-full md:flex-1"
              />
              <Button variant="primary">Send invitation</Button>
            </form>
            {sentTo && (
              <p className="mt-4 font-body text-sm text-moss">Invitation sent to {sentTo}.</p>
            )}
          </Card>
        </section>
      </div>
    </main>
  );
}
