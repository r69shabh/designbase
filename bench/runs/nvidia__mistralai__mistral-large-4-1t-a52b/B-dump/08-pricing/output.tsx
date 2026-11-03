import { useState } from "react";

import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { DataTable, type Column } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";

type Billing = "monthly" | "yearly";

interface Plan {
  id: string;
  name: string;
  description: string;
  monthly: number;
  yearly: number;
  yearlyTotal: number;
  features: string[];
  cta: string;
  featured?: boolean;
}

const soloPlan: Plan = {
  id: "solo",
  name: "Solo",
  description: "For one person keeping a personal ledger of projects and invoices.",
  monthly: 12,
  yearly: 9,
  yearlyTotal: 108,
  features: ["3 active projects", "100 exports per month", "1 seat", "Community support"],
  cta: "Start free trial",
};

const teamPlan: Plan = {
  id: "team",
  name: "Team",
  description: "For small teams sharing workspaces, approvals and a single source of truth.",
  monthly: 29,
  yearly: 24,
  yearlyTotal: 288,
  features: [
    "Unlimited projects",
    "1,000 exports per month",
    "Up to 10 seats",
    "Shared workspaces",
    "Priority support",
  ],
  cta: "Start free trial",
  featured: true,
};

const businessPlan: Plan = {
  id: "business",
  name: "Business",
  description: "For organisations that need controls, audit trails and procurement support.",
  monthly: 79,
  yearly: 65,
  yearlyTotal: 780,
  features: [
    "Everything in Team",
    "Unlimited exports",
    "Unlimited seats",
    "SSO and audit log",
    "Custom retention",
    "Dedicated manager",
  ],
  cta: "Contact sales",
};

const plans = [soloPlan, teamPlan, businessPlan];

type Cell = string | boolean;

interface ComparisonRow {
  id: string;
  feature: string;
  solo: Cell;
  team: Cell;
  business: Cell;
}

const faqs = [
  {
    q: "Can I change plans later?",
    a: "Yes. Upgrade, downgrade or cancel at any time from billing settings. Changes apply at the start of the next billing period and we prorate the difference.",
  },
  {
    q: "What happens when my trial ends?",
    a: "Your workspace switches to a read-only mode until you pick a plan. Nothing is deleted, and you can export your data at any time.",
  },
  {
    q: "Do you offer discounts for nonprofits or education?",
    a: "Yes. Registered nonprofits and educational institutions get 50% off any plan. Write to us from your official address and we will set it up.",
  },
  {
    q: "Which payment methods do you accept?",
    a: "All major credit and debit cards. Business plans can also pay by invoice and bank transfer on yearly billing.",
  },
  {
    q: "Can I get a receipt for my team?",
    a: "Yes. Invoices are generated automatically for every payment and can be downloaded from billing settings, with your company details added.",
  },
];

function renderCell(value: Cell) {
  if (value === true) return <span className="text-moss">✓</span>;
  if (value === false) return <span className="text-ink-3">—</span>;
  return value;
}

export default function PricingPage() {
  const [billing, setBilling] = useState<Billing>("monthly");

  const price = (plan: Plan) => (billing === "yearly" ? plan.yearly : plan.monthly);

  const rows: ComparisonRow[] = [
    {
      id: "price",
      feature: "Price",
      solo: `$${price(soloPlan)}/mo`,
      team: `$${price(teamPlan)}/mo`,
      business: `$${price(businessPlan)}/mo`,
    },
    { id: "projects", feature: "Active projects", solo: "3", team: "Unlimited", business: "Unlimited" },
    { id: "exports", feature: "Exports per month", solo: "100", team: "1,000", business: "Unlimited" },
    { id: "seats", feature: "Seats included", solo: "1", team: "Up to 10", business: "Unlimited" },
    { id: "workspaces", feature: "Shared workspaces", solo: false, team: true, business: true },
    { id: "approvals", feature: "Approval flows", solo: false, team: true, business: true },
    { id: "api", feature: "API access", solo: false, team: true, business: true },
    { id: "support", feature: "Priority support", solo: false, team: true, business: true },
    { id: "audit", feature: "Audit log", solo: false, team: false, business: true },
    { id: "sso", feature: "SSO / SAML", solo: false, team: false, business: true },
    { id: "retention", feature: "Custom retention", solo: false, team: false, business: true },
  ];

  const columns: Column<ComparisonRow>[] = [
    { key: "feature", header: "Feature" },
    { key: "solo", header: "Solo", align: "right", numeric: true, render: (row) => renderCell(row.solo) },
    { key: "team", header: "Team", align: "right", numeric: true, render: (row) => renderCell(row.team) },
    {
      key: "business",
      header: "Business",
      align: "right",
      numeric: true,
      render: (row) => renderCell(row.business),
    },
  ];

  return (
    <main className="min-h-screen bg-paper px-6 py-12 md:px-16">
      <div className="mb-12 flex items-center justify-between">
        <span className="font-display text-lg font-semibold text-ink">Almanac</span>
        <Button variant="ghost" size="sm">
          Sign in
        </Button>
      </div>

      <PageHeader
        eyebrow="Pricing"
        title="Pick a plan, start your trial"
        description="Every plan starts with 14 days free. No credit card required, and you can change or cancel at any time."
        actions={
          <Button variant="ghost" size="sm">
            Talk to sales
          </Button>
        }
      />

      <div className="mb-8 flex flex-wrap items-center gap-3">
        <span className="font-body text-sm font-medium text-ink">Billing period</span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={billing === "monthly" ? "secondary" : "ghost"}
            aria-pressed={billing === "monthly"}
            onClick={() => setBilling("monthly")}
          >
            Monthly
          </Button>
          <Button
            size="sm"
            variant={billing === "yearly" ? "secondary" : "ghost"}
            aria-pressed={billing === "yearly"}
            onClick={() => setBilling("yearly")}
          >
            Yearly <Badge tone="positive">Save up to 25%</Badge>
          </Button>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            title={plan.name}
            action={plan.featured ? <Badge tone="accent">Most popular</Badge> : undefined}
            className="flex flex-col"
          >
            <div className="flex flex-1 flex-col gap-4">
              <p className="font-body text-sm text-ink-2">{plan.description}</p>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-2xl font-medium tabular-nums text-ink">
                  ${price(plan)}
                </span>
                <span className="font-body text-sm text-ink-3">/ month</span>
              </div>
              <p className="font-mono text-xs text-ink-3">
                {billing === "yearly" ? `Billed yearly · $${plan.yearlyTotal}/yr` : "Billed monthly"}
              </p>
              <ul className="mt-2 flex flex-col gap-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-baseline gap-2 font-body text-sm text-ink-2">
                    <span className="text-moss">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <Button
              variant={plan.featured ? "primary" : "secondary"}
              className="mt-6 w-full"
            >
              {plan.cta}
            </Button>
          </Card>
        ))}
      </div>

      <section className="mt-16">
        <h2 className="mb-6 font-display text-xl font-medium text-ink">Compare plans</h2>
        <DataTable columns={columns} rows={rows} />
      </section>

      <section className="mt-16">
        <h2 className="mb-6 font-display text-xl font-medium text-ink">Frequently asked questions</h2>
        <div className="flex flex-col gap-8">
          {faqs.map((faq) => (
            <div key={faq.q}>
              <h3 className="font-display text-lg font-medium text-ink">{faq.q}</h3>
              <p className="mt-2 max-w-prose font-body text-base text-ink-2">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-16 font-mono text-xs text-ink-3">
        Prices in USD, excluding tax. Yearly plans are billed once per year.
      </p>
    </main>
  );
}
