import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { StatTile } from "@/components/StatTile";
import { DataTable } from "@/components/DataTable";
import type { Column } from "@/components/DataTable";

interface MonthlyRevenue {
  month: string;
  revenue: number;
  invoices: number;
  change: number;
}

interface TopCustomer {
  name: string;
  email: string;
  revenue: number;
  invoices: number;
  avgDaysToPay: number;
}

const monthlyData: MonthlyRevenue[] = [
  { month: "Jan 2024", revenue: 124500, invoices: 42, change: 12.3 },
  { month: "Feb 2024", revenue: 118200, invoices: 38, change: -5.1 },
  { month: "Mar 2024", revenue: 142800, invoices: 47, change: 20.8 },
  { month: "Apr 2024", revenue: 135600, invoices: 44, change: -5.0 },
  { month: "May 2024", revenue: 156900, invoices: 51, change: 15.7 },
  { month: "Jun 2024", revenue: 148300, invoices: 49, change: -5.5 },
  { month: "Jul 2024", revenue: 167200, invoices: 54, change: 12.7 },
  { month: "Aug 2024", revenue: 159800, invoices: 52, change: -4.4 },
  { month: "Sep 2024", revenue: 173400, invoices: 56, change: 8.5 },
  { month: "Oct 2024", revenue: 181600, invoices: 58, change: 4.7 },
  { month: "Nov 2024", revenue: 169200, invoices: 55, change: -6.8 },
  { month: "Dec 2024", revenue: 195800, invoices: 62, change: 15.7 },
];

const customerData: TopCustomer[] = [
  { name: "Acme Corporation", email: "billing@acme.com", revenue: 284500, invoices: 24, avgDaysToPay: 18 },
  { name: "Globex Industries", email: "ap@globex.io", revenue: 198200, invoices: 18, avgDaysToPay: 22 },
  { name: "Wayne Enterprises", email: "finance@wayne.com", revenue: 167800, invoices: 15, avgDaysToPay: 14 },
  { name: "Stark Industries", email: "accounting@stark.com", revenue: 145600, invoices: 12, avgDaysToPay: 28 },
  { name: "Umbrella Corp", email: "payables@umbrella.net", revenue: 132400, invoices: 11, avgDaysToPay: 31 },
  { name: "Wonka Industries", email: "billing@wonka.com", revenue: 118900, invoices: 10, avgDaysToPay: 16 },
  { name: "Cyberdyne Systems", email: "ap@cyberdyne.ai", revenue: 105300, invoices: 9, avgDaysToPay: 24 },
  { name: "Massive Dynamic", email: "finance@massivedynamic.com", revenue: 98700, invoices: 8, avgDaysToPay: 19 },
];

const totalRevenue = monthlyData.reduce((sum, m) => sum + m.revenue, 0);
const totalInvoices = monthlyData.reduce((sum, m) => sum + m.invoices, 0);
const avgDaysToPay = Math.round(customerData.reduce((sum, c) => sum + c.avgDaysToPay, 0) / customerData.length);
const avgRevenuePerInvoice = Math.round(totalRevenue / totalInvoices);

const monthlyColumns: Column<MonthlyRevenue>[] = [
  { key: "month", header: "Month", align: "left" },
  { key: "revenue", header: "Revenue", align: "right", numeric: true, render: (v) => `$${(v as number).toLocaleString()}` },
  { key: "invoices", header: "Invoices", align: "right", numeric: true },
  { key: "change", header: "MoM Change", align: "right", numeric: true, render: (v) => {
    const val = typeof v === "number" ? v : 0;
    return `${val > 0 ? "+" : ""}${val.toFixed(1)}%`;
  }},
];

const customerColumns: Column<TopCustomer>[] = [
  { key: "name", header: "Customer", align: "left" },
  { key: "email", header: "Email", align: "left", render: (v) => <span className="text-xs text-ink-3 font-mono">{v as string}</span> },
  { key: "revenue", header: "Revenue", align: "right", numeric: true, render: (v) => `$${(v as number).toLocaleString()}` },
  { key: "invoices", header: "Invoices", align: "right", numeric: true },
  { key: "avgDaysToPay", header: "Avg Days to Pay", align: "right", numeric: true, render: (v) => `${v} days` },
];

export default function ReportsPage() {
  return (
    <main className="bg-paper min-h-screen px-6 py-12 md:px-16">
      <PageHeader
        title="Reports"
        description="Revenue overview, top customers, and payment performance for the current year."
        actions={
          <Button variant="primary" size="md">
            Export report
          </Button>
        }
      />

      <div className="grid gap-8 md:grid-cols-4 mb-12">
        <StatTile
          label="Total revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          delta={{ value: "18.2%", direction: "up" }}
          caption="vs prior year"
        />
        <StatTile
          label="Total invoices"
          value={totalInvoices.toLocaleString()}
          delta={{ value: "12", direction: "up" }}
          caption="vs prior year"
        />
        <StatTile
          label="Avg revenue / invoice"
          value={`$${avgRevenuePerInvoice.toLocaleString()}`}
          delta={{ value: "5.4%", direction: "up" }}
          caption="vs prior year"
        />
        <StatTile
          label="Avg days to pay"
          value={`${avgDaysToPay} days`}
          delta={{ value: "3 days", direction: "down" }}
          caption="vs prior year"
        />
      </div>

      <section className="mb-12" aria-labelledby="monthly-revenue-heading">
        <h2 id="monthly-revenue-heading" className="font-display text-lg font-medium text-ink mb-6">
          Revenue by month
        </h2>
        <div className="overflow-x-auto rounded-md border border-line">
          <DataTable columns={monthlyColumns} rows={monthlyData} />
        </div>
      </section>

      <section aria-labelledby="top-customers-heading">
        <h2 id="top-customers-heading" className="font-display text-lg font-medium text-ink mb-6">
          Top customers by revenue
        </h2>
        <div className="overflow-x-auto rounded-md border border-line">
          <DataTable columns={customerColumns} rows={customerData} />
        </div>
      </section>
    </main>
  );
}
