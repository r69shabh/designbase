import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { DataTable } from "@/components/DataTable";

type BillingPeriod = "monthly" | "yearly";

interface Plan {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  cta: string;
  popular?: boolean;
}

const plans: Plan[] = [
  {
    name: "Solo",
    description: "For individuals and side projects",
    monthlyPrice: 12,
    yearlyPrice: 120,
    features: [
      "Unlimited projects",
      "10 GB storage",
      "Basic analytics",
      "Email support",
      "API access",
    ],
    cta: "Start free trial",
  },
  {
    name: "Team",
    description: "For small teams shipping together",
    monthlyPrice: 29,
    yearlyPrice: 290,
    features: [
      "Everything in Solo",
      "5 team members",
      "100 GB storage",
      "Advanced analytics",
      "Priority support",
      "SSO authentication",
      "Custom domains",
    ],
    cta: "Start free trial",
    popular: true,
  },
  {
    name: "Business",
    description: "For organizations that need scale",
    monthlyPrice: 79,
    yearlyPrice: 790,
    features: [
      "Everything in Team",
      "Unlimited members",
      "1 TB storage",
      "Custom reporting",
      "Dedicated support",
      "SLA guarantee",
      "Audit logs",
      "On-premise option",
    ],
    cta: "Contact sales",
  },
];

const featureRows = [
  { feature: "Unlimited projects", solo: "✓", team: "✓", business: "✓" },
  { feature: "Team members", solo: "1", team: "5", business: "Unlimited" },
  { feature: "Storage", solo: "10 GB", team: "100 GB", business: "1 TB" },
  { feature: "Basic analytics", solo: "✓", team: "✓", business: "✓" },
  { feature: "Advanced analytics", solo: "—", team: "✓", business: "✓" },
  { feature: "Custom reporting", solo: "—", team: "—", business: "✓" },
  { feature: "Email support", solo: "✓", team: "✓", business: "✓" },
  { feature: "Priority support", solo: "—", team: "✓", business: "✓" },
  { feature: "Dedicated support", solo: "—", team: "—", business: "✓" },
  { feature: "SLA guarantee", solo: "—", team: "—", business: "✓" },
  { feature: "API access", solo: "✓", team: "✓", business: "✓" },
  { feature: "SSO authentication", solo: "—", team: "✓", business: "✓" },
  { feature: "Audit logs", solo: "—", team: "—", business: "✓" },
  { feature: "Custom domains", solo: "—", team: "✓", business: "✓" },
  { feature: "On-premise option", solo: "—", team: "—", business: "✓" },
];

const faqs = [
  {
    question: "Can I switch plans later?",
    answer:
      "Yes, you can upgrade or downgrade at any time. Upgrades take effect immediately, and downgrades apply at the start of your next billing cycle.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and bank transfers for annual Business plans.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Solo and Team plans include a 14-day free trial with full feature access. No credit card required to start.",
  },
  {
    question: "What happens when my trial ends?",
    answer:
      "You'll be prompted to choose a plan and enter payment details. If you don't upgrade, your account will be paused but your data is preserved for 90 days.",
  },
  {
    question: "Do you offer discounts for nonprofits or education?",
    answer:
      "Yes, we offer 50% off for qualified nonprofits and educational institutions. Contact our sales team with your organization details to apply.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Monthly plans can be cancelled anytime with access continuing until the end of the billing period. Annual plans are non-refundable but can be cancelled to prevent auto-renewal.",
  },
];

export default function PricingPage() {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");

  const getPrice = (plan: Plan) =>
    period === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
  const getPeriodLabel = () => (period === "monthly" ? "/month" : "/year");

  const comparisonColumns = [
    { key: "feature", header: "Feature", align: "left" as const },
    { key: "solo", header: "Solo", align: "center" as const },
    { key: "team", header: "Team", align: "center" as const },
    { key: "business", header: "Business", align: "center" as const },
  ];

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <PageHeader
        title="Pricing"
        description="Simple, transparent pricing that scales with you. All plans include a 14-day free trial."
      />

      <div className="mb-12 flex items-center justify-center gap-4">
        <span className="font-body text-sm text-ink-2">Billing</span>
        <div className="inline-flex items-center gap-1 rounded-md border border-line bg-paper p-1">
          <Button
            variant={period === "monthly" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setPeriod("monthly")}
            className="rounded-sm"
          >
            Monthly
          </Button>
          <Button
            variant={period === "yearly" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setPeriod("yearly")}
            className="rounded-sm"
          >
            Yearly
            {period === "yearly" && (
              <Badge tone="positive" className="ml-1 text-xs">
                Save 20%
              </Badge>
            )}
          </Button>
        </div>
      </div>

      <div className="mb-16 grid gap-8 md:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`flex flex-col ${
              plan.popular ? "border-accent relative" : ""
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge tone="accent">Most popular</Badge>
              </div>
            )}
            <header className="mb-6">
              <h2 className="font-display text-lg font-medium text-ink">
                {plan.name}
              </h2>
              <p className="mt-2 font-body text-sm text-ink-2">
                {plan.description}
              </p>
            </header>
            <div className="mb-6 flex items-baseline gap-2">
              <span className="font-display text-3xl font-medium text-ink tabular-nums">
                ${getPrice(plan)}
              </span>
              <span className="font-body text-base text-ink-2">
                {getPeriodLabel()}
              </span>
            </div>
            {period === "yearly" && (
              <p className="mb-6 font-body text-sm text-moss">
                Billed ${plan.yearlyPrice} yearly
              </p>
            )}
            <ul className="mb-8 flex-1 space-y-3">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3 font-body text-sm text-ink-2">
                  <svg
                    className="mt-1 flex-shrink-0 size-5 text-moss"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              variant={plan.popular ? "primary" : "secondary"}
              className="w-full"
            >
              {plan.cta}
            </Button>
          </Card>
        ))}
      </div>

      <section className="mb-16">
        <h2 className="mb-8 font-display text-xl font-medium text-ink">
          Feature comparison
        </h2>
        <DataTable columns={comparisonColumns} rows={featureRows} />
      </section>

      <section>
        <h2 className="mb-8 font-display text-xl font-medium text-ink">
          Frequently asked questions
        </h2>
        <div className="flex flex-col gap-4">
          {faqs.map((faq, i) => (
            <Card key={i} className="p-0">
              <details className="group">
                <summary className="flex items-center justify-between gap-4 p-6 list-none cursor-pointer">
                  <h3 className="font-display text-base font-medium text-ink">
                    {faq.question}
                  </h3>
                  <svg
                    className="flex-shrink-0 size-5 text-ink-3 transition-transform group-open:rotate-180"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
                  </svg>
                </summary>
                <div className="border-t border-line px-6 pb-6">
                  <p className="font-body text-sm text-ink-2">{faq.answer}</p>
                </div>
              </details>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
