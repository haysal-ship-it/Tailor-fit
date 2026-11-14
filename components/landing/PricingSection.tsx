"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LANDING_PLANS,
  planPrice,
  type BillingPeriod,
} from "@/lib/landing-pricing";
import { SolvaReveal as Reveal } from "./SolvaReveal";
import styles from "./landing.module.css";
export function PricingSection() {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const money = (value: number) => `₦${value.toLocaleString("en-NG")}`;
  return (
    <section
      id="pricing"
      tabIndex={-1}
      className={`${styles.container} ${styles.section}`}
      aria-labelledby="pricing-heading"
    >
      <Reveal className={styles.faqIntro}>
        <h2 id="pricing-heading" className={styles.heading}>
          A plan for every stage of your fashion business.
        </h2>
        <p className={styles.body}>
          Start with Free, organise your independent practice with Solo, or
          choose Fashion House for a larger client book and order workload.
        </p>
        <div
          className={styles.billingToggle}
          role="group"
          aria-label="Billing period"
        >
          {(["monthly", "yearly"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={period === value}
              onClick={() => setPeriod(value)}
            >
              {value === "monthly" ? "Monthly" : "Yearly"}
              {value === "yearly" && <span>Save 10%</span>}
            </button>
          ))}
        </div>
      </Reveal>
      <div className={styles.pricingGrid}>
        {LANDING_PLANS.map((plan,index) => {
          const price = planPrice(plan.monthly, period);
          return (
            <Reveal role="article" delay={index*60}
              key={plan.name}
              className={`${styles.pricingCard} ${plan.name === "Solo" ? styles.featuredPlan : ""}`}
            >
              <h3>{plan.name}</h3>
              <div className={styles.pricingSurface}>
                <p>{plan.description}</p>
                <div aria-live="polite" aria-atomic="true">
                  <div className={styles.price}>
                    <strong>{money(price.total)}</strong>
                    <span>/{period === "yearly" ? "year" : "month"}</span>
                  </div>
                  {period === "yearly" && plan.monthly > 0 && (
                    <p className={styles.annualNote}>
                      Billed yearly · {money(price.monthlyEquivalent)}/month
                      equivalent
                      <br />
                      Save {money(price.saving)} a year
                    </p>
                  )}
                </div>
                <Link href="/signup" className={styles.button}>
                  {plan.monthly === 0 ? "Get started with Free" : "Get started"}
                </Link>
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <Image
                        src="/assets/landing/revision/cb20b.svg"
                        alt=""
                        width={24}
                        height={24}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          );
        })}
      </div>
      <p className={styles.pricingDisclosure}>
        Paid plans are coming soon. You can create an account and explore
        TailorFit; checkout is not available yet.
      </p>
    </section>
  );
}
