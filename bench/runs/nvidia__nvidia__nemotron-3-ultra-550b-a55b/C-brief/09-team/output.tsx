import { useState } from "react";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/Badge";

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  lastActive: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  invitedAt: string;
  status: "pending" | "accepted" | "expired";
}

const members: Member[] = [
  { id: "1", name: "Avery Chen", email: "avery@almanac.dev", role: "Owner", lastActive: "2 hours ago" },
  { id: "2", name: "Marcus Webb", email: "marcus@almanac.dev", role: "Admin", lastActive: "Yesterday" },
  { id: "3", name: "Priya Sharma", email: "priya@almanac.dev", role: "Editor", lastActive: "3 days ago" },
  { id: "4", name: "Jordan Kim", email: "jordan@almanac.dev", role: "Viewer", lastActive: "1 week ago" },
  { id: "5", name: "Sam Rivera", email: "sam@almanac.dev", role: "Editor", lastActive: "5 hours ago" },
];

const invitations: Invitation[] = [
  { id: "i1", email: "new.hire@company.com", role: "Editor", invitedAt: "2 days ago", status: "pending" },
  { id: "i2", email: "contractor@external.io", role: "Viewer", invitedAt: "1 week ago", status: "expired" },
];

const roleOptions = ["Owner", "Admin", "Editor", "Viewer"] as const;

export default function TeamMembersPage() {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<typeof roleOptions[number]>("Editor");
  const [inviteError, setInviteError] = useState("");

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError("");
    if (!inviteEmail.trim()) {
      setInviteError("Email is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      setInviteError("Enter a valid email address");
      return;
    }
    // In a real app, this would call an API
    console.log("Invite sent to", inviteEmail, "as", inviteRole);
    setInviteEmail("");
    setInviteRole("Editor");
    setShowInviteForm(false);
  };

  const memberColumns = [
    { key: "name", header: "Name", render: (row: Member) => (
      <div className="flex flex-col gap-1">
        <span className="font-body text-sm text-ink">{row.name}</span>
        <span className="font-body text-xs text-ink-3">{row.email}</span>
      </div>
    )},
    { key: "role", header: "Role", render: (row: Member) => (
      <Badge tone={row.role === "Owner" ? "accent" : "neutral"}>{row.role}</Badge>
    )},
    { key: "lastActive", header: "Last active", align: "right" as const, render: (row: Member) => (
      <span className="font-mono text-sm text-ink-2">{row.lastActive}</span>
    )},
  ];

  const invitationColumns = [
    { key: "email", header: "Email", render: (row: Invitation) => (
      <span className="font-body text-sm text-ink">{row.email}</span>
    )},
    { key: "role", header: "Role", render: (row: Invitation) => (
      <Badge tone="neutral">{row.role}</Badge>
    )},
    { key: "invitedAt", header: "Invited", align: "right" as const, render: (row: Invitation) => (
      <span className="font-mono text-sm text-ink-2">{row.invitedAt}</span>
    )},
    { key: "status", header: "Status", render: (row: Invitation) => {
      const tone = row.status === "pending" ? "warning" : row.status === "accepted" ? "positive" : "negative";
      return <Badge tone={tone}>{row.status}</Badge>;
    }},
  ];

  return (
    <main className="px-6 py-12 md:px-16">
      <PageHeader
        title="Team members"
        description="Manage team access and pending invitations."
        actions={
          <Button variant="primary" onClick={() => setShowInviteForm(true)}>
            Invite member
          </Button>
        }
      />

      {showInviteForm && (
        <form onSubmit={handleInvite} className="mb-8 rounded-md border border-line bg-paper-2 p-6 md:flex md:items-end md:gap-4">
          <Field
            label="Email address"
            type="email"
            placeholder="new.member@company.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            error={inviteError}
            hint="An invitation will be sent to this address"
            className="w-full md:w-80"
          />
          <Field
            label="Role"
            className="w-full md:w-48"
            asChild
          >
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as typeof roleOptions[number])}
              className="h-12 rounded-md border border-line bg-paper px-3 font-body text-base text-ink focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-accent"
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </Field>
          <div className="flex gap-3 mt-4 md:mt-0">
            <Button type="submit" variant="primary">Send invitation</Button>
            <Button type="button" variant="ghost" onClick={() => { setShowInviteForm(false); setInviteError(""); }}>Cancel</Button>
          </div>
        </form>
      )}

      <section className="mb-12" aria-labelledby="active-members-heading">
        <h2 id="active-members-heading" className="font-display text-lg font-medium text-ink mb-6">Active members</h2>
        {members.length > 0 ? (
          <DataTable columns={memberColumns} rows={members} />
        ) : (
          <EmptyState
            title="No members yet"
            body="Invite your first team member to get started."
            action={<Button variant="primary" onClick={() => setShowInviteForm(true)}>Invite member</Button>}
          />
        )}
      </section>

      <section aria-labelledby="pending-invitations-heading">
        <h2 id="pending-invitations-heading" className="font-display text-lg font-medium text-ink mb-6">Pending invitations</h2>
        {invitations.length > 0 ? (
          <DataTable columns={invitationColumns} rows={invitations} />
        ) : (
          <EmptyState
            title="No pending invitations"
            body="Invitations you send will appear here until they are accepted or expire."
          />
        )}
      </section>
    </main>
  );
}
