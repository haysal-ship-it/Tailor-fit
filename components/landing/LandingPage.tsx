'use client';

import { useState, useEffect, useRef, type MouseEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, Plus, Minus, ArrowRight } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { FeaturesSection } from './FeaturesSection';
import { WorkflowSection } from './WorkflowSection';
import { Reveal } from './LandingMotion';
import { FAQ_ITEMS } from './faq';
import styles from './landing.module.css';

const NAV_LINKS = [['#how-it-works', 'How it works'], ['#features', 'Features'], ['#faq', 'FAQ']] as const;

export function LandingPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const menuContainer = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMobileMenuOpen(false); menuButton.current?.focus(); }
    };
    const outside = (event: PointerEvent) => {
      if (!menuContainer.current?.contains(event.target as Node)) setMobileMenuOpen(false);
    };
    const desktop = window.matchMedia('(min-width: 768px)');
    const resize = () => { if (desktop.matches) setMobileMenuOpen(false); };
    document.addEventListener('keydown', close);
    document.addEventListener('pointerdown', outside);
    desktop.addEventListener('change', resize);
    return () => {
      document.removeEventListener('keydown', close);
      document.removeEventListener('pointerdown', outside);
      desktop.removeEventListener('change', resize);
    };
  }, [mobileMenuOpen]);

  const navigateSection = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const hash = event.currentTarget.hash;
    const target = document.getElementById(hash.slice(1));
    if (!target) return;
    event.preventDefault();
    setMobileMenuOpen(false);
    window.history.pushState(null, '', hash);
    target.focus({ preventScroll: true });
    target.scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth', block: 'start' });
  };

  return <div className={styles.page}>
    <a href="#landing-main" className={styles.skip} onClick={navigateSection}>Skip to content</a>
    <header className={styles.header} ref={menuContainer}>
      <div className={styles.navPill}>
        <Link href="/" className={styles.logo} aria-label="TailorFit home">
          <Image src="/assets/landing/logo-black.png" alt="TailorFit" width={142} height={32} priority />
        </Link>
        <nav className={styles.desktopNav} aria-label="Main navigation">
          {NAV_LINKS.map(([href, label]) => <a key={href} href={href} className={styles.navLink} onClick={navigateSection}>{label}</a>)}
        </nav>
        <div className={styles.desktopActions}>
          <Link href="/signin" className={styles.navLink}>Log in</Link>
          <Link href="/signup" className={`${styles.button} ${styles.smallButton}`}>Sign up</Link>
        </div>
        <div className={styles.mobileActions}>
          <Link href="/signup" className={`${styles.button} ${styles.smallButton}`}>Sign up</Link>
          <button ref={menuButton} type="button" className={styles.menuButton}
            aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={mobileMenuOpen} aria-controls="landing-mobile-menu" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {mobileMenuOpen && <motion.nav key="mobile-menu" id="landing-mobile-menu" aria-label="Mobile navigation" className={styles.mobileMenu}
          initial={reduceMotion ? false : { opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0, transition: { duration: reduceMotion ? 0 : 0.18, ease: [0.23, 1, 0.32, 1] } }}
          exit={{ opacity: 0, y: reduceMotion ? 0 : -6, transition: { duration: reduceMotion ? 0 : 0.12 } }}>
          {NAV_LINKS.map(([href, label]) => <a key={href} href={href} className={styles.navLink} onClick={navigateSection}>{label}</a>)}
          <div className={styles.menuActions}>
            <Link href="/signin" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>Log in</Link>
            <Link href="/app?tab=overview" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>Open Studio <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
        </motion.nav>}
      </AnimatePresence>
    </header>
    <main id="landing-main" tabIndex={-1}>
      <section className={styles.hero} aria-labelledby="hero-heading">
        <Image src="/assets/landing/hero-sky.webp" alt="" fill priority sizes="100vw" className={styles.heroSky} />
        <div className={styles.heroOverlay} aria-hidden="true" />
        <div className={`${styles.container} ${styles.heroCopy}`}>
          <h1 id="hero-heading" className={styles.heroTitle}>
            <span>Made to measure.</span><span className={styles.serif}>Built to keep you organized.</span>
          </h1>
          <p className={styles.body}>Capture measurements with an interactive mannequin, save client details, and keep track of what&apos;s due.</p>
          <Link href="/app?tab=overview" className={styles.button}>Open TailorFit</Link>
        </div>
        <Reveal hero className={styles.heroPreview}>
          <picture>
            <source media="(max-width: 639px)" srcSet="/assets/landing/mannequin-preview.webp" width={960} height={1212} />
            {/* Art direction preserves the original screenshot at both sizes. */}
            <img src="/assets/landing/hero-app-preview.webp" width={2080} height={1300}
              alt="TailorFit workspace showing the original mannequin and garment measurement controls" fetchPriority="high" />
          </picture>
        </Reveal>
      </section>
      <WorkflowSection />
      <FeaturesSection />
      <section id="faq" tabIndex={-1} aria-labelledby="faq-heading" className={`${styles.container} ${styles.section}`}>
        <div className={styles.faqIntro}>
          <h2 id="faq-heading" className={styles.heading}>Frequently asked questions</h2>
          <p className={styles.body}>Get familiar with how TailorFit handles measurements, client records and your saved work.</p>
        </div>
        <div className={styles.faqList}>
          {FAQ_ITEMS.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return <div key={faq.question} className={styles.faqItem}>
              <h3><button id={`faq-trigger-${index}`} type="button" className={styles.faqButton}
                aria-expanded={isOpen} aria-controls={`faq-answer-${index}`} onClick={() => setOpenFaqIndex(isOpen ? null : index)}>
                {faq.question}<span className={styles.faqIcon} aria-hidden="true">{isOpen ? <Minus size={20} /> : <Plus size={20} />}</span>
              </button></h3>
              <div id={`faq-answer-${index}`} role="region" aria-labelledby={`faq-trigger-${index}`}
                aria-hidden={!isOpen} inert={!isOpen} className={styles.answer} data-open={isOpen}>
                <div><p className={styles.body}>{faq.answer}</p></div>
              </div>
            </div>;
          })}
        </div>
      </section>
      <section id="cta-banner" className={`${styles.cta} ${styles.section}`} aria-labelledby="cta-heading">
        <div className={styles.ctaBackdrop} aria-hidden="true"><Image src="/assets/landing/cta-banner-bg.webp" alt="" fill sizes="100vw" /></div>
        <div className={`${styles.container} ${styles.ctaInner}`}>
          <div className={styles.ctaCopy}>
            <h2 id="cta-heading" className={styles.heading}>Give every fitting a place to come back to.</h2>
            <p className={styles.body}>Bring your client details, measurements and next garment order together in TailorFit.</p>
          </div>
          <div className={styles.ctaActions}>
            <Link href="/signup" className={styles.navLink}>Sign up</Link>
            <Link href="/app?tab=overview" className={styles.button}>Open TailorFit <ArrowRight size={20} aria-hidden="true" /></Link>
          </div>
        </div>
      </section>
    </main>
    <footer className={styles.footer}>
      <div className={`${styles.container} ${styles.footerTop}`}>
        <div className={styles.footerBrand}>
          <Image src="/assets/landing/logo-black.png" alt="TailorFit" width={160} height={36} />
          <p className={styles.body}>A workspace for client measurements and garment orders.</p>
        </div>
        <div className={styles.footerLinks}>
          <div><h3>Navigation</h3>{NAV_LINKS.map(([href, label]) => <a key={href} href={href} onClick={navigateSection}>{label}</a>)}</div>
          <div><h3>Workspace</h3><Link href="/app?tab=overview">Overview</Link><Link href="/app?tab=clients">Clients</Link><Link href="/app?tab=settings">Settings</Link></div>
          <div><h3>Atelier</h3><span>Local-First Storage</span><span>Zero Data Leakage</span><span>JSON Backups</span></div>
        </div>
      </div>
      <div className={styles.footerArt} aria-hidden="true"><Image src="/assets/landing/footer-toile.webp" alt="" fill sizes="100vw" /></div>
      <p className={`${styles.container} ${styles.copyright}`}>&copy; {new Date().getFullYear()} TailorFit Atelier. Designed for bespoke tailors and dressmakers.</p>
    </footer>
  </div>;
}
