import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { StatTile } from "@/components/StatTile";
import { DataTable } from "@/components/DataTable";
import { Card } from "@/components/Card";
import { SideNav } from "@/components/SideNav";

export default function Dashboard() {
  // Sample data
  const invoices = [
    {
      id: "inv-001",
      number: "INV‑001",
      customer: "Acme Corp",
      amount: "$1,200.00",
      status: "Paid",
      due: "2024‑10‑01",
    },
    {
      id: "inv-002",
      number: "INV‑002",
      customer: "Beta LLC",
      amount: "$850.00",
      status: "Pending",
      due: "2024‑10‑05",
    },
    {
      id: "inv-003",
      number: "INV‑003",
      customer: "Gamma Co",
      amount: "$2,400.00",
      status: "Overdue",
      due: "2024‑09‑28",
    },
  ];

  const activity = [
    "Created invoice INV‑004 for Delta Inc.",
    "Received payment for INV‑001.",
    "Sent reminder for INV‑003.",
    "Added new customer: Epsilon Ltd.",
  ];

  const navItems = [
    { label: "Dashboard", href: "#", active: true },
    { label: "Invoices", href: "#" },
    { label: "Customers", href: "#" },
    { label: "Reports", href: "#" },
  ];

  const invoiceColumns = [
    { key: "number", header: "Invoice", align: "left" as const },
    { key: "customer", header: "Customer", align: "left" as const },
    { key: "amount", header: "Amount", align: "right" as const, numeric: true },
    {
      key: "status",
      header: "Status",
      align: "left" as const,
      render: (row: typeof invoices[0]) => {
        const tone = row.status === "Paid" ? "positive" : row.status === "Pending" ? "warning" : "negative";
        return <Badge tone={tone}>{row.status}</Badge>;
      },
    },
    { key: "due", header: "Due date", align: "left" as const },
  ];

  return (
    <div className="flex min-h-screen bg-paper font-body text-ink">
      <SideNav product="InvoicePro" items={navItems} />
      <main className="flex-1 px-6 py-12 md:px-16">
        <PageHeader
          title="Dashboard"
          description="Overview of your invoicing activity."
          actions={<Button variant="primary">New invoice</Button>}
        />

        {/* Stat tiles */}
        <section className="mt-8 flex flex-wrap gap-8">
          <StatTile
            label="Monthly revenue"
            value="$12,340"
            delta={{ value: "5 %", direction: "up" }}
            caption="vs. last month"
          />
          <StatTile
            label="Outstanding balance"
            value="$2,150"
            delta={{ value: "2 %", direction: "down" }}
            caption="vs. last month"
          />
          <StatTile
            label="On‑time payment rate"
            value="94 %"
            delta={{ value: "1 %", direction: "up" }}
            caption="vs. last month"
          />
          <StatTile label="Customers" value="128" caption="total active" />
        </section>

        {/* Weekly collections chart */}
        <section className="mt-12">
          <h2 className="font-display text-xl text-ink-2">Weekly collections</h2>
          <Card className="mt-4">
            <div className="border border-line rounded-md h-48 flex items-center justify-center text-ink-3 text-sm">
              {/* Placeholder for chart */}
              Weekly collections chart
            </div>
          </Card>
        </section>

        {/* Recent activity */}
        <section className="mt-12">
          <h2 className="font-display text-xl text-ink-2">Recent activity</h2>
          <Card className="mt-4 p-4">
            <ul className="space-y-2 text-sm text-ink-2">
              {activity.map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>
          </Card>
        </section>

        {/* Recent invoices table */}
        <section className="mt-12">
          <h2 className="font-display text-xl text-ink-2">Recent invoices</h2>
          <div className="mt-4">
            <DataTable columns={invoiceColumns} rows={invoices} />
          </div>
        </section>
      </main>
    </div>
  );
}

/* Helper Badge component (outline pill) */
function Badge({ tone = "neutral", children }: { tone?: "neutral" | "positive" | "warning" | "negative" | "accent"; children: React.ReactNode }) {
  const colors: Record<string, string> = {
    neutral: "text-ink-2 border-ink-2",
    positive: "text-moss border-moss",
    warning: "text-ochre border-ochre",
    negative: "text-brick border-brick",
    accent: "text-accent border-accent",
  };
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-body ${colors[tone]}`}>
      {children}
    </span>
  );
}
