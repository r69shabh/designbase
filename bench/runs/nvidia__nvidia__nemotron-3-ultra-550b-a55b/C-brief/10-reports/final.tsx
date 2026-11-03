import type { ReactNode } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { StatTile } from "@/components/StatTile";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/Badge";

const monthlyRevenue = [
  { month: "Jan", revenue: 124500, invoices: 42, paid: 38, overdue: 4 },
  { month: "Feb", revenue: 118200, invoices: 38, paid: 35, overdue: 3 },
  { month: "Mar", revenue: 142800, invoices: 45, paid: 41, overdue: 4 },
  { month: "Apr", revenue: 135600, invoices: 41, paid: 39, overdue: 2 },
  { month: "May", revenue: 151200, invoices: 48, paid: 44, overdue: 4 },
  { month: "Jun", revenue: 139800, invoices: 43, paid: 40, overdue: 3 },
  { month: "Jul", revenue: 128900, invoices: 39, paid: 36, overdue: 3 },
  { month: "Aug", revenue: 145300, invoices: 44, paid: 41, overdue: 3 },
  { month: "Sep", revenue: 156700, invoices: 47, paid: 43, overdue: 4 },
  { month: "Oct", revenue: 149200, invoices: 45, paid: 42, overdue: 3 },
  { month: "Nov", revenue: 162400, invoices: 49, paid: 45, overdue: 4 },
  { month: "Dec", revenue: 171800, invoices: 52, paid: 48, overdue: 4 },
];

const topCustomers = [
  { name: "Apex Manufacturing", revenue: 284500, invoices: 24, avgDays: 28, status: "current" },
  { name: "Meridian Logistics", revenue: 198200, invoices: 18, avgDays: 35, status: "current" },
  { name: "Summit Healthcare", revenue: 167800, invoices: 15, avgDays: 42, status: "watch" },
  { name: "Cedar Construction", revenue: 145600, invoices: 22, avgDays: 31, status: "current" },
  { name: "Harbor Freight Co", revenue: 132400, invoices: 19, avgDays: 48, status: "overdue" },
  { name: "Pine Ridge Distributors", revenue: 118900, invoices: 16, avgDays: 29, status: "current" },
  { name: "Valley Tech Solutions", revenue: 105300, invoices: 14, avgDays: 33, status: "current" },
  { name: "Blue Ridge Materials", revenue: 98700, invoices: 12, avgDays: 55, status: "overdue" },
];

const totalRevenue = monthlyRevenue.reduce((sum, m) => sum + m.revenue, 0);
const totalInvoices = monthlyRevenue.reduce((sum, m) => sum + m.invoices, 0);
const avgDaysToPay = 34;
const overdueCount = monthlyRevenue.reduce((sum, m) => sum + m.overdue, 0);

const formatCurrency = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

const statusTone: Record<string, "neutral" | "positive" | "warning" | "negative" | "accent"> = {
  current: "positive",
  watch: "warning",
  overdue: "negative",
};

export default function ReportsPage() {
  const exportAction = (
    <Button variant="primary" size="md">
      Export report
    </Button>
  );

  const revenueColumns = [
    { key: "month", header: "Month", align: "left" as const },
    { key: "revenue", header: "Revenue", align: "right" as const, numeric: true, render: (v: number) => <span className="font-mono tabular-nums">{formatCurrency(v)}</span> },
    { key: "invoices", header: "Invoices", align: "right" as const, numeric: true, render: (v: number) => <span className="font-mono tabular-nums">{v}</span> },
    { key: "paid", header: "Paid", align: "right" as const, numeric: true, render: (v: number) => <span className="font-mono tabular-nums text-moss">{v}</span> },
    { key: "overdue", header: "Overdue", align: "right" as const, numeric: true, render: (v: number) => <span className="font-mono tabular-nums text-brick">{v}</span> },
  ];

  const customerColumns = [
    { key: "name", header: "Customer", align: "left" as const },
    { key: "revenue", header: "Revenue", align: "right" as const, numeric: true, render: (v: number) => <span className="font-mono tabular-nums">{formatCurrency(v)}</span> },
    { key: "invoices", header: "Invoices", align: "right" as const, numeric: true, render: (v: number) => <span className="font-mono tabular-nums">{v}</span> },
    { key: "avgDays", header: "Avg days to pay", align: "right" as const, numeric: true, render: (v: number) => <span className="font-mono tabular-nums">{v}</span> },
    { key: "status", header: "Status", align: "left" as const, render: (v: string) => <Badge tone={statusTone[v]}>{v.charAt(0).toUpperCase() + v.slice(1)}</Badge> },
  ];

  return (
    <main className="bg-paper min-h-screen px-6 py-12 md:px-16">
      <PageHeader
        eyebrow="FY 2024"
        title="Reports"
        description="Revenue performance, customer concentration, and collection metrics for the fiscal year."
        actions={exportAction}
      />

      <div className="grid gap-8 md:grid-cols-4 mb-12">
        <StatTile label="Total revenue" value={formatCurrency(totalRevenue)} delta={{ value: "12.3%", direction: "up" }} caption="vs prior year" />
        <StatTile label="Invoices issued" value={totalInvoices.toLocaleString()} delta={{ value: "8.1%", direction: "up" }} caption="vs prior year" />
        <StatTile label="Avg days to pay" value={`${avgDaysToPay} days`} delta={{ value: "2 days", direction: "down" }} caption="vs prior year" />
        <StatTile label="Overdue invoices" value={overdueCount.toString()} delta={{ value: "3", direction: "up" }} caption="this month" />
      </div>

      <section className="mb-12">
        <h2 className="font-display text-xl font-medium text-ink mb-6">Revenue by month</h2>
        <div className="overflow-x-auto">
          <DataTable columns={revenueColumns} rows={monthlyRevenue} />
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl font-medium text-ink mb-6">Top customers by revenue</h2>
        <div className="overflow-x-auto">
          <DataTable columns={customerColumns} rows={topCustomers} />
        </div>
      </section>
    </main>
  );
}
