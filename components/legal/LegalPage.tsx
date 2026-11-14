import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { LEGAL_POLICIES, LEGAL_EFFECTIVE_DATE } from '@/lib/legal-content';
import styles from './legal.module.css';
import { LandingNavbar } from '@/components/landing/LandingNavbar';

function LinkedText({text}:{text:string}) {
  return <>{text.split(/(haysal618@gmail\.com|https:\/\/ndpc\.gov\.ng\/)/g).map((part,index)=>part==='haysal618@gmail.com'?<a key={index} href={`mailto:${part}`}>{part}</a>:part==='https://ndpc.gov.ng/'?<a key={index} href={part}>Nigeria Data Protection Commission</a>:part)}</>;
}

export function LegalPage({kind}:{kind:'privacy'|'terms'}) {
  const policy=LEGAL_POLICIES[kind];
  return <div className={styles.page}>
    <a className={styles.skip} href="#policy-content">Skip to policy</a>
    <div className={styles.navbar}><LandingNavbar /></div>
    <main className={styles.main} id="policy-content" tabIndex={-1}>
      <div className={styles.intro}>
        <Link href="/" className={styles.back}><ArrowLeft size={16} aria-hidden="true"/> Back to TailorFit</Link>
        <h1>{policy.title}</h1>
        <p className={styles.subtitle}>{policy.subtitle}</p>
        <p className={styles.date}>Effective <time dateTime="2026-11-14">{LEGAL_EFFECTIVE_DATE}</time></p>
        <p className={styles.description}>{policy.intro}</p>
      </div>
      <div className={styles.layout}>
        <aside className={styles.contents}><nav aria-label="On this page"><h2>On this page</h2><ol>{policy.sections.map((section,index)=><li key={section.id}><a href={`#${section.id}`}><span aria-hidden="true">{String(index+1).padStart(2,'0')}</span>{section.title}</a></li>)}</ol></nav></aside>
        <div className={styles.sections}>{policy.sections.map((section,index)=><section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`} className={styles.section} tabIndex={-1}>
          <div className={styles.sectionHeading}><span className={styles.number} aria-hidden="true">{String(index+1).padStart(2,'0')}</span><h2 id={`${section.id}-heading`}>{section.title}</h2></div>
          <div className={styles.copy}>{section.blocks.map((block,i)=>block.items?<ul key={i}>{block.items.map(item=><li key={item}><LinkedText text={item}/></li>)}</ul>:<p key={i}><LinkedText text={block.text||''}/></p>)}</div>
        </section>)}</div>
      </div>
      <div className={styles.contact}><h2>Have a question?</h2><p>Contact TailorFit about your account, privacy or these terms.</p><a href="mailto:haysal618@gmail.com">haysal618@gmail.com <ArrowUpRight size={18} aria-hidden="true"/></a></div>
    </main>
    <footer className={styles.footer}><p>© {new Date().getFullYear()} TailorFit</p><nav aria-label="Footer"><Link href="/">Home</Link><Link href="/privacy">Privacy Policy</Link><Link href="/terms">Terms of Use</Link></nav></footer>
  </div>;
}
