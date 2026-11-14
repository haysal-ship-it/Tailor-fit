'use client';

import { useState, type MouseEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Minus, ArrowRight } from 'lucide-react';
import { FeaturesSection } from './FeaturesSection';
import { PricingSection } from './PricingSection';
import { TestimonialsSection } from './TestimonialsSection';
import { WorkflowSection } from './WorkflowSection';
import { SolvaReveal as Reveal } from './SolvaReveal';
import { SolvaReveal } from './SolvaReveal';
import { FAQ_ITEMS } from './faq';
import styles from './landing.module.css';

import { LandingNavbar, NAV_LINKS } from './LandingNavbar';

export function LandingPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const navigateSection = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const hash = event.currentTarget.hash;
    const target = document.getElementById(hash.slice(1));
    if (!target) return;
    event.preventDefault();
    window.history.pushState(null, '', hash);
    target.focus({ preventScroll: true });
    target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  };

  return <div className={styles.page}>
    <a href="#landing-main" className={styles.skip} onClick={navigateSection}>Skip to content</a>
    <LandingNavbar onLandingPage />
    <main id="landing-main" tabIndex={-1}>
      <section className={styles.hero} aria-labelledby="hero-heading">
        <Image src="/assets/landing/revision/d42be.png" alt="" fill priority sizes="100vw" className={styles.heroSky} />
        <div className={styles.heroOverlay} aria-hidden="true" />
        <div className={`${styles.container} ${styles.heroCopy}`}>
          <SolvaReveal><h1 id="hero-heading" className={styles.heroTitle}>
            <span>Made to measure. </span><span className={styles.serif}>Built to keep you organized.</span>
          </h1></SolvaReveal>
          <SolvaReveal><p className={styles.body}>Capture measurements with an interactive mannequin, save client details, and keep track of what&apos;s due.</p></SolvaReveal>
          <SolvaReveal><Link href="/app?tab=overview" className={styles.button}>Open TailorFit</Link></SolvaReveal>
        </div>
        <SolvaReveal hero delay={120} className={styles.heroPreview}>
          <picture>
            <source media="(max-width: 639px)" srcSet="/assets/landing/mannequin-preview.webp" width={960} height={1212} />
            {/* Art direction preserves the original screenshot at both sizes. */}
            <img src="/assets/landing/revision/aeb99.png" width={2080} height={1300}
              alt="TailorFit workspace showing the original mannequin and garment measurement controls" fetchPriority="high" />
          </picture>
        </SolvaReveal>
      </section>
      <WorkflowSection />
      <FeaturesSection />
      <PricingSection />
      <TestimonialsSection />
      <section id="faq" tabIndex={-1} aria-labelledby="faq-heading" className={`${styles.container} ${styles.section}`}>
        <Reveal className={styles.faqIntro}>
          <h2 id="faq-heading" className={styles.heading}>Frequently asked questions</h2>
          <p className={styles.body}>Get familiar with how TailorFit handles measurements, client records and your saved work.</p>
        </Reveal>
        <div className={styles.faqList}>
          {FAQ_ITEMS.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return <Reveal key={faq.question} className={styles.faqItem} delay={(index%3)*40}>
              <h3><button id={`faq-trigger-${index}`} type="button" className={styles.faqButton}
                aria-expanded={isOpen} aria-controls={`faq-answer-${index}`} onClick={() => setOpenFaqIndex(isOpen ? null : index)}>
                {faq.question}<span className={styles.faqIcon} aria-hidden="true">{isOpen ? <Minus size={20} /> : <Plus size={20} />}</span>
              </button></h3>
              <div id={`faq-answer-${index}`} role="region" aria-labelledby={`faq-trigger-${index}`}
                aria-hidden={!isOpen} inert={!isOpen} className={styles.answer} data-open={isOpen}>
                <div><p className={styles.body}>{faq.answer}</p></div>
              </div>
            </Reveal>;
          })}
        </div>
      </section>
      <section id="cta-banner" className={`${styles.cta} ${styles.section}`} aria-labelledby="cta-heading">
        <div className={styles.ctaBackdrop} aria-hidden="true"><Image src="/assets/landing/revision/3a06f.png" alt="" fill sizes="100vw" /></div>
        <Reveal className={`${styles.container} ${styles.ctaInner}`}>
          <div className={styles.ctaCopy}>
            <h2 id="cta-heading" className={styles.heading}>Give every fitting a place to come back to.</h2>
            <p className={styles.body}>Bring your client details, measurements and next garment order together in TailorFit.</p>
          </div>
          <div className={styles.ctaActions}>
            <Link href="/signup" className={styles.navLink}>Sign up</Link>
            <Link href="/app?tab=overview" className={styles.button}>Open TailorFit <ArrowRight size={20} aria-hidden="true" /></Link>
          </div>
        </Reveal>
      </section>
    </main>
    <footer className={styles.footer}>
      <Reveal className={`${styles.container} ${styles.footerTop}`}>
        <div className={styles.footerBrand}>
          <Image src="/assets/landing/revision/8ee16.png" alt="TailorFit" width={160} height={36} />
          <p className={styles.body}>A workspace for client measurements and garment orders.</p>
        </div>
        <div className={styles.footerLinks}>
          <div><h3>Navigation</h3>{NAV_LINKS.map(([href, label]) => <a key={href} href={href} onClick={navigateSection}>{label}</a>)}</div>
          <div><h3>Legal</h3><Link href="/terms">Terms</Link><Link href="/privacy">Privacy Policy</Link></div>
          <div><h3>Contact</h3><a href="tel:+2348104871644">08104871644</a><a href="mailto:Haysal618@gmail.com">Haysal618@gmail.com</a></div>
        </div>
      </Reveal>
      <p className={`${styles.container} ${styles.copyright}`}>&copy; {new Date().getFullYear()} TailorFit. Designed and Developed by Sal</p>
    </footer>
  </div>;
}
