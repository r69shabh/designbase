import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { StatTile } from "@/components/StatTile";
import { DataTable } from "@/components/DataTable";

type RevenueRow = {
  month: string;
  revenue: number;
};

type CustomerRow = {
  name: string;
  revenue: number;
};

export default function ReportsPage() {
  // Sample data
  const monthlyRevenue: RevenueRow[] = [
    { month: "January", revenue: 12430 },
    { month: "February", revenue: 15820 },
    { month: "March", revenue: 13250 },
    { month: "April", revenue: 14780 },
    { month: "May", revenue: 16540 },
    { month: "June", revenue: 17320 },
    { month: "July", revenue: 15890 },
    { month: "August", revenue: 16230 },
    { month: "September", revenue: 14970 },
    { month: "October", revenue: 17110 },
    { month: "November", revenue: 18045 },
    { month: "December", revenue: 19230 },
  ];

  const topCustomers: CustomerRow[] = [
    { name: "Acme Corp", revenue: 45200 },
    { name: "Globex Ltd", revenue: 38950 },
    { name: "Soylent Co", revenue: 27430 },
    { name: "Initech", revenue: 21980 },
    { name: "Umbrella Inc", revenue: 18560 },
  ];

  // Columns for DataTable
  const revenueColumns = [
    { key: "month", header: "Month", align: "left" as const },
    {
      key: "revenue",
      header: "Revenue",
      align: "right" as const,
      numeric: true,
      render: (row: RevenueRow) => (
        <span className="font-mono text-sm tabular-nums">
          ${row.revenue.toLocaleString()}
        </span>
      ),
    },
  ];

  const customerColumns = [
    { key: "name", header: "Customer", align: "left" as const },
    {
      key: "revenue",
      header: "Revenue",
      align: "right" as const,
      numeric: true,
      render: (row: CustomerRow) => (
        <span className="font-mono text-sm tabular-nums">
          ${row.revenue.toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <main className="bg-paper px-6 py-12 md:px-16">
      <PageHeader
        eyebrow="Finance"
        title="Reports"
        description="Revenue and payment metrics for the current year."
        actions={<Button variant="primary">Export</Button>}
      />

      {/* Average days to pay */}
      <section className="mb-12">
        <StatTile
          label="Average days to pay"
          value="32"
          delta={{ value: "2", direction: "up" }}
          caption="vs. last month"
        />
      </section>

      {/* Revenue by month */}
      <section className="mb-12">
        <h2 className="font-display text-xl font-medium text-ink mb-4">
          Revenue by month
        </h2>
        <div className="overflow-x-auto border border-line rounded-none">
          <DataTable columns={revenueColumns} rows={monthlyRevenue} />
        </div>
      </section>

      {/* Top customers */}
      <section>
        <h2 className="font-display text-xl font-medium text-ink mb-4">
          Top customers by revenue
        </h2>
        <div className="overflow-x-auto border border-line rounded-none">
          <DataTable columns={customerColumns} rows={topCustomers} />
        </div>
      </section>
    </main>
  );
}
