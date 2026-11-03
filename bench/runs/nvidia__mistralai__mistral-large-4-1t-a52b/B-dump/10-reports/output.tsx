import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { DataTable, type Column } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { SideNav } from "@/components/SideNav";
import { StatTile } from "@/components/StatTile";

interface MonthlyRevenue {
  id: string;
  month: string;
  revenue: number;
  change: number | null;
}

interface CustomerRevenue {
  id: string;
  customer: string;
  invoices: number;
  revenue: number;
}

const monthlyRevenue: MonthlyRevenue[] = [
  { id: "jan", month: "January", revenue: 84200, change: null },
  { id: "feb", month: "February", revenue: 91500, change: 8.7 },
  { id: "mar", month: "March", revenue: 88900, change: -2.8 },
  { id: "apr", month: "April", revenue: 96300, change: 8.3 },
  { id: "may", month: "May", revenue: 102750, change: 6.7 },
  { id: "jun", month: "June", revenue: 98400, change: -4.2 },
  { id: "jul", month: "July", revenue: 110200, change: 12.0 },
  { id: "aug", month: "August", revenue: 117600, change: 6.7 },
  { id: "sep", month: "September", revenue: 109800, change: -6.6 },
  { id: "oct", month: "October", revenue: 124900, change: 13.8 },
  { id: "nov", month: "November", revenue: 131200, change: 5.0 },
  { id: "dec", month: "December", revenue: 128500, change: -2.1 },
];

const topCustomers: CustomerRevenue[] = [
  { id: "c1", customer: "Meridian Logistics", invoices: 24, revenue: 212400 },
  { id: "c2", customer: "Halcyon Foods", invoices: 31, revenue: 186900 },
  { id: "c3", customer: "Northwind Studio", invoices: 18, revenue: 154200 },
  { id: "c4", customer: "Beaumont & Co.", invoices: 12, revenue: 121750 },
  { id: "c5", customer: "Copperline Hotels", invoices: 9, revenue: 98300 },
];

const monthlyColumns: Column<MonthlyRevenue>[] = [
  { key: "month", header: "Month" },
  {
    key: "revenue",
    header: "Revenue",
    align: "right",
    numeric: true,
    render: (row) => `$${row.revenue.toLocaleString("en-US")}`,
  },
  {
    key: "change",
    header: "MoM",
    align: "right",
    numeric: true,
    render: (row) =>
      row.change === null ? (
        <span className="text-ink-3">—</span>
      ) : (
        <span className={row.change >= 0 ? "text-moss" : "text-brick"}>
          {`${row.change > 0 ? "+" : ""}${row.change}%`}
        </span>
      ),
  },
];

const customerColumns: Column<CustomerRevenue>[] = [
  { key: "customer", header: "Customer" },
  { key: "invoices", header: "Invoices", align: "right", numeric: true },
  {
    key: "revenue",
    header: "Revenue",
    align: "right",
    numeric: true,
    render: (row) => `$${row.revenue.toLocaleString("en-US")}`,
  },
];

export default function ReportsPage() {
  return (
    <div className="flex min-h-screen bg-paper">
      <SideNav
        product="Almanac"
        items={[
          { label: "Overview", href: "/" },
          { label: "Reports", href: "/reports", active: true },
          { label: "Customers", href: "/customers", count: 148 },
          { label: "Invoices", href: "/invoices", count: 14 },
          { label: "Settings", href: "/settings" },
        ]}
      />
      <main className="flex-1 px-6 py-12 md:px-16">
        <PageHeader
          eyebrow="Reports"
          title="Revenue report"
          description="Revenue by month for 2025, top customers by revenue, and average payment terms across all invoices."
          actions={<Button variant="primary">Export CSV</Button>}
        />

        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <StatTile
            label="Total revenue, 2025"
            value="$1,284,250"
            delta={{ value: "12.4%", direction: "up" }}
            caption="vs 2024"
          />
          <StatTile label="Average days to pay" value="32" caption="Target 30 days" />
          <StatTile
            label="Active customers"
            value="148"
            delta={{ value: "6", direction: "up" }}
            caption="new this year"
          />
          <StatTile label="Outstanding" value="$96,300" caption="Across 14 invoices" />
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          <Card
            title="Revenue by month"
            action={<Badge tone="neutral">2025</Badge>}
            className="lg:col-span-2"
          >
            <DataTable columns={monthlyColumns} rows={monthlyRevenue} />
          </Card>
          <Card title="Top customers" action={<Badge tone="neutral">Top 5</Badge>}>
            <DataTable columns={customerColumns} rows={topCustomers} />
          </Card>
        </div>
      </main>
    </div>
  );
}
