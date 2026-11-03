import { useState } from "react";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/Badge";

interface Member {
  id: string;
  name: string;
  role: string;
  lastActive: string; // ISO date string
}

interface Invitation {
  id: string;
  email: string;
  invitedAt: string; // ISO date string
  status: "pending";
}

export default function TeamMembersPage() {
  const [inviteEmail, setInviteEmail] = useState("");

  // Sample data
  const members: Member[] = [
    { id: "1", name: "Ada Lovelace", role: "Engineer", lastActive: "2026-10-28" },
    { id: "2", name: "Grace Hopper", role: "Product Lead", lastActive: "2026-10-30" },
    { id: "3", name: "Alan Turing", role: "Designer", lastActive: "2026-10-27" },
  ];

  const invitations: Invitation[] = [
    { id: "i1", email: "new.dev@example.com", invitedAt: "2026-10-31", status: "pending" },
    { id: "i2", email: "designer@example.com", invitedAt: "2026-10-29", status: "pending" },
  ];

  const memberColumns = [
    {
      key: "name",
      header: "Name",
      align: "left" as const,
    },
    {
      key: "role",
      header: "Role",
      align: "left" as const,
    },
    {
      key: "lastActive",
      header: "Last active",
      align: "right" as const,
      numeric: true,
      render: (row: Member) => (
        <span className="font-mono">{row.lastActive}</span>
      ),
    },
  ];

  const invitationColumns = [
    {
      key: "email",
      header: "Email",
      align: "left" as const,
    },
    {
      key: "invitedAt",
      header: "Invited",
      align: "right" as const,
      numeric: true,
      render: (row: Invitation) => (
        <span className="font-mono">{row.invitedAt}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "left" as const,
      render: () => (
        <Badge tone="warning">Pending</Badge>
      ),
    },
  ];

  return (
    <main className="bg-paper px-6 py-12 md:px-16">
      <PageHeader
        title="Team members"
        description="Manage your team, view roles, and send invitations."
        actions={<Button variant="primary">Invite member</Button>}
      />

      {/* Invite form */}
      <section className="mb-12">
        <h2 className="font-display text-lg font-medium text-ink mb-4">Invite a new member</h2>
        <div className="flex flex-col gap-4 max-w-md">
          <Field
            label="Email address"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="name@example.com"
          />
          <Button variant="secondary" size="md">
            Send invite
          </Button>
        </div>
      </section>

      {/* Members list */}
      <section className="mb-12">
        <h2 className="font-display text-lg font-medium text-ink mb-4">Current members</h2>
        {members.length ? (
          <DataTable columns={memberColumns} rows={members} />
        ) : (
          <EmptyState
            title="No members yet"
            body="Add people to your team so they can collaborate on projects."
            action={<Button variant="primary">Invite member</Button>}
          />
        )}
      </section>

      {/* Pending invitations */}
      <section>
        <h2 className="font-display text-lg font-medium text-ink mb-4">Pending invitations</h2>
        {invitations.length ? (
          <DataTable columns={invitationColumns} rows={invitations} />
        ) : (
          <EmptyState
            title="No pending invitations"
            body="All invitations have been accepted or expired."
          />
        )}
      </section>
    </main>
  );
}
