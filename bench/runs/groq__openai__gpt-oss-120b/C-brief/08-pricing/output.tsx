import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/Badge";

type Plan = {
  name: string;
  priceMonthly: number;
  priceYearly: number;
  description: string;
  highlighted?: boolean;
};

type Feature = {
  name: string;
  solo: boolean;
  team: boolean;
  business: boolean;
};

type FAQ = {
  q: string;
  a: string;
};

export default function PricingPage() {
  const [yearly, setYearly] = useState(false);

  const plans: Plan[] = [
    {
      name: "Solo",
      priceMonthly: 12,
      priceYearly: 120,
      description: "For individual creators",
    },
    {
      name: "Team",
      priceMonthly: 30,
      priceYearly: 300,
      description: "Collaboration for small teams",
      highlighted: true,
    },
    {
      name: "Business",
      priceMonthly: 70,
      priceYearly: 700,
      description: "Enterprise‑grade features",
    },
  ];

  const features: Feature[] = [
    { name: "Unlimited projects", solo: true, team: true, business: true },
    { name: "Custom branding", solo: false, team: true, business: true },
    { name: "Advanced analytics", solo: false, team: true, business: true },
    { name: "Dedicated support", solo: false, team: false, business: true },
  ];

  const faqs: FAQ[] = [
    {
      q: "Can I switch plans later?",
      a: "Yes, you can upgrade or downgrade at any time from your account settings.",
    },
    {
      q: "Do you offer a free trial?",
      a: "All plans include a 14‑day free trial with full feature access.",
    },
    {
      q: "Is there a discount for annual billing?",
      a: "Paying yearly saves you two months’ worth of fees.",
    },
  ];

  const formatPrice = (price: number) => `$${price}`;

  return (
    <main className="bg-paper text-ink font-body mx-auto max-w-4xl px-6 py-12">
      <PageHeader
        eyebrow="Pricing"
        title="Choose your plan"
        description="Simple, transparent pricing. Switch or cancel anytime."
        actions={
          <div className="flex gap-2">
            <Button
              variant={yearly ? "secondary" : "primary"}
              size="sm"
              onClick={() => setYearly(false)}
            >
              Monthly
            </Button>
            <Button
              variant={yearly ? "primary" : "secondary"}
              size="sm"
              onClick={() => setYearly(true)}
            >
              Yearly
            </Button>
          </div>
        }
      />

      {/* Plans */}
      <section className="mb-12">
        <div className="grid gap-8 md:grid-cols-3">
          {plans.map((plan) => {
            const price = yearly ? plan.priceYearly : plan.priceMonthly;
            const period = yearly ? "year" : "month";
            const isPrimary = plan.highlighted;
            return (
              <Card key={plan.name} title={plan.name}>
                <p className="font-body text-ink-2 mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="font-mono text-3xl font-medium text-ink">
                    {formatPrice(price)}
                  </span>
                  <span className="font-body text-ink-3 text-sm">/ {period}</span>
                </div>
                {plan.highlighted && (
                  <Badge tone="accent" className="mb-4">
                    Most popular
                  </Badge>
                )}
                <Button
                  variant={isPrimary ? "primary" : "secondary"}
                  size="md"
                  className="w-full"
                >
                  Select {plan.name}
                </Button>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Feature comparison */}
      <section className="mb-12">
        <Card title="Feature comparison">
          <div className="overflow-x-auto">
            <DataTable
              className="min-w-full"
              columns={[
                { header: "Feature", accessor: "name" },
                { header: "Solo", accessor: "solo" },
                { header: "Team", accessor: "team" },
                { header: "Business", accessor: "business" },
              ]}
              data={features.map((f) => ({
                name: f.name,
                solo: f.solo ? "✓" : "",
                team: f.team ? "✓" : "",
                business: f.business ? "✓" : "",
              }))}
              renderCell={(value, column) => {
                if (["solo", "team", "business"].includes(column.accessor)) {
                  return (
                    <span className="font-mono text-center block text-ink-2">
                      {value}
                    </span>
                  );
                }
                return <span className="font-body text-ink-2">{value}</span>;
              }}
            />
          </div>
        </Card>
      </section>

      {/* FAQ */}
      <section>
        <Card title="Frequently asked questions">
          <dl className="space-y-6">
            {faqs.map((item, i) => (
              <div key={i}>
                <dt className="font-body text-ink font-medium">{item.q}</dt>
                <dd className="font-body text-ink-2 mt-2">{item.a}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </section>
    </main>
  );
}
