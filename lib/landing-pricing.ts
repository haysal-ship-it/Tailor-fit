export type BillingPeriod = "monthly" | "yearly";
export function planPrice(monthlyNaira: number, period: BillingPeriod) {
  const annual = monthlyNaira * 12;
  const total =
    period === "yearly" ? Math.round(annual * 90) / 100 : monthlyNaira;
  return {
    total,
    saving: period === "yearly" ? annual - total : 0,
    monthlyEquivalent: period === "yearly" ? total / 12 : total,
  };
}
export const LANDING_PLANS = [
  {
    name: "Free",
    monthly: 0,
    description:
      "Perfect for getting started and getting familiar with the tool",
    features: [
      "Client profiles and contact details.",
      "Interactive mannequin and List view.",
      "Measurements in inches or centimetres.",
    ],
  },
  {
    name: "Solo",
    monthly: 5000,
    description: "For independent tailors and fashion designers",
    features: [
      "Everything in Free",
      "Higher client, order and image-storage allowances.",
      "Garment blueprints and custom measurement fields.",
    ],
  },
  {
    name: "Fashion House",
    monthly: 10000,
    description: "For established fashion businesses with a larger clientele",
    features: [
      "Everything in Solo",
      "The highest client and order allowances.",
      "More storage for style-reference images.",
    ],
  },
] as const;
