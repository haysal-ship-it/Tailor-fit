'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useScroll, useMotionValueEvent, useReducedMotion, type MotionValue } from 'framer-motion';
import { FeatureBackdrop } from './LandingMotion';
import styles from './landing.module.css';

type FeatureId = 'measurements' | 'clients' | 'orders';
const FEATURES: { id: FeatureId; title: string; body: string }[] = [
  { id: 'measurements', title: 'Measurements', body: 'Rotate the mannequin, select a measurement point and enter its value. Garment templates help you choose the fields you need, while List view makes keyboard entry straightforward.' },
  { id: 'clients', title: 'Client records', body: 'Keep contact details, saved measurements and order history together. Review an earlier fitting and use its measurements as the starting point for a new garment.' },
  { id: 'orders', title: 'Orders and due dates', body: 'Keep the garment brief, reference images, price and due date with each order. Review its status and use the calendar to see the work coming up.' },
];

function FeatureVisual({ id }: { id: FeatureId }) {
  return <div className={styles.featureVisual}>
    <FeatureBackdrop />
    {id === 'measurements' && <div className={`${styles.productSurface} ${styles.mannequinSurface}`}>
      <Image src="/assets/landing/mannequin-preview.webp" alt="Original TailorFit mannequin with garment template, form and measurement-view controls"
        width={960} height={1212} sizes="(min-width: 640px) 380px, calc(100vw - 72px)" />
    </div>}
    {id === 'clients' && <div className={styles.productSurface} role="img" aria-label="Example client record: Adriana Kunle, bust 94 cm, waist 72 cm, hips 102 cm, with four saved garments">
      <div className={styles.previewHeader}>
        <div><p className={styles.previewName}>Adriana Kunle</p><p className={styles.previewMuted}>Last fitting: 14 Oct 2026</p></div>
        <span className={styles.badge}>Active client</span>
      </div>
      <div className={styles.measurements}>
        {[['Bust', '94 cm'], ['Waist', '72 cm'], ['Hips', '102 cm']].map(([label, value]) =>
          <div key={label} className={styles.measurement}><span className={styles.previewMuted}>{label}</span><strong>{value}</strong></div>)}
      </div>
      <div className={styles.previewFooter}><span>4 garments created</span><span>Saved measurements</span></div>
    </div>}
    {id === 'orders' && <div className={styles.productSurface} role="img" aria-label="Example garment order: Silk Evening Gown for Chloe Dallas, 140,000 naira, pickup 9 November 2026">
      <div className={styles.previewHeader}><span className={styles.previewName}>Order #ORD-2026-09</span><span className={`${styles.badge} ${styles.dueBadge}`}>Due in 4 days</span></div>
      <div className={styles.orderDetails}><p className={styles.previewName}>Silk Evening Gown</p><p className={styles.previewMuted}>Client: Chloe Dallas</p><strong>₦140,000</strong></div>
      <div className={styles.pickup}><span className={styles.previewMuted}>Pickup scheduled</span><strong>9 Nov 2026</strong></div>
    </div>}
  </div>;
}

function ProgressItem({ title, progress, active, reduced, onSelect }: {
  title: string; progress: MotionValue<number>; active: boolean; reduced: boolean; onSelect: () => void;
}) {
  return <button type="button" className={styles.progressButton} onClick={onSelect} aria-current={active ? 'true' : undefined}>
    <span>{title}</span>
    <span className={styles.track} aria-hidden="true">
      {active && <motion.span style={{ scaleX: reduced ? 1 : progress }} />}
    </span>
  </button>;
}

export function FeaturesSection() {
  const reduceMotion = useReducedMotion();
  const [activeFeature, setActiveFeature] = useState<FeatureId>('measurements');
  const measurementsRef = useRef<HTMLElement>(null);
  const clientsRef = useRef<HTMLElement>(null);
  const ordersRef = useRef<HTMLElement>(null);
  const refs = { measurements: measurementsRef, clients: clientsRef, orders: ordersRef };
  const offset: ['start 65%', 'end 35%'] = ['start 65%', 'end 35%'];
  const progress = {
    measurements: useScroll({ target: measurementsRef, offset }).scrollYProgress,
    clients: useScroll({ target: clientsRef, offset }).scrollYProgress,
    orders: useScroll({ target: ordersRef, offset }).scrollYProgress,
  };
  const updateActiveCard = () => {
    setActiveFeature(progress.orders.get() > 0.05 ? 'orders' : progress.clients.get() > 0.05 ? 'clients' : 'measurements');
  };
  useMotionValueEvent(progress.measurements, 'change', updateActiveCard);
  useMotionValueEvent(progress.clients, 'change', updateActiveCard);
  useMotionValueEvent(progress.orders, 'change', updateActiveCard);

  const scrollToFeature = (id: FeatureId) => {
    const target = refs[id].current;
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth', block: 'start' });
  };

  return <section id="features" tabIndex={-1} aria-labelledby="features-heading" className={`${styles.section} ${styles.container}`}>
    <div className={styles.featureGrid}>
      <div className={styles.featureIntro}>
        <div><h2 id="features-heading" className={styles.heading}>The details behind every garment, together.</h2>
          <p className={styles.body}>Move between measurements, client records and orders without piecing together scattered notes.</p></div>
        <nav className={styles.featureNav} aria-label="Feature sections">
          {FEATURES.map(f => <ProgressItem key={f.id} title={f.title} progress={progress[f.id]} active={activeFeature === f.id} reduced={!!reduceMotion} onSelect={() => scrollToFeature(f.id)} />)}
        </nav>
      </div>
      <div className={styles.featureList}>
        {FEATURES.map(f => <article key={f.id} id={`feature-${f.id}`} tabIndex={-1} ref={refs[f.id]} className={styles.feature} aria-labelledby={`title-${f.id}`}>
          <div><h3 id={`title-${f.id}`} className={styles.featureTitle}>{f.title}</h3><p className={styles.body}>{f.body}</p></div>
          <FeatureVisual id={f.id} />
        </article>)}
      </div>
    </div>
  </section>;
}
