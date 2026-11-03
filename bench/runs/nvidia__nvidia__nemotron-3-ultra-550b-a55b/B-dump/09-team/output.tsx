import { useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { DataTable } from "@/components/DataTable";
import { Field } from "@/components/Field";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";

type Member = {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Member" | "Viewer";
  lastActive: string;
  status: "active" | "away";
};

type Invitation = {
  id: string;
  email: string;
  role: "Admin" | "Member" | "Viewer";
  invitedAt: string;
  expiresAt: string;
};

const members: Member[] = [
  { id: "m1", name: "Sarah Chen", email: "sarah@acme.com", role: "Owner", lastActive: "2 minutes ago", status: "active" },
  { id: "m2", name: "Marcus Johnson", email: "marcus@acme.com", role: "Admin", lastActive: "1 hour ago", status: "active" },
  { id: "m3", name: "Priya Patel", email: "priya@acme.com", role: "Member", lastActive: "3 hours ago", status: "active" },
  { id: "m4", name: "James Wilson", email: "james@acme.com", role: "Member", lastActive: "Yesterday", status: "away" },
  { id: "m5", name: "Lisa Park", email: "lisa@acme.com", role: "Viewer", lastActive: "2 days ago", status: "away" },
  { id: "m6", name: "David Kim", email: "david@acme.com", role: "Member", lastActive: "5 days ago", status: "away" },
];

const invitations: Invitation[] = [
  { id: "i1", email: "alex@partner.com", role: "Member", invitedAt: "Mar 12, 2024", expiresAt: "Mar 19, 2024" },
  { id: "i2", email: "jordan@freelance.io", role: "Viewer", invitedAt: "Mar 10, 2024", expiresAt: "Mar 17, 2024" },
];

const roleOptions = ["Admin", "Member", "Viewer"] as const;

export default function TeamPage() {
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"Admin" | "Member" | "Viewer">("Member");
  const [error, setError] = useState("");

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.includes("@")) {
      setError("Enter a valid email address");
      return;
    }
    // In real app: call API
    console.log("Invite sent to", email, "as", role);
    setEmail("");
    setShowInvite(false);
  };

  const memberColumns = [
    { key: "name", header: "Member", render: (row: Member) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-paper-2 flex items-center justify-center font-display text-sm text-ink">
          {row.name.split(" ").map(n => n[0]).join("")}
        </div>
        <div>
          <p className="font-body text-sm text-ink">{row.name}</p>
          <p className="font-body text-xs text-ink-3 font-mono">{row.email}</p>
        </div>
      </div>
    )},
    { key: "role", header: "Role", render: (row: Member) => (
      <Badge tone={row.role === "Owner" ? "accent" : row.role === "Admin" ? "positive" : "neutral"}>
        {row.role}
      </Badge>
    )},
    { key: "lastActive", header: "Last active", align: "right" as const, render: (row: Member) => (
      <span className="font-mono text-xs text-ink-2">{row.lastActive}</span>
    )},
    { key: "status", header: "Status", render: (row: Member) => (
      <span className={`inline-flex items-center gap-1 font-body text-xs ${row.status === "active" ? "text-moss" : "text-ink-3"}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${row.status === "active" ? "bg-moss" : "bg-line"}`} aria-hidden />
        {row.status === "active" ? "Active" : "Away"}
      </span>
    )},
  ];

  const invitationColumns = [
    { key: "email", header: "Email", render: (row: Invitation) => (
      <p className="font-body text-sm text-ink font-mono">{row.email}</p>
    )},
    { key: "role", header: "Role", render: (row: Invitation) => (
      <Badge tone="warning">{row.role}</Badge>
    )},
    { key: "invitedAt", header: "Invited", align: "right" as const, render: (row: Invitation) => (
      <span className="font-mono text-xs text-ink-2">{row.invitedAt}</span>
    )},
    { key: "expiresAt", header: "Expires", align: "right" as const, render: (row: Invitation) => (
      <span className="font-mono text-xs text-brick">{row.expiresAt}</span>
    )},
    { key: "actions", header: "", render: () => (
      <Button variant="ghost" size="sm">Resend</Button>
    )},
  ];

  return (
    <div className="flex min-h-screen bg-paper">
      <aside className="hidden md:block w-64 border-r border-line bg-paper-2 px-4 py-6">
        <nav className="flex flex-col gap-8">
          <span className="font-display text-lg font-semibold text-ink">Almanac</span>
          <ul className="flex flex-col gap-1">
            <li>
              <a href="/dashboard" className="flex items-center justify-between rounded-sm border-l-2 px-3 py-2 font-body text-sm border-transparent text-ink-2 hover:text-ink">
                Dashboard
              </a>
            </li>
            <li>
              <a href="/team" className="flex items-center justify-between rounded-sm border-l-2 px-3 py-2 font-body text-sm border-accent text-ink font-medium" aria-current="page">
                Team
              </a>
            </li>
            <li>
              <a href="/settings" className="flex items-center justify-between rounded-sm border-l-2 px-3 py-2 font-body text-sm border-transparent text-ink-2 hover:text-ink">
                Settings
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      <main className="flex-1 px-6 py-12 md:px-16">
        <PageHeader
          title="Team members"
          description="Manage team access, roles, and pending invitations."
          actions={
            <Button variant="primary" onClick={() => setShowInvite(true)}>
              Invite member
            </Button>
          }
        />

        <div className="flex flex-col gap-8">
          <Card title="Members" action={
            <span className="font-body text-sm text-ink-3">{members.length} members</span>
          }>
            <DataTable columns={memberColumns} rows={members} />
          </Card>

          <Card title="Pending invitations" action={
            invitations.length > 0 ? (
              <span className="font-body text-sm text-ink-3">{invitations.length} pending</span>
            ) : null
          }>
            {invitations.length > 0 ? (
              <DataTable columns={invitationColumns} rows={invitations} />
            ) : (
              <EmptyState
                title="No pending invitations"
                body="Invited members will appear here until they accept."
                action={
                  <Button variant="primary" onClick={() => setShowInvite(true)} size="sm">
                    Invite member
                  </Button>
                }
              />
            )}
          </Card>
        </div>

        {showInvite && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4" onClick={() => setShowInvite(false)}>
            <Card className="w-full max-w-md" onClick={e => e.stopPropagation()}>
              <header className="mb-4 flex items-baseline justify-between gap-4">
                <h2 className="font-display text-lg font-medium text-ink">Invite team member</h2>
                <button onClick={() => setShowInvite(false)} className="text-ink-3 hover:text-ink" aria-label="Close">×</button>
              </header>
              <form onSubmit={handleInvite} className="flex flex-col gap-6">
                <Field
                  label="Email address"
                  type="email"
                  placeholder="colleague@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  hint="We'll send an invitation link to this address"
                  error={error}
                  autoFocus
                />
                <Field
                  label="Role"
                  value={role}
                  onChange={e => setRole(e.target.value as "Admin" | "Member" | "Viewer")}
                  as="select"
                >
                  {roleOptions.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </Field>
                <footer className="flex justify-end gap-3 pt-2 border-t border-line">
                  <Button variant="ghost" type="button" onClick={() => setShowInvite(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit">
                    Send invitation
                  </Button>
                </footer>
              </form>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
