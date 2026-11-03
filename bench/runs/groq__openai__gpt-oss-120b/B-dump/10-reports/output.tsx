import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { StatTile } from "@/components/StatTile";
import { DataTable, Column } from "@/components/DataTable";
import { Button } from "@/components/Button";

type RevenueMonth = {
  id: string;
  month: string;
  revenue: number;
};

type Customer = {
  id: string;
  name: string;
  revenue: number;
};

export default function ReportsPage() {
  // Sample data
  const revenueByMonth: RevenueMonth[] = [
    { id: "1", month: "Jan", revenue: 12450 },
    { id: "2", month: "Feb", revenue: 13820 },
    { id: "3", month: "Mar", revenue: 15230 },
    { id: "4", month: "Apr", revenue: 16740 },
    { id: "5", month: "May", revenue: 15980 },
    { id: "6", month: "Jun", revenue: 17420 },
    { id: "7", month: "Jul", revenue: 18210 },
    { id: "8", month: "Aug", revenue: 19000 },
    { id: "9", month: "Sep", revenue: 17650 },
    { id: "10", month: "Oct", revenue: 18540 },
    { id: "11", month: "Nov", revenue: 19320 },
    { id: "12", month: "Dec", revenue: 20780 },
  ];

  const topCustomers: Customer[] = [
    { id: "c1", name: "Acme Corp", revenue: 45200 },
    { id: "c2", name: "Beta LLC", revenue: 38100 },
    { id: "c3", name: "Gamma Co", revenue: 32750 },
    { id: "c4", name: "Delta Inc", revenue: 29800 },
    { id: "c5", name: "Epsilon Ltd", revenue: 27410 },
  ];

  const totalRevenue = revenueByMonth.reduce((sum, r) => sum + r.revenue, 0);
  const avgDaysToPay = 27; // sample static value

  // Columns for tables
  const monthColumns: Column<RevenueMonth>[] = [
    { key: "month", header: "Month", align: "left" },
    {
      key: "revenue",
      header: "Revenue",
      align: "right",
      numeric: true,
      render: (row) => `$${row.revenue.toLocaleString()}`,
    },
  ];

  const customerColumns: Column<Customer>[] = [
    { key: "name", header: "Customer", align: "left" },
    {
      key: "revenue",
      header: "Revenue",
      align: "right",
      numeric: true,
      render: (row) => `$${row.revenue.toLocaleString()}`,
    },
  ];

  return (
    <main className="min-h-screen bg-paper px-6 py-12 md:px-16">
      <PageHeader
        title="Revenue reports"
        description="Overview of revenue performance for the current year."
        actions={<Button variant="primary">Export CSV</Button>}
      />

      {/* Summary tiles */}
      <section className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Total revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          caption="Year to date"
        />
        <StatTile
          label="Average days to pay"
          value={`${avgDaysToPay}`}
          caption="Invoices"
        />
      </section>

      {/* Revenue by month */}
      <Card title="Revenue by month" className="mt-16">
        <DataTable columns={monthColumns} rows={revenueByMonth} />
      </Card>

      {/* Top customers */}
      <Card title="Top customers by revenue" className="mt-16">
        <DataTable columns={customerColumns} rows={topCustomers} />
      </Card>
    </main>
  );
}
