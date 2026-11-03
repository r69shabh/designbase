import { Button } from "../playbook/components/Button";
import { PageHeader } from "../playbook/components/PageHeader";
import { StatTile } from "../playbook/components/StatTile";

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-paper px-6 py-12 md:px-16">
      <PageHeader eyebrow="November 2026" title="Overview" actions={<Button variant="primary">New invoice</Button>} />
      <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
        <StatTile label="Revenue" value="$48,210" delta={{ value: "12.4%", direction: "up" }} caption="vs Oct" />
        <StatTile label="Outstanding" value="$9,830" />
      </div>
      <section className="mt-16">
        <h2 className="mb-4 font-display text-lg text-ink">Recent invoices</h2>
        <Button variant="secondary" size="sm">Export</Button>
      </section>
    </main>
  );
}
