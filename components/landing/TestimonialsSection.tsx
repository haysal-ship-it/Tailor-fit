"use client";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { SolvaReveal as Reveal } from "./SolvaReveal";
import styles from "./landing.module.css";
const testimonials = [
  {
    name: "Fiona Ezechukwu",
    business: "Eze Fashion",
    quote:
      "The mannequin makes recording measurements feel straightforward. I can see which measurement I’m entering instead of working through a long, confusing list.",
    rating: "4.0",
    star: "086e7.svg",
    count: 4,
    angle: -10,
  },
  {
    name: "Adewale Precious",
    business: "Hapteez Couture",
    quote:
      "Having each client’s measurements saved in one place makes repeat orders so much easier. I can pick up where we left off without searching through my notebook.",
    rating: "5.0",
    star: "739ca.svg",
    count: 5,
    angle: 0,
  },
  {
    name: "Rayan Yusuf",
    business: "Rusuf Clothier",
    quote:
      "When several outfits are in progress, it’s easy to lose track. TailorFit helps me see what’s due next and plan my sewing around it.",
    rating: "5.0",
    star: "8b6d2.svg",
    count: 5,
    angle: 10,
  },
];
export function TestimonialsSection() {
  const reduced = useReducedMotion();
  return (
    <section
      id="testimonials"
      tabIndex={-1}
      className={`${styles.container} ${styles.section}`}
      aria-labelledby="testimonials-heading"
    >
      <Reveal className={styles.faqIntro}>
        <h2 id="testimonials-heading" className={styles.heading}>
          In the words of the people doing the fittings.
        </h2>
        <p className={styles.body}>
          Hear how tailors and fashion designers use TailorFit in their daily
          work.
        </p>
      </Reveal>
      <div className={styles.testimonialGrid}>
        {testimonials.map((item,index) => (
          <Reveal key={item.name} delay={index*100}><motion.figure
            className={styles.testimonialCard}
            initial={false}
            style={{
              transform: reduced ? "rotate(0deg)" : `rotate(${item.angle}deg)`,
            }}
            whileInView={{ transform: "rotate(0deg)" }}
            viewport={{ amount: 0.25, once: true }}
            transition={{
              duration: reduced ? 0 : 0.65,
              ease: [0.23, 1, 0.32, 1],
            }}
          >
            <figcaption>
              <Image
                src="/assets/landing/revision/f85a2.svg"
                alt=""
                width={60}
                height={60}
              />
              <strong>{item.name}</strong>
              <span>{item.business}</span>
            </figcaption>
            <div>
              <blockquote>“{item.quote}”</blockquote>
              <div
                className={styles.rating}
                aria-label={`${item.rating} out of 5 stars`}
              >
                {Array.from({ length: item.count }, (_, i) => (
                  <Image
                    key={i}
                    src={`/assets/landing/revision/${item.star}`}
                    alt=""
                    width={16}
                    height={16}
                  />
                ))}
                <span>{item.rating}</span>
              </div>
            </div>
          </motion.figure></Reveal>
        ))}
      </div>
    </section>
  );
}
