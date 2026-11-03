import { useState } from "react";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  lastActive: string;
  status: "active" | "away";
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  sentAt: string;
  expiresAt: string;
  status: "pending" | "expired";
}

const sampleMembers: Member[] = [
  { id: "1", name: "Avery Chen", email: "avery@almanac.dev", role: "Owner", lastActive: "2 hours ago", status: "active" },
  { id: "2", name: "Marcus Webb", email: "marcus@almanac.dev", role: "Admin", lastActive: "Yesterday", status: "active" },
  { id: "3", name: "Priya Sharma", email: "priya@almanac.dev", role: "Editor", lastActive: "3 days ago", status: "away" },
  { id: "4", name: "Jordan Kim", email: "jordan@almanac.dev", role: "Viewer", lastActive: "Last week", status: "away" },
  { id: "5", name: "Sam Rivera", email: "sam@almanac.dev", role: "Editor", lastActive: "5 minutes ago", status: "active" },
];

const sampleInvitations: Invitation[] = [
  { id: "inv-1", email: "new.designer@almanac.dev", role: "Editor", sentAt: "Mar 12, 2025", expiresAt: "Mar 19, 2025", status: "pending" },
  { id: "inv-2", email: "contractor@external.com", role: "Viewer", sentAt: "Mar 5, 2025", expiresAt: "Mar 12, 2025", status: "expired" },
];

const memberColumns = [
  { key: "name", header: "Member", align: "left" as const },
  { key: "email", header: "Email", align: "left" as const },
  { key: "role", header: "Role", align: "left" as const },
  { key: "lastActive", header: "Last active", align: "right" as const },
];

const invitationColumns = [
  { key: "email", header: "Email", align: "left" as const },
  { key: "role", header: "Role", align: "left" as const },
  { key: "sentAt", header: "Sent", align: "left" as const },
  { key: "expiresAt", header: "Expires", align: "right" as const },
];

export default function TeamMembersPage() {
  const [search, setSearch] = useState("");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Editor");
  const [inviteError, setInviteError] = useState("");

  const filteredMembers = sampleMembers.filter(
    (m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      setInviteError("Email is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      setInviteError("Enter a valid email address");
      return;
    }
    console.log("Invite sent to:", inviteEmail, "as", inviteRole);
    setInviteEmail("");
    setInviteRole("Editor");
    setShowInviteForm(false);
    setInviteError("");
  };

  return (
    <main className="px-6 py-12 md:px-16">
      <PageHeader
        title="Team members"
        description="Manage team access, roles, and pending invitations."
        actions={
          <Button variant="primary" onClick={() => setShowInviteForm(true)}>
            Invite member
          </Button>
        }
      />

      <div className="mb-6">
        <Field
          label="Search members"
          placeholder="Filter by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <section className="mb-12" aria-labelledby="members-heading">
        <h2 id="members-heading" className="font-display text-lg font-medium text-ink mb-4">
          Active members
        </h2>
        {filteredMembers.length > 0 ? (
          <DataTable<Member>
            columns={memberColumns}
            rows={filteredMembers}
          />
        ) : (
          <EmptyState
            title="No members found"
            body="Try adjusting your search or invite a new team member."
            action={<Button variant="secondary" onClick={() => setShowInviteForm(true)}>Invite member</Button>}
          />
        )}
      </section>

      <section className="mb-12" aria-labelledby="invitations-heading">
        <h2 id="invitations-heading" className="font-display text-lg font-medium text-ink mb-4">
          Pending invitations
        </h2>
        {sampleInvitations.length > 0 ? (
          <DataTable<Invitation>
            columns={invitationColumns}
            rows={sampleInvitations}
          />
        ) : (
          <EmptyState
            title="No pending invitations"
            body="Invitations you send will appear here until they are accepted or expire."
          />
        )}
      </section>

      {showInviteForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" role="dialog" aria-modal="true" aria-labelledby="invite-title">
          <div className="w-full max-w-md bg-paper border border-line rounded-md p-6">
            <h3 id="invite-title" className="font-display text-xl font-medium text-ink mb-4">Invite team member</h3>
            <form onSubmit={handleInvite} className="space-y-4">
              <Field
                label="Email address"
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                error={inviteError}
                autoFocus
              />
              <div className="flex flex-col gap-2">
                <label htmlFor="invite-role" className="font-body text-sm font-medium text-ink">Role</label>
                <select
                  id="invite-role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="h-12 rounded-md border border-line bg-paper px-3 font-body text-base text-ink appearance-none focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-accent"
                >
                  <option value="Owner">Owner</option>
                  <option value="Admin">Admin</option>
                  <option value="Editor">Editor</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" type="button" onClick={() => { setShowInviteForm(false); setInviteError(""); }}>Cancel</Button>
                <Button variant="secondary" type="submit">Send invitation</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
