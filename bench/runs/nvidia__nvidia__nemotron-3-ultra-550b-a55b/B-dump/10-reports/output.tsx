import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { SideNav } from "@/components/SideNav";
import { StatTile } from "@/components/StatTile";
import { Badge } from "@/components/Badge";

const monthlyRevenue = [
  { month: "Jan", revenue: 124500, invoices: 42 },
  { month: "Feb", revenue: 138200, invoices: 38 },
  { month: "Mar", revenue: 156800, invoices: 45 },
  { month: "Apr", revenue: 142300, invoices: 41 },
  { month: "May", revenue: 167900, invoices: 48 },
  { month: "Jun", revenue: 189400, invoices: 52 },
  { month: "Jul", revenue: 178600, invoices: 49 },
  { month: "Aug", revenue: 195200, invoices: 54 },
  { month: "Sep", revenue: 201800, invoices: 56 },
  { month: "Oct", revenue: 218700, invoices: 59 },
  { month: "Nov", revenue: 234100, invoices: 62 },
  { month: "Dec", revenue: 256900, invoices: 67 },
];

const topCustomers = [
  { id: "cust-1", name: "Meridian Logistics", revenue: 487500, invoices: 24, avgDays: 18, status: "current" },
  { id: "cust-2", name: "Apex Manufacturing", revenue: 412300, invoices: 19, avgDays: 22, status: "current" },
  { id: "cust-3", name: "Blue Ridge Capital", revenue: 389100, invoices: 16, avgDays: 31, status: "slow" },
  { id: "cust-4", name: "Summit Healthcare", revenue: 356800, invoices: 21, avgDays: 15, status: "current" },
  { id: "cust-5", name: "Pinnacle Retail Group", revenue: 324600, invoices: 18, avgDays: 28, status: "slow" },
  { id: "cust-6", name: "Horizon Tech Solutions", revenue: 298400, invoices: 14, avgDays: 12, status: "current" },
  { id: "cust-7", name: "Cascade Energy", revenue: 276900, invoices: 13, avgDays: 35, status: "overdue" },
  { id: "cust-8", name: "Vanguard Consulting", revenue: 254200, invoices: 11, avgDays: 20, status: "current" },
];

const totalRevenue = monthlyRevenue.reduce((sum, m) => sum + m.revenue, 0);
const totalInvoices = monthlyRevenue.reduce((sum, m) => sum + m.invoices, 0);
const avgDaysToPay = 23;
const yoyGrowth = 18.4;

export default function ReportsPage() {
  return (
    <div className="flex min-h-screen bg-paper">
      <SideNav
        product="Almanac"
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Reports", href: "/reports", active: true },
          { label: "Invoices", href: "/invoices", count: 12 },
          { label: "Customers", href: "/customers" },
          { label: "Settings", href: "/settings" },
        ]}
      />
      <main className="flex-1 px-6 py-12 md:px-16">
        <PageHeader
          title="Reports"
          description="Revenue performance, customer concentration, and collection metrics for the fiscal year."
          actions={
            <Button variant="primary">Export PDF</Button>
          }
        />

        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <StatTile
            label="Total revenue"
            value={`$${totalRevenue.toLocaleString()}`}
            delta={{ value: `${yoyGrowth}%`, direction: "up" }}
            caption="vs prior year"
          />
          <StatTile
            label="Invoices issued"
            value={totalInvoices.toLocaleString()}
            delta={{ value: "12%", direction: "up" }}
            caption="vs prior year"
          />
          <StatTile
            label="Avg days to pay"
            value={avgDaysToPay.toString()}
            delta={{ value: "2 days", direction: "down" }}
            caption="vs prior year"
          />
          <StatTile
            label="Active customers"
            value={topCustomers.length.toString()}
            caption={`${topCustomers.filter(c => c.status === "current").length} current`}
          />
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          <Card title="Revenue by month" className="lg:col-span-2">
            <DataTable
              columns={[
                { key: "month", header: "Month", align: "left" },
                { key: "revenue", header: "Revenue", align: "right", numeric: true, render: (row) => `$${row.revenue.toLocaleString()}` },
                { key: "invoices", header: "Invoices", align: "right", numeric: true },
              ]}
              rows={monthlyRevenue.map((m, i) => ({ id: `month-${i}`, ...m }))}
            />
          </Card>

          <Card title="Collection health">
            <div className="space-y-6">
              <div>
                <div className="flex items-baseline justify-between gap-4 mb-2">
                  <span className="font-display text-3xl font-medium text-ink tabular-nums">{avgDaysToPay}</span>
                  <span className="font-body text-sm text-ink-2">days average</span>
                </div>
                <div className="h-2 bg-line rounded-full overflow-hidden">
                  <div className="h-full bg-moss rounded-full" style={{ width: "72%" }} />
                </div>
                <p className="mt-2 font-body text-sm text-ink-3">Target: ≤ 30 days · 72% of invoices within terms</p>
              </div>
              <div className="border-t border-line pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm text-ink-2">Current (≤ 30 days)</span>
                  <Badge tone="positive">68%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm text-ink-2">Slow (31–60 days)</span>
                  <Badge tone="warning">24%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm text-ink-2">Overdue (> 60 days)</span>
                  <Badge tone="negative">8%</Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <section className="mt-16">
          <header className="mb-6 flex items-baseline justify-between gap-4">
            <h2 className="font-display text-lg font-medium text-ink">Top customers by revenue</h2>
            <Button variant="ghost" size="sm">View all</Button>
          </header>
          <Card>
            <DataTable
              columns={[
                { key: "name", header: "Customer", align: "left" },
                { key: "revenue", header: "Revenue", align: "right", numeric: true, render: (row) => `$${row.revenue.toLocaleString()}` },
                { key: "invoices", header: "Invoices", align: "right", numeric: true },
                { key: "avgDays", header: "Avg days", align: "right", numeric: true },
                { key: "status", header: "Status", align: "left", render: (row) => (
                  <Badge tone={row.status === "current" ? "positive" : row.status === "slow" ? "warning" : "negative"}>
                    {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                  </Badge>
                )},
              ]}
              rows={topCustomers}
            />
          </Card>
        </section>
      </main>
    </div>
  );
}
