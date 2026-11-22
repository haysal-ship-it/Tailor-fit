'use client';

import { useState, useEffect, useRef, type MouseEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import styles from './landing.module.css';

export const NAV_LINKS = [['#how-it-works', 'How it works'], ['#features', 'Features'], ['#pricing', 'Pricing'], ['#testimonials', 'Testimonials'], ['#faq', 'FAQ']] as const;

export function LandingNavbar({ onLandingPage = false }: { onLandingPage?: boolean }) {
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
    const desktop = window.matchMedia('(min-width: 1100px)');
    const resize = () => { if (desktop.matches) setMobileMenuOpen(false); };
    const closeOnNavigation = () => setMobileMenuOpen(false);
    window.addEventListener('popstate', closeOnNavigation);
    window.addEventListener('hashchange', closeOnNavigation);
    document.addEventListener('keydown', close);
    document.addEventListener('pointerdown', outside);
    desktop.addEventListener('change', resize);
    return () => {
      window.removeEventListener('popstate', closeOnNavigation);
      window.removeEventListener('hashchange', closeOnNavigation);
      document.removeEventListener('keydown', close);
      document.removeEventListener('pointerdown', outside);
      desktop.removeEventListener('change', resize);
    };
  }, [mobileMenuOpen]);

  const navigateSection = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    setMobileMenuOpen(false);
    if (!onLandingPage) return;
    const hash = event.currentTarget.hash;
    const target = document.getElementById(hash.slice(1));
    if (!target) return;
    event.preventDefault();
    window.history.pushState(null, '', hash);
    target.focus({ preventScroll: true });
    target.scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth', block: 'start' });
  };

  return <div className={styles.page}>
    <header className={styles.header} ref={menuContainer} data-open={mobileMenuOpen}>
      <div className={styles.navPill}>
        <Link href="/" className={styles.logo} aria-label="TailorFit home" onClick={() => setMobileMenuOpen(false)}>
          <Image src="/assets/landing/revision/8ee16.png" alt="TailorFit" width={142} height={32} priority />
        </Link>
        <nav className={styles.desktopNav} aria-label="Main navigation">
          {NAV_LINKS.map(([href, label]) => <a key={href} href={onLandingPage ? href : `/${href}`} className={`${styles.navLink} ${styles.sectionNavLink}`} onClick={navigateSection}><span className={styles.navLabel}>{label}</span></a>)}
        </nav>
        <div className={styles.desktopActions}>
          <Link href="/signin" className={styles.navLink}>Log in</Link>
          <Link href="/signup" className={`${styles.button} ${styles.smallButton}`}>Sign up</Link>
        </div>
        <div className={styles.mobileActions}>
          <button ref={menuButton} type="button" className={styles.menuButton}
            aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={mobileMenuOpen} aria-controls="landing-mobile-menu" onClick={() => setMobileMenuOpen(open => !open)}>
            <span className={styles.menuGlyph} aria-hidden="true"><i/><i/><i/></span>
          </button>
        </div>
      </div>
      <motion.div initial={false} animate={{height: mobileMenuOpen ? 'auto' : 0}}
        transition={{duration: reduceMotion ? 0 : mobileMenuOpen ? 0.24 : 0.18, ease: [0.23, 1, 0.32, 1]}}
        className={styles.menuReveal} inert={!mobileMenuOpen} aria-hidden={!mobileMenuOpen}>
        <nav id="landing-mobile-menu" aria-label="Mobile navigation" className={styles.mobileMenu}>
          {NAV_LINKS.map(([href, label]) => <a key={href} href={onLandingPage ? href : `/${href}`} className={`${styles.navLink} ${styles.sectionNavLink}`} onClick={navigateSection}><span className={styles.navLabel}>{label}</span></a>)}
          <div className={styles.menuActions}>
            <Link href="/signup" className={`${styles.button} ${styles.smallButton}`} onClick={() => setMobileMenuOpen(false)}>Sign up</Link>
            <Link href="/signin" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>Log in</Link>
          </div>
        </nav>
      </motion.div>
    </header>
  </div>;
}
