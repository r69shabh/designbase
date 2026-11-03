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
    yearlyPrice: 10,
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
    monthlyPrice: 36,
    yearlyPrice: 30,
    features: [
      "Everything in Solo",
      "5 team members",
      "100 GB storage",
      "Advanced analytics",
      "Priority support",
      "SSO authentication",
      "Audit logs",
    ],
    cta: "Start free trial",
    popular: true,
  },
  {
    name: "Business",
    description: "For companies with compliance needs",
    monthlyPrice: 120,
    yearlyPrice: 100,
    features: [
      "Everything in Team",
      "Unlimited members",
      "1 TB storage",
      "Custom analytics",
      "Dedicated support",
      "SLA guarantee",
      "On-premise option",
      "Custom contracts",
    ],
    cta: "Contact sales",
  },
];

const features = [
  { feature: "Projects", solo: "Unlimited", team: "Unlimited", business: "Unlimited" },
  { feature: "Team members", solo: "1", team: "5", business: "Unlimited" },
  { feature: "Storage", solo: "10 GB", team: "100 GB", business: "1 TB" },
  { feature: "Analytics", solo: "Basic", team: "Advanced", business: "Custom" },
  { feature: "Support", solo: "Email", team: "Priority", business: "Dedicated" },
  { feature: "API access", solo: "Yes", team: "Yes", business: "Yes" },
  { feature: "SSO", solo: "No", team: "Yes", business: "Yes" },
  { feature: "Audit logs", solo: "No", team: "Yes", business: "Yes" },
  { feature: "SLA", solo: "No", team: "No", business: "Yes" },
  { feature: "On-premise", solo: "No", team: "No", business: "Yes" },
];

const faqs = [
  {
    question: "Can I switch plans later?",
    answer: "Yes, you can upgrade or downgrade at any time. Upgrades take effect immediately, and downgrades apply at the end of your current billing period.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, ACH transfers, and wire transfers for annual Business plans. Invoices are available for yearly commitments.",
  },
  {
    question: "Is there a free trial?",
    answer: "Solo and Team plans include a 14-day free trial. No credit card required to start. Business plans require a demo call to evaluate fit.",
  },
  {
    question: "What happens when my trial ends?",
    answer: "You'll be prompted to choose a plan and enter payment details. If you don't upgrade, your account will be paused but your data is preserved for 90 days.",
  },
  {
    question: "Do you offer discounts for nonprofits or education?",
    answer: "Yes, we offer 50% off for qualified nonprofits and educational institutions. Contact sales with your organization details to apply.",
  },
];

export default function PricingPage() {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const getPrice = (plan: Plan) => period === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
  const getPeriodLabel = () => period === "monthly" ? "/month" : "/year";

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <PageHeader
        title="Pricing"
        description="Simple, transparent pricing. No hidden fees. All plans include a 14-day free trial."
      />

      {/* Billing Toggle */}
      <div className="mb-12 flex items-center justify-center gap-4">
        <span className={`font-body text-sm text-${period === "monthly" ? "ink" : "ink-3"}`}>Monthly</span>
        <div className="inline-flex items-center gap-1 rounded-md border border-line bg-paper-2 p-1">
          <Button
            variant={period === "monthly" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setPeriod("monthly")}
            className="rounded-sm"
          >
            Monthly
          </Button>
          <Button
            variant={period === "yearly" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setPeriod("yearly")}
            className="rounded-sm"
          >
            Yearly
            <Badge tone="positive" className="ml-1">Save 17%</Badge>
          </Button>
        </div>
        <span className={`font-body text-sm text-${period === "yearly" ? "ink" : "ink-3"}`}>Yearly</span>
      </div>

      {/* Plan Cards */}
      <div className="mb-16 grid gap-8 md:grid-cols-3">
        {plans.map((plan, index) => (
          <Card
            key={plan.name}
            className={`flex flex-col ${plan.popular ? "border-accent relative" : ""}`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge tone="accent">Most popular</Badge>
              </div>
            )}
            <header className="mb-6">
              <h3 className="font-display text-lg font-medium text-ink">{plan.name}</h3>
              <p className="mt-2 font-body text-sm text-ink-2">{plan.description}</p>
            </header>
            <div className="mb-6 flex items-baseline gap-1">
              <span className="font-mono text-3xl font-medium text-ink tabular-nums">${getPrice(plan)}</span>
              <span className="font-body text-base text-ink-2">{getPeriodLabel()}</span>
              {period === "yearly" && (
                <span className="ml-2 font-body text-xs text-moss">Billed ${getPrice(plan) * 12}/year</span>
              )}
            </div>
            <ul className="mb-8 flex-1 space-y-3" role="list">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3 font-body text-sm text-ink-2">
                  <svg className="mt-0.5 flex-shrink-0 size-5 text-moss" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            <footer>
              <Button
                variant={plan.popular ? "primary" : "secondary"}
                className="w-full"
                size="md"
              >
                {plan.cta}
              </Button>
            </footer>
          </Card>
        ))}
      </div>

      {/* Feature Comparison */}
      <section className="mb-16" aria-labelledby="comparison-heading">
        <h2 id="comparison-heading" className="font-display text-xl font-medium text-ink mb-6">Feature comparison</h2>
        <div className="overflow-x-auto rounded-md border border-line">
          <DataTable
            columns={[
              { key: "feature", header: "Feature", className: "font-body text-sm text-ink-2 w-48" },
              { key: "solo", header: "Solo", className: "font-body text-sm text-ink text-center" },
              { key: "team", header: "Team", className: "font-body text-sm text-ink text-center" },
              { key: "business", header: "Business", className: "font-body text-sm text-ink text-center" },
            ]}
            rows={features}
            keyField="feature"
            renderCell={(row, col) => {
              if (col.key === "feature") {
                return <span className="font-body text-sm text-ink-2">{row.feature}</span>;
              }
              const value = row[col.key as keyof typeof row] as string;
              const isYes = value === "Yes";
              const isNo = value === "No";
              const isUnlimited = value === "Unlimited";
              return (
                <span className={`font-body text-sm ${isYes ? "text-moss" : isNo ? "text-ink-3" : "text-ink"}`}>
                  {isYes ? (
                    <svg className="mx-auto size-5 text-moss" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : isNo ? (
                    <svg className="mx-auto size-5 text-ink-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    value
                  )}
                </span>
              );
            }}
          />
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="font-display text-xl font-medium text-ink mb-6">Frequently asked questions</h2>
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <Card key={index} className="overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full flex items-center justify-between gap-4 p-0 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                aria-expanded={openFaq === index}
              >
                <h3 className="font-display text-base font-medium text-ink px-6 py-4">{faq.question}</h3>
                <svg
                  className={`flex-shrink-0 size-5 text-ink-3 transition-transform ${openFaq === index ? "rotate-180" : ""}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </button>
              {openFaq === index && (
                <div className="border-t border-line bg-paper-2 px-6 pb-4">
                  <p className="font-body text-sm text-ink-2">{faq.answer}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
