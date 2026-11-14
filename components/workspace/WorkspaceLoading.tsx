'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import styles from './workspace-loading.module.css';

function Placeholder({ className = '' }: { className?: string }) {
  return <div className={`${styles.placeholder} ${className}`} />;
}

export function WorkspaceLoading({ embedded = false, screen = 'overview', stage = 'account' }: {
  embedded?: boolean; screen?: string; stage?: 'account' | 'records';
}) {
  const [slow, setSlow] = useState(false);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const timeout = window.setTimeout(() => setSlow(true), 10000);
    const visibility = () => setPaused(document.hidden);
    queueMicrotask(visibility);
    document.addEventListener('visibilitychange', visibility);
    return () => { window.clearTimeout(timeout); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  return <div className={embedded ? styles.embedded : styles.shell} data-workspace-loading="" data-paused={paused}>
    {!embedded && <div className={styles.nav} aria-hidden="true">
      <Image src="/assets/branding/tailorfit-navbar-logo.png" alt="" width={134} height={30} priority />
      <Placeholder className={styles.navTabs} /><Placeholder className={styles.account} />
    </div>}
    <div className={styles.content}>
      <div className={styles.status} role="status" aria-live="polite">
        <span className={styles.dot} aria-hidden="true" />
        {stage === 'account' ? 'Opening your workspace...' : 'Loading your records...'}
      </div>
      {slow && <p className={styles.help}>Taking longer than usual. Check your connection, or <a href="">reload the workspace</a>.</p>}
      <div className={styles.progress} aria-hidden="true" />
      <div aria-hidden="true" className={styles.skeleton}>
        {screen === 'clients' || screen === 'client-profile' ? <>
          <div className={styles.directoryHeader}><Placeholder className={styles.title} /><Placeholder className={styles.action} /></div>
          <Placeholder className={styles.search} />
          <div className={styles.clientGrid}>{[0, 1, 2, 3].map(i => <div key={i} className={styles.panel}>
            <Placeholder className={styles.avatar} /><Placeholder className={styles.title} /><Placeholder /><Placeholder />
          </div>)}</div>
        </> : screen === 'settings' ? <div className={styles.settings}>
          <div className={styles.panel}><Placeholder className={styles.title} /><Placeholder /><Placeholder /><Placeholder /></div>
          <div className={styles.panel}><Placeholder className={styles.title} />{[0, 1, 2].map(i => <div key={i} className={styles.fieldGroup}><Placeholder className={styles.label} /><Placeholder className={styles.field} /><Placeholder className={styles.field} /></div>)}</div>
        </div> : <div className={styles.workspace}>
          <div className={styles.panel}><Placeholder className={styles.title} /><Placeholder />
            {[0, 1, 2].map(i => <div key={i} className={styles.fieldGroup}><Placeholder className={styles.label} /><Placeholder className={styles.field} /><Placeholder className={styles.field} /></div>)}
          </div>
          <div className={`${styles.panel} ${styles.canvas}`}><div className={styles.canvasHeader}><Placeholder className={styles.title} /><Placeholder className={styles.action} /></div><div className={styles.canvasSpace} /><Placeholder className={styles.toolbar} /></div>
          <div className={`${styles.panel} ${styles.summary}`}><Placeholder className={styles.title} /><Placeholder className={styles.calendar} />{[0, 1, 2].map(i => <div key={i} className={styles.fieldGroup}><Placeholder /><Placeholder className={styles.label} /></div>)}</div>
        </div>}
      </div>
    </div>
  </div>;
}
