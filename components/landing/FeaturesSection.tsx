'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useScroll, useMotionValueEvent, useReducedMotion, type MotionValue } from 'framer-motion';
import { Reveal } from './LandingMotion';
import styles from './landing.module.css';

type FeatureId = 'measurements' | 'clients' | 'orders';
const FEATURES: { id: FeatureId; title: string; body: string }[] = [
  { id: 'measurements', title: 'Measurements', body: 'Rotate the mannequin, select a measurement point and enter its value. Garment templates help you choose the fields you need, while List view makes keyboard entry straightforward.' },
  { id: 'clients', title: 'Client records', body: 'Keep contact details, saved measurements and order history together. Review an earlier fitting and use its measurements as the starting point for a new garment.' },
  { id: 'orders', title: 'Orders and due dates', body: 'Keep the garment brief, reference images, price and due date with each order. Review its status and use the calendar to see the work coming up.' },
];

function FeatureVisual({ id }: { id: FeatureId }) {
  const assets={measurements:'fbfcc.png',clients:'4bc0a.png',orders:'7050f.png'};
  return <div className={styles.featureVisual} data-feature={id}><Image src={`/assets/landing/revision/${assets[id]}`} alt={id==='measurements'?'TailorFit measurements workspace with original mannequin':id==='clients'?'TailorFit client records and saved fitting cards':'TailorFit garment orders and pickup dates'} fill sizes="(min-width: 1024px) 660px, 100vw" className={styles.featureScreenshot}/></div>;
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
        <Reveal><h2 id="features-heading" className={styles.heading}>The details behind every garment, together.</h2>
          <p className={styles.body}>Move between measurements, client records and orders without piecing together scattered notes.</p></Reveal>
        <nav className={styles.featureNav} aria-label="Feature sections">
          {FEATURES.map(f => <ProgressItem key={f.id} title={f.title} progress={progress[f.id]} active={activeFeature === f.id} reduced={!!reduceMotion} onSelect={() => scrollToFeature(f.id)} />)}
        </nav>
      </div>
      <div className={styles.featureList}>
        {FEATURES.map(f => <article key={f.id} id={`feature-${f.id}`} tabIndex={-1} ref={refs[f.id]} className={styles.feature} aria-labelledby={`title-${f.id}`}>
          <div><h3 id={`title-${f.id}`} className={styles.featureTitle}>{f.title}</h3><p className={styles.body}>{f.body}</p></div>
          <Reveal><FeatureVisual id={f.id} /></Reveal>
        </article>)}
      </div>
    </div>
  </section>;
}
