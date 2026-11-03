import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { StatTile } from "@/components/StatTile";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/Badge";

type MonthRow = {
  month: string;
  revenue: number;
  change: number | null;
  share: number;
};

type CustomerRow = {
  rank: number;
  customer: string;
  invoices: number;
  revenue: number;
  share: number;
  status: "Active" | "At risk";
};

type QuarterRow = {
  quarter: string;
  invoices: number;
  avgDays: number;
  change: number;
};

const monthlyRevenue: MonthRow[] = [
  { month: "Jan", revenue: 96400, change: null, share: 7.1 },
  { month: "Feb", revenue: 88200, change: -8.5, share: 6.5 },
  { month: "Mar", revenue: 104700, change: 18.7, share: 7.7 },
  { month: "Apr", revenue: 112300, change: 7.3, share: 8.3 },
  { month: "May", revenue: 98900, change: -11.9, share: 7.3 },
  { month: "Jun", revenue: 118600, change: 19.9, share: 8.8 },
  { month: "Jul", revenue: 109400, change: -7.8, share: 8.1 },
  { month: "Aug", revenue: 101800, change: -6.9, share: 7.5 },
  { month: "Sep", revenue: 121500, change: 19.4, share: 9.0 },
  { month: "Oct", revenue: 116900, change: -3.8, share: 8.6 },
  { month: "Nov", revenue: 134200, change: 14.8, share: 9.9 },
  { month: "Dec", revenue: 152600, change: 13.7, share: 11.3 },
];

const topCustomers: CustomerRow[] = [
  { rank: 1, customer: "Northwind Traders", invoices: 48, revenue: 186200, share: 13.7, status: "Active" },
  { rank: 2, customer: "Bluepeak Logistics", invoices: 36, revenue: 142800, share: 10.5, status: "Active" },
  { rank: 3, customer: "Harbor & Finch", invoices: 29, revenue: 118400, share: 8.7, status: "Active" },
  { rank: 4, customer: "Copperline Manufacturing", invoices: 24, revenue: 96500, share: 7.1, status: "Active" },
  { rank: 5, customer: "Solstice Foods", invoices: 31, revenue: 74300, share: 5.5, status: "At risk" },
  { rank: 6, customer: "Meridian Health", invoices: 18, revenue: 58900, share: 4.3, status: "Active" },
];

const paymentTiming: QuarterRow[] = [
  { quarter: "Q1 2025", invoices: 78, avgDays: 36, change: 2 },
  { quarter: "Q2 2025", invoices: 84, avgDays: 33, change: -3 },
  { quarter: "Q3 2025", invoices: 91, avgDays: 30, change: -3 },
  { quarter: "Q4 2025", invoices: 89, avgDays: 28, change: -2 },
];

const formatMoney = (n: number) => `$${n.toLocaleString("en-US")}`;

export default function ReportsPage() {
  return (
    <main className="px-6 py-12 md:px-16">
      <PageHeader
        eyebrow="Reports · FY 2025"
        title="Revenue report"
        description="Revenue by month, top customers by revenue, and average days to pay for fiscal year 2025."
        actions={<Button variant="primary">Export report</Button>}
      />

      <section className="mb-12 grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4" aria-label="Year summary">
        <StatTile
          label="Total revenue"
          value="$1,355,500"
          delta={{ value: "12.4%", direction: "up" }}
          caption="vs 2024"
        />
        <StatTile
          label="Average days to pay"
          value="32 days"
          delta={{ value: "4 days", direction: "down" }}
          caption="faster than 2024"
        />
        <StatTile
          label="Top customer revenue"
          value="$186,200"
          caption="Northwind Traders · 13.7% of total"
        />
        <StatTile
          label="Invoices paid"
          value="342"
          delta={{ value: "8.1%", direction: "up" }}
          caption="vs 2024"
        />
      </section>

      <section className="mb-12">
        <div className="mb-6 flex flex-col gap-1">
          <h2 className="font-display text-xl font-medium text-ink">Revenue by month</h2>
          <p className="font-body text-sm text-ink-3">
            Invoiced revenue per month in 2025, with month-over-month change and share of the year.
          </p>
        </div>
        <DataTable
          columns={[
            { key: "month", header: "Month" },
            {
              key: "revenue",
              header: "Revenue",
              align: "right",
              numeric: true,
              render: (r: MonthRow) => formatMoney(r.revenue),
            },
            {
              key: "change",
              header: "vs prior month",
              align: "right",
              numeric: true,
              render: (r: MonthRow) =>
                r.change === null ? (
                  <span className="text-ink-3">—</span>
                ) : (
                  <span className={r.change >= 0 ? "text-moss" : "text-brick"}>
                    {r.change > 0 ? "+" : ""}
                    {r.change.toFixed(1)}%
                  </span>
                ),
            },
            {
              key: "share",
              header: "Share of year",
              align: "right",
              numeric: true,
              render: (r: MonthRow) => `${r.share.toFixed(1)}%`,
            },
          ]}
          rows={monthlyRevenue}
        />
      </section>

      <section className="mb-12">
        <div className="mb-6 flex flex-col gap-1">
          <h2 className="font-display text-xl font-medium text-ink">Top customers by revenue</h2>
          <p className="font-body text-sm text-ink-3">
            The six largest customers of 2025, ranked by invoiced revenue.
          </p>
        </div>
        <DataTable
          columns={[
            { key: "rank", header: "Rank", align: "right", numeric: true },
            { key: "customer", header: "Customer" },
            { key: "invoices", header: "Invoices", align: "right", numeric: true },
            {
              key: "revenue",
              header: "Revenue",
              align: "right",
              numeric: true,
              render: (r: CustomerRow) => formatMoney(r.revenue),
            },
            {
              key: "share",
              header: "Share",
              align: "right",
              numeric: true,
              render: (r: CustomerRow) => `${r.share.toFixed(1)}%`,
            },
            {
              key: "status",
              header: "Status",
              render: (r: CustomerRow) => (
                <Badge tone={r.status === "Active" ? "positive" : "warning"}>{r.status}</Badge>
              ),
            },
          ]}
          rows={topCustomers}
        />
      </section>

      <section>
        <div className="mb-6 flex flex-col gap-1">
          <h2 className="font-display text-xl font-medium text-ink">Average days to pay</h2>
          <p className="font-body text-sm text-ink-3">
            Payment timing by quarter. The full-year average is 32 days, down from 36 in 2024.
          </p>
        </div>
        <DataTable
          columns={[
            { key: "quarter", header: "Quarter" },
            { key: "invoices", header: "Invoices paid", align: "right", numeric: true },
            { key: "avgDays", header: "Avg days to pay", align: "right", numeric: true },
            {
              key: "change",
              header: "vs prior quarter",
              align: "right",
              numeric: true,
              render: (r: QuarterRow) => (
                <span className={r.change <= 0 ? "text-moss" : "text-brick"}>
                  {r.change > 0 ? "+" : ""}
                  {r.change} days
                </span>
              ),
            },
          ]}
          rows={paymentTiming}
        />
      </section>
    </main>
  );
}
