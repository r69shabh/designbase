import { Button } from "@/components/Button"
import { DataTable } from "@/components/DataTable"
import { StatTile } from "@/components/StatTile"
import { PageHeader } from "@/components/PageHeader"
import { Badge } from "@/components/Badge"
import type { Column } from "@/components/DataTable"

interface InvoiceRow {
  id: string
  number: string
  customer: string
  amount: number
  status: "paid" | "pending" | "overdue"
  date: string
}

interface ActivityRow {
  id: string
  type: "payment" | "invoice" | "customer"
  description: string
  amount?: number
  time: string
}

const statData = [
  { label: "Monthly revenue", value: "$48,750", delta: { value: "+12.3%", direction: "up" as const }, caption: "vs last month" },
  { label: "Outstanding balance", value: "$23,410", delta: { value: "-4.1%", direction: "down" as const }, caption: "from 18 invoices" },
  { label: "On-time payment rate", value: "87%", delta: { value: "+2.1%", direction: "up" as const }, caption: "industry avg 82%" },
  { label: "Active customers", value: "142", delta: { value: "+5", direction: "up" as const }, caption: "3 new this week" },
]

const weeklyCollections = [
  { week: "Jun 2–8", collected: 12400 },
  { week: "Jun 9–15", collected: 15800 },
  { week: "Jun 16–22", collected: 9600 },
  { week: "Jun 23–29", collected: 18200 },
  { week: "Jun 30–Jul 6", collected: 14100 },
  { week: "Jul 7–13", collected: 16700 },
  { week: "Jul 14–20", collected: 13300 },
]

const maxCollected = Math.max(...weeklyCollections.map(w => w.collected))
const chartHeight = 160

const recentActivity: ActivityRow[] = [
  { id: "a1", type: "payment", description: "Payment received from Acme Corp", amount: 4500, time: "2 hours ago" },
  { id: "a2", type: "invoice", description: "Invoice INV-2024-0142 sent to BrightLabs", amount: 3200, time: "5 hours ago" },
  { id: "a3", type: "customer", description: "New customer: Meridian Systems", time: "Yesterday" },
  { id: "a4", type: "payment", description: "Payment received from Vertex Inc", amount: 2800, time: "Yesterday" },
  { id: "a5", type: "invoice", description: "Invoice INV-2024-0141 overdue — follow up sent", amount: 1950, time: "2 days ago" },
]

const recentInvoices: InvoiceRow[] = [
  { id: "i1", number: "INV-2024-0142", customer: "BrightLabs", amount: 3200, status: "pending", date: "Jul 18, 2024" },
  { id: "i2", number: "INV-2024-0141", customer: "Vertex Inc", amount: 1950, status: "overdue", date: "Jul 15, 2024" },
  { id: "i3", number: "INV-2024-0140", customer: "Acme Corp", amount: 4500, status: "paid", date: "Jul 12, 2024" },
  { id: "i4", number: "INV-2024-0139", customer: "Nordic Tech", amount: 2750, status: "paid", date: "Jul 10, 2024" },
  { id: "i5", number: "INV-2024-0138", customer: "Meridian Systems", amount: 5100, status: "pending", date: "Jul 8, 2024" },
  { id: "i6", number: "INV-2024-0137", customer: "Apex Digital", amount: 1200, status: "paid", date: "Jul 5, 2024" },
]

const invoiceColumns: Column<InvoiceRow>[] = [
  { key: "number", header: "Invoice", align: "left" },
  { key: "customer", header: "Customer", align: "left" },
  { key: "amount", header: "Amount", align: "right", numeric: true, render: (r) => `$${r.amount.toLocaleString()}` },
  { key: "status", header: "Status", align: "left", render: (r) => (
    <Badge tone={r.status === "paid" ? "positive" : r.status === "overdue" ? "negative" : "warning"}>
      {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
    </Badge>
  )},
  { key: "date", header: "Date", align: "left" },
]

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-paper px-6 py-12 md:px-16 overflow-x-hidden">
      <PageHeader
        title="Dashboard"
        description="Overview of revenue, collections, and recent activity."
        actions={<Button variant="primary" size="sm">Create invoice</Button>}
      />

      <div className="mt-12 grid gap-8 md:grid-cols-4">
        {statData.map((stat, i) => (
          <StatTile key={i} {...stat} />
        ))}
      </div>

      <section className="mt-12" aria-labelledby="collections-heading">
        <h2 id="collections-heading" className="font-display text-xl font-medium text-ink mb-6">Weekly collections</h2>
        <div className="border border-line rounded-md bg-paper p-6">
          <svg
            viewBox={`0 0 ${weeklyCollections.length * 48} ${chartHeight + 40}`}
            className="w-full max-w-3xl font-body"
            role="img"
            aria-label="Bar chart showing weekly collections over the last 7 weeks"
          >
            <g className="text-ink-2" font-size="11">
              {weeklyCollections.map((w, i) => {
                const x = i * 48 + 24
                const barHeight = (w.collected / maxCollected) * chartHeight
                const y = chartHeight - barHeight + 20
                return (
                  <g key={w.week}>
                    <rect
                      x={i * 48 + 12}
                      y={y}
                      width={24}
                      height={barHeight}
                      className="fill-accent"
                      rx={2}
                    />
                    <text x={x} y={chartHeight + 36} text-anchor="middle" className="text-xs text-ink-3">
                      {w.week}
                    </text>
                    <text x={x} y={y - 4} text-anchor="middle" className="font-mono text-xs text-ink">
                      ${(w.collected / 1000).toFixed(1)}k
                    </text>
                  </g>
                )
              })}
              <line x1="0" y1={chartHeight + 20} x2={weeklyCollections.length * 48} y2={chartHeight + 20} className="stroke-line" stroke-width="0.5" />
            </g>
          </svg>
        </div>
      </section>

      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="activity-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="activity-heading" className="font-display text-xl font-medium text-ink">Recent activity</h2>
            <Button variant="ghost" size="sm">View all</Button>
          </div>
          <div className="space-y-3 border border-line rounded-md bg-paper divide-y divide-line">
            {recentActivity.map((act) => (
              <div key={act.id} className="flex items-center justify-between gap-4 p-4 hover:bg-paper-2 min-w-0">
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm text-ink truncate">{act.description}</p>
                  <p className="font-body text-xs text-ink-3 mt-1">{act.time}</p>
                </div>
                {act.amount !== undefined && (
                  <span className="font-mono text-sm text-ink tabular-nums whitespace-nowrap shrink-0">
                    ${act.amount.toLocaleString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="invoices-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="invoices-heading" className="font-display text-xl font-medium text-ink">Recent invoices</h2>
            <Button variant="ghost" size="sm">View all</Button>
          </div>
          <div className="min-w-0">
            <DataTable columns={invoiceColumns} rows={recentInvoices} />
          </div>
        </section>
      </div>
    </main>
  )
}
