import { useState } from "react";
import { SideNav } from "@/components/SideNav";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { DataTable, type Column } from "@/components/DataTable";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";

interface Member {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Member";
  lastActive: string;
  status: "Active" | "Away";
}

interface Invitation {
  id: string;
  email: string;
  role: "Admin" | "Member";
  invitedOn: string;
  status: "Pending";
}

const members: Member[] = [
  { id: "m-01", name: "Ada Okafor", email: "ada@almanac.press", role: "Owner", lastActive: "2026-02-14 09:41", status: "Active" },
  { id: "m-02", name: "Jonas Lindqvist", email: "jonas@almanac.press", role: "Admin", lastActive: "2026-02-14 08:12", status: "Active" },
  { id: "m-03", name: "Priya Raman", email: "priya@almanac.press", role: "Admin", lastActive: "2026-02-13 17:58", status: "Active" },
  { id: "m-04", name: "Tomás Herrera", email: "tomas@almanac.press", role: "Member", lastActive: "2026-02-13 15:03", status: "Active" },
  { id: "m-05", name: "Marta Kowalska", email: "marta@almanac.press", role: "Member", lastActive: "2026-02-11 11:26", status: "Away" },
  { id: "m-06", name: "Devon Carter", email: "devon@almanac.press", role: "Member", lastActive: "2026-02-10 16:44", status: "Away" },
];

const invitations: Invitation[] = [
  { id: "i-01", email: "lena@almanac.press", role: "Member", invitedOn: "2026-02-13", status: "Pending" },
  { id: "i-02", email: "omar@almanac.press", role: "Admin", invitedOn: "2026-02-12", status: "Pending" },
  { id: "i-03", email: "sofia@almanac.press", role: "Member", invitedOn: "2026-02-09", status: "Pending" },
];

const roleTone: Record<Member["role"], "accent" | "neutral"> = {
  Owner: "accent",
  Admin: "neutral",
  Member: "neutral",
};

const memberColumns: Column<Member>[] = [
  { key: "name", header: "Name" },
  { key: "email", header: "Email", render: (row) => <span className="font-mono text-xs text-ink-2">{row.email}</span> },
  { key: "role", header: "Role", render: (row) => <Badge tone={roleTone[row.role]}>{row.role}</Badge> },
  { key: "lastActive", header: "Last active", render: (row) => <span className="font-mono text-xs text-ink-2">{row.lastActive}</span> },
  { key: "status", header: "Status", render: (row) => <Badge tone={row.status === "Active" ? "positive" : "neutral"}>{row.status}</Badge> },
];

const invitationColumns: Column<Invitation>[] = [
  { key: "email", header: "Email", render: (row) => <span className="font-mono text-xs text-ink-2">{row.email}</span> },
  { key: "role", header: "Role", render: (row) => <Badge tone="neutral">{row.role}</Badge> },
  { key: "invitedOn", header: "Invited on", render: (row) => <span className="font-mono text-xs text-ink-2">{row.invitedOn}</span> },
  { key: "status", header: "Status", render: (row) => <Badge tone="warning">{row.status}</Badge> },
  {
    key: "id",
    header: "Actions",
    align: "right",
    render: () => <Button variant="ghost" size="sm">Revoke</Button>,
  },
];

export default function TeamMembersPage() {
  const [email, setEmail] = useState("");

  return (
    <div className="flex min-h-screen bg-paper">
      <SideNav
        product="Almanac"
        items={[
          { label: "Overview", href: "#" },
          { label: "Members", href: "#", active: true, count: members.length },
          { label: "Projects", href: "#", count: 12 },
          { label: "Billing", href: "#" },
          { label: "Settings", href: "#" },
        ]}
      />
      <main className="flex-1 px-6 py-12 md:px-16">
        <PageHeader
          eyebrow="Team"
          title="Members"
          description="Everyone with access to this workspace, plus outstanding invitations."
        />

        <Card title="Invite someone by email" className="max-w-2xl">
          <form
            className="flex flex-col gap-4 md:flex-row md:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              setEmail("");
            }}
          >
            <Field
              label="Email address"
              type="email"
              required
              placeholder="name@company.com"
              hint="They will receive an invitation to join this workspace."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <Button variant="primary" type="submit">Send invitation</Button>
          </form>
        </Card>

        <section className="mt-16">
          <h2 className="mb-4 font-display text-lg font-medium text-ink">Members</h2>
          <DataTable columns={memberColumns} rows={members} />
        </section>

        <section className="mt-16">
          <h2 className="mb-4 font-display text-lg font-medium text-ink">Pending invitations</h2>
          <DataTable columns={invitationColumns} rows={invitations} />
        </section>
      </main>
    </div>
  );
}
