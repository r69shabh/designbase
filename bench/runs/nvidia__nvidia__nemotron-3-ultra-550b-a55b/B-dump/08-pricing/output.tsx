import { useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/Badge";

type BillingPeriod = "monthly" | "yearly";

interface Plan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  cta: string;
  popular?: boolean;
}

interface FeatureRow {
  feature: string;
  solo: string;
  team: string;
  business: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

const plans: Plan[] = [
  {
    id: "solo",
    name: "Solo",
    description: "For individuals and freelancers",
    monthlyPrice: 15,
    yearlyPrice: 12,
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
    id: "team",
    name: "Team",
    description: "For growing teams",
    monthlyPrice: 45,
    yearlyPrice: 36,
    features: [
      "Everything in Solo",
      "Up to 10 members",
      "100 GB storage",
      "Advanced analytics",
      "Priority support",
      "SSO authentication",
      "Custom integrations",
    ],
    cta: "Start free trial",
    popular: true,
  },
  {
    id: "business",
    name: "Business",
    description: "For organizations at scale",
    monthlyPrice: 125,
    yearlyPrice: 99,
    features: [
      "Everything in Team",
      "Unlimited members",
      "Unlimited storage",
      "Custom reporting",
      "Dedicated support",
      "SLA guarantee",
      "On-premise option",
      "Audit logs",
    ],
    cta: "Contact sales",
  },
];

const featureComparison: FeatureRow[] = [
  { feature: "Projects", solo: "Unlimited", team: "Unlimited", business: "Unlimited" },
  { feature: "Team members", solo: "1", team: "Up to 10", business: "Unlimited" },
  { feature: "Storage", solo: "10 GB", team: "100 GB", business: "Unlimited" },
  { feature: "Analytics", solo: "Basic", team: "Advanced", business: "Custom" },
  { feature: "Support", solo: "Email", team: "Priority", business: "Dedicated" },
  { feature: "API access", solo: "✓", team: "✓", business: "✓" },
  { feature: "SSO", solo: "—", team: "✓", business: "✓" },
  { feature: "Custom integrations", solo: "—", team: "✓", business: "✓" },
  { feature: "SLA", solo: "—", team: "—", business: "99.9%" },
  { feature: "Audit logs", solo: "—", team: "—", business: "✓" },
  { feature: "On-premise", solo: "—", team: "—", business: "✓" },
];

const faqs: FAQItem[] = [
  {
    question: "Can I switch plans later?",
    answer: "Yes, you can upgrade or downgrade at any time. Upgrades take effect immediately, while downgrades apply at the start of your next billing cycle.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, ACH transfers, and wire transfers for annual Business plans. Invoices are available for Team and Business tiers.",
  },
  {
    question: "Is there a free trial?",
    answer: "Solo and Team plans include a 14-day free trial with full feature access. No credit card required to start. Business plans offer a guided demo instead.",
  },
  {
    question: "What happens when my trial ends?",
    answer: "You'll be prompted to choose a plan and enter payment details. If you don't upgrade, your account will be paused but your data is preserved for 90 days.",
  },
  {
    question: "Do you offer discounts for nonprofits or education?",
    answer: "Yes, we offer 50% off for qualified nonprofits and educational institutions. Contact our sales team with your organization details to apply.",
  },
  {
    question: "Can I cancel anytime?",
    answer: "Monthly plans can be cancelled anytime with access continuing through the paid period. Annual plans are non-refundable but can be set to not auto-renew.",
  },
];

export default function PricingPage() {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");

  const getPrice = (plan: Plan) => (period === "monthly" ? plan.monthlyPrice : plan.yearlyPrice);
  const getPeriodLabel = () => (period === "monthly" ? "/month" : "/year");
  const getAnnualSavings = (plan: Plan) => Math.round((1 - plan.yearlyPrice / plan.monthlyPrice) * 100);

  return (
    <div className="min-h-screen bg-paper">
      <main className="mx-auto max-w-7xl px-6 py-12 md:px-16">
        <PageHeader
          title="Pricing"
          description="Simple, transparent pricing that scales with you. All plans include a 14-day free trial."
        />

        {/* Billing Toggle */}
        <div className="mb-12 flex items-center justify-center gap-3">
          <span className="font-body text-sm text-ink-2">Bill</span>
          <div className="inline-flex rounded-md border border-line bg-paper p-1">
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
              <Badge tone="positive" className="ml-2">
                Save {getAnnualSavings(plans[1])}%
              </Badge>
            </Button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="mb-16 grid gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative flex flex-col ${plan.popular ? "border-accent" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge tone="accent">Most popular</Badge>
                </div>
              )}
              <div className="mb-6">
                <h3 className="font-display text-lg font-medium text-ink">{plan.name}</h3>
                <p className="mt-1 font-body text-sm text-ink-2">{plan.description}</p>
              </div>
              <div className="mb-6 flex items-baseline gap-1">
                <span className="font-display text-4xl font-medium text-ink tabular-nums">
                  ${getPrice(plan)}
                </span>
                <span className="font-body text-base text-ink-2">{getPeriodLabel()}</span>
              </div>
              {period === "yearly" && (
                <p className="mb-4 font-body text-sm text-moss">
                  Billed ${plan.yearlyPrice * 12}/year
                </p>
              )}
              <ul className="mb-8 flex-1 flex flex-col gap-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 font-body text-sm text-ink-2">
                    <span aria-hidden className="text-moss shrink-0">✓</span>
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

        {/* Feature Comparison */}
        <section className="mb-16">
          <h2 className="mb-8 font-display text-xl font-medium text-ink md:text-2xl">
            Feature comparison
          </h2>
          <div className="overflow-x-auto border-y border-ink">
            <table className="w-full border-collapse font-body text-sm">
              <thead className="bg-paper-2">
                <tr>
                  <th className="px-3 py-3 font-medium text-ink-2 text-left">Feature</th>
                  {plans.map((plan) => (
                    <th
                      key={plan.id}
                      className={`px-3 py-3 font-medium text-center ${
                        plan.popular ? "text-accent" : "text-ink-2"
                      }`}
                    >
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {featureComparison.map((row, index) => (
                  <tr
                    key={row.feature}
                    className={`border-t border-line hover:bg-paper-2 ${
                      index % 2 === 0 ? "" : "bg-paper"
                    }`}
                  >
                    <td className="px-3 py-3 font-medium text-ink">{row.feature}</td>
                    <td className="px-3 py-3 text-center text-ink-2">{row.solo}</td>
                    <td className="px-3 py-3 text-center text-ink">{row.team}</td>
                    <td className="px-3 py-3 text-center text-ink">{row.business}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="mb-8 font-display text-xl font-medium text-ink md:text-2xl">
            Frequently asked questions
          </h2>
          <div className="flex flex-col gap-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="p-0 overflow-hidden">
                <details className="group">
                  <summary className="flex items-center justify-between gap-4 p-6 list-none cursor-pointer">
                    <span className="font-body text-base text-ink">{faq.question}</span>
                    <span
                      aria-hidden
                      className="font-display text-xl text-ink-3 transition-transform group-open:rotate-90"
                    >
                      +
                    </span>
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
    </div>
  );
}
