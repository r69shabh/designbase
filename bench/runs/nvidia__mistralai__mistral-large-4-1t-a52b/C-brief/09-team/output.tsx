import type { Column } from "@/components/DataTable";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { Field } from "@/components/Field";
import { PageHeader } from "@/components/PageHeader";
import { SideNav } from "@/components/SideNav";

type Role = "Owner" | "Admin" | "Editor" | "Viewer";

interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  lastActive: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  invited: string;
  status: string;
  actions?: string;
}

const members: Member[] = [
  { id: "m-01", name: "Ada Lovelace", email: "ada@fieldnotes.co", role: "Owner", lastActive: "Mar 12, 2025" },
  { id: "m-02", name: "Grace Hopper", email: "grace@fieldnotes.co", role: "Admin", lastActive: "Mar 11, 2025" },
  { id: "m-03", name: "Alan Turing", email: "alan@fieldnotes.co", role: "Editor", lastActive: "Mar 9, 2025" },
  { id: "m-04", name: "Katherine Johnson", email: "katherine@fieldnotes.co", role: "Editor", lastActive: "Mar 8, 2025" },
  { id: "m-05", name: "Edsger Dijkstra", email: "edsger@fieldnotes.co", role: "Viewer", lastActive: "Feb 27, 2025" },
  { id: "m-06", name: "Mary Jackson", email: "mary@fieldnotes.co", role: "Viewer", lastActive: "Feb 20, 2025" },
];

const invitations: Invitation[] = [
  { id: "i-01", email: "sam.okafor@example.com", role: "Editor", invited: "Mar 10, 2025", status: "Pending" },
  { id: "i-02", email: "priya.nair@example.com", role: "Viewer", invited: "Mar 6, 2025", status: "Pending" },
  { id: "i-03", email: "jonas.meyer@example.com", role: "Admin", invited: "Feb 28, 2025", status: "Pending" },
];

const roleTone: Record<Role, "accent" | "neutral"> = {
  Owner: "accent",
  Admin: "neutral",
  Editor: "neutral",
  Viewer: "neutral",
};

const memberColumns: Column<Member>[] = [
  {
    key: "name",
    header: "Member",
    render: (row) => (
      <span className="flex flex-col gap-1">
        <span className="font-medium text-ink">{row.name}</span>
        <span className="text-xs text-ink-3">{row.email}</span>
      </span>
    ),
  },
  {
    key: "role",
    header: "Role",
    render: (row) => <Badge tone={roleTone[row.role]}>{row.role}</Badge>,
  },
  {
    key: "lastActive",
    header: "Last active",
    align: "right",
    numeric: true,
  },
];

const invitationColumns: Column<Invitation>[] = [
  { key: "email", header: "Email" },
  { key: "role", header: "Role" },
  { key: "invited", header: "Invited", align: "right", numeric: true },
  {
    key: "status",
    header: "Status",
    render: (row) => <Badge tone="warning">{row.status}</Badge>,
  },
  {
    key: "actions",
    header: "",
    align: "right",
    render: () => (
      <span className="flex justify-end gap-2">
        <Button variant="ghost" size="sm">Resend</Button>
        <Button variant="danger" size="sm">Revoke</Button>
      </span>
    ),
  },
];

export default function TeamMembersPage() {
  return (
    <div className="min-h-screen bg-paper font-body text-ink md:flex">
      <SideNav
        product="Almanac"
        items={[
          { label: "Overview", href: "#" },
          { label: "Entries", href: "#" },
          { label: "Team members", href: "#", active: true, count: members.length },
          { label: "Billing", href: "#" },
          { label: "Settings", href: "#" },
        ]}
      />
      <main className="flex-1 px-6 py-12 md:px-16">
        <PageHeader
          eyebrow="Settings"
          title="Team members"
          description="Everyone with access to this workspace, plus invitations waiting to be accepted."
          actions={<Button variant="secondary">Export list</Button>}
        />

        <section className="rounded-md border border-line p-6" aria-labelledby="invite-heading">
          <div className="mb-6 flex flex-col gap-2">
            <h2 id="invite-heading" className="font-display text-lg font-medium text-ink">Invite by email</h2>
            <p className="max-w-prose font-body text-sm text-ink-2">
              Send an invitation to join this workspace. They will receive an email with a sign-in link.
            </p>
          </div>
          <form
            className="flex flex-col gap-4 md:flex-row md:items-end"
            onSubmit={(event) => event.preventDefault()}
          >
            <Field
              className="flex-1"
              label="Email address"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="name@company.com"
              hint="One invitation per email. You can revoke it any time before it is accepted."
              required
            />
            <Button variant="primary" type="submit">Send invitation</Button>
          </form>
        </section>

        <section className="mt-12" aria-labelledby="members-heading">
          <div className="mb-6 flex items-baseline gap-3">
            <h2 id="members-heading" className="font-display text-xl font-medium text-ink">Members</h2>
            <span className="font-mono text-sm text-ink-3">{members.length}</span>
          </div>
          {members.length ? (
            <DataTable columns={memberColumns} rows={members} />
          ) : (
            <EmptyState
              title="No members yet"
              body="Invite your first teammate by email and they will appear here."
              action={<Button variant="secondary">Invite by email</Button>}
            />
          )}
        </section>

        <section className="mt-12" aria-labelledby="invitations-heading">
          <div className="mb-6 flex items-baseline gap-3">
            <h2 id="invitations-heading" className="font-display text-xl font-medium text-ink">Pending invitations</h2>
            <span className="font-mono text-sm text-ink-3">{invitations.length}</span>
          </div>
          {invitations.length ? (
            <DataTable columns={invitationColumns} rows={invitations} />
          ) : (
            <EmptyState
              title="No pending invitations"
              body="Invitations you send by email will appear here until they are accepted or revoked."
              action={<Button variant="secondary">Invite by email</Button>}
            />
          )}
        </section>
      </main>
    </div>
  );
}
