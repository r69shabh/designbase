import { useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/Badge";

type Plan = {
  name: string;
  priceMonthly: string;
  priceYearly: string;
  features: string[];
  popular?: boolean;
};

type FeatureRow = {
  feature: string;
  solo: boolean;
  team: boolean;
  business: boolean;
};

const plans: Plan[] = [
  {
    name: "Solo",
    priceMonthly: "$12",
    priceYearly: "$120",
    features: ["1 user", "Basic support", "Unlimited projects"],
  },
  {
    name: "Team",
    priceMonthly: "$30",
    priceYearly: "$300",
    features: ["Up to 10 users", "Priority support", "Advanced analytics"],
    popular: true,
  },
  {
    name: "Business",
    priceMonthly: "$70",
    priceYearly: "$700",
    features: ["Unlimited users", "Dedicated support", "Custom integrations"],
  },
];

const featureRows: FeatureRow[] = [
  { feature: "Unlimited projects", solo: true, team: true, business: true },
  { feature: "Advanced analytics", solo: false, team: true, business: true },
  { feature: "Custom integrations", solo: false, team: false, business: true },
  { feature: "Dedicated support", solo: false, team: false, business: true },
];

const faqs = [
  {
    q: "Can I switch plans later?",
    a: "Yes, you can upgrade or downgrade at any time from your account settings.",
  },
  {
    q: "Do you offer a free trial?",
    a: "All plans include a 14‑day free trial with no credit card required.",
  },
  {
    q: "Is there a discount for annual billing?",
    a: "Yes, you save two months’ worth of fees when you pay yearly.",
  },
];

export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  const price = (plan: Plan) =>
    billing === "monthly" ? plan.priceMonthly : plan.priceYearly;

  const columns = [
    { key: "feature", header: "Feature", align: "left" as const },
    { key: "solo", header: "Solo", align: "center" as const },
    { key: "team", header: "Team", align: "center" as const },
    { key: "business", header: "Business", align: "center" as const },
  ];

  const rows = featureRows.map((row, i) => ({
    id: `row-${i}`,
    feature: row.feature,
    solo: row.solo ? "✓" : "",
    team: row.team ? "✓" : "",
    business: row.business ? "✓" : "",
  }));

  return (
    <main className="bg-paper min-h-screen font-body text-ink">
      <section className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="font-display text-3xl font-medium text-ink">Pricing</h1>
          <p className="mt-2 text-base text-ink-2">
            Choose the plan that fits your needs. Switch anytime.
          </p>
        </header>

        {/* Billing toggle */}
        <div className="flex justify-center gap-2 mb-12">
          <Button
            variant={billing === "monthly" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setBilling("monthly")}
          >
            Monthly billing
          </Button>
          <Button
            variant={billing === "yearly" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setBilling("yearly")}
          >
            Yearly billing
          </Button>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              title={
                <div className="flex items-center gap-2">
                  <span className="font-display text-lg">{plan.name}</span>
                  {plan.popular && (
                    <Badge tone="accent">Most popular</Badge>
                  )}
                </div>
              }
            >
              <div className="flex flex-col items-start gap-4">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-2xl">{price(plan)}</span>
                  <span className="font-body text-sm text-ink-3">
                    /{billing === "monthly" ? "mo" : "yr"}
                  </span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm text-ink-2">
                  {plan.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <Button
                  variant="secondary"
                  className="mt-4 w-full"
                >
                  Choose {plan.name}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Feature comparison */}
        <section className="mt-16">
          <h2 className="font-display text-2xl font-medium text-ink mb-6">
            Compare features
          </h2>
          <DataTable
            columns={columns}
            rows={rows}
          />
        </section>

        {/* FAQ */}
        <section className="mt-16">
          <h2 className="font-display text-2xl font-medium text-ink mb-6">
            Frequently asked questions
          </h2>
          <dl className="space-y-6">
            {faqs.map((faq, i) => (
              <div key={i} className="border-t border-line pt-6">
                <dt className="font-body text-base font-medium text-ink">
                  {faq.q}
                </dt>
                <dd className="mt-2 text-sm text-ink-2">{faq.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </section>
    </main>
  );
}
