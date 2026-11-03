import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { StatTile } from "@/components/StatTile";

type MonthRow = {
  month: string;
  revenue: string;
  invoices: number;
  change: string;
  trend: "up" | "down";
};

type CustomerRow = {
  rank: number;
  customer: string;
  contact: string;
  revenue: string;
  share: string;
  status: string;
  tone: "neutral" | "positive" | "warning" | "negative" | "accent";
};

const monthlyRevenue: MonthRow[] = [
  { month: "January", revenue: "$96,200", invoices: 38, change: "▲ 4.1%", trend: "up" },
  { month: "February", revenue: "$88,400", invoices: 35, change: "▼ 8.1%", trend: "down" },
  { month: "March", revenue: "$104,900", invoices: 41, change: "▲ 18.6%", trend: "up" },
  { month: "April", revenue: "$112,300", invoices: 44, change: "▲ 7.1%", trend: "up" },
  { month: "May", revenue: "$98,700", invoices: 39, change: "▼ 12.1%", trend: "down" },
  { month: "June", revenue: "$118,600", invoices: 46, change: "▲ 20.1%", trend: "up" },
  { month: "July", revenue: "$109,200", invoices: 43, change: "▼ 7.9%", trend: "down" },
  { month: "August", revenue: "$101,800", invoices: 40, change: "▼ 6.8%", trend: "down" },
  { month: "September", revenue: "$116,400", invoices: 45, change: "▲ 14.4%", trend: "up" },
  { month: "October", revenue: "$124,900", invoices: 49, change: "▲ 7.3%", trend: "up" },
  { month: "November", revenue: "$119,300", invoices: 47, change: "▼ 4.5%", trend: "down" },
  { month: "December", revenue: "$134,800", invoices: 52, change: "▲ 13.0%", trend: "up" },
];

const topCustomers: CustomerRow[] = [
  { rank: 1, customer: "Meridian Labs", contact: "Dana Whitfield", revenue: "$129,800", share: "9.8%", status: "Active", tone: "positive" },
  { rank: 2, customer: "Northwind & Co", contact: "Marcus Bell", revenue: "$112,400", share: "8.5%", status: "Active", tone: "positive" },
  { rank: 3, customer: "Halcyon Studio", contact: "Priya Raman", revenue: "$98,900", share: "7.5%", status: "Active", tone: "positive" },
  { rank: 4, customer: "Beacon Freight", contact: "Tom Okafor", revenue: "$87,300", share: "6.6%", status: "Review", tone: "warning" },
  { rank: 5, customer: "Copperline Goods", contact: "Elif Kaya", revenue: "$76,150", share: "5.7%", status: "Active", tone: "positive" },
];

export default function ReportsPage() {
  return (
    <main className="px-6 py-12 md:px-16">
      <PageHeader
        eyebrow="Reports · Fiscal year 2025"
        title="Revenue report"
        description="Revenue by month, top customers by revenue, and average days to pay for the 2025 fiscal year."
        actions={
          <>
            <Button variant="ghost">Print</Button>
            <Button variant="primary">Export CSV</Button>
          </>
        }
      />

      <section aria-label="Key metrics" className="mb-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Total revenue"
          value="$1,325,500"
          delta={{ value: "12.4%", direction: "up" }}
          caption="vs 2024"
        />
        <StatTile
          label="Average days to pay"
          value="32 days"
          caption="4 days faster than 2024"
        />
        <StatTile
          label="Open invoices"
          value="12"
          caption="$86,200 outstanding"
        />
        <StatTile
          label="Largest customer"
          value="Meridian Labs"
          caption="9.8% of revenue"
        />
      </section>

      <section className="mb-12">
        <h2 className="mb-6 font-display text-xl font-medium text-ink">Revenue by month</h2>
        <div className="overflow-x-auto">
          <DataTable
            columns={[
              { key: "month", header: "Month" },
              { key: "revenue", header: "Revenue", numeric: true },
              { key: "invoices", header: "Invoices", numeric: true },
              {
                key: "change",
                header: "vs prior month",
                numeric: true,
                render: (row: MonthRow) => (
                  <span className={row.trend === "up" ? "text-moss" : "text-brick"}>{row.change}</span>
                ),
              },
            ]}
            rows={monthlyRevenue}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-6 font-display text-xl font-medium text-ink">Top customers by revenue</h2>
        <div className="overflow-x-auto">
          <DataTable
            columns={[
              { key: "rank", header: "#", numeric: true },
              { key: "customer", header: "Customer" },
              { key: "contact", header: "Contact" },
              { key: "revenue", header: "Revenue", numeric: true },
              { key: "share", header: "Share of total", numeric: true },
              {
                key: "status",
                header: "Status",
                render: (row: CustomerRow) => <Badge tone={row.tone}>{row.status}</Badge>,
              },
            ]}
            rows={topCustomers}
          />
        </div>
      </section>
    </main>
  );
}
