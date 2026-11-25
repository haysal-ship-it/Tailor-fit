'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { workspaceLayout } from './layout';
import styles from './workspace-loading.module.css';

function Block({ className = '' }: { className?: string }) {
  return <div className={styles.block + ' ' + className} />;
}

function Heading() {
  return <div className="min-w-0 space-y-2"><Block className="h-5 w-36 max-w-full" /><Block className="h-3 w-52 max-w-full" /></div>;
}

function Rows({ count }: { count: number }) {
  return <div className="divide-y divide-[var(--hairline)]">
    {Array.from({ length: count }, (_, i) => <div key={i} className="flex min-h-16 items-center justify-between gap-4 py-3">
      <div className="w-2/3 space-y-2"><Block className="h-3 w-2/3" /><Block className="h-2 w-1/2" /></div>
      <Block className="h-4 w-10 rounded-full" />
    </div>)}
  </div>;
}

function Fields() {
  return <div className={workspaceLayout.card + ' space-y-5'}>
    <Block className="h-4 w-32" />
    {[0, 1, 2].map(i => <div key={i} className="space-y-2"><Block className="h-3 w-20" /><Block className="h-11 w-full" /></div>)}
  </div>;
}

function Overview() {
  return <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_343px]">
    <div className="min-w-0 space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map(i => <div className={workspaceLayout.card} key={i}>
          <Block className="h-3 w-2/3" /><Block className="mt-5 h-6 w-12" /><Block className="mt-2 h-3 w-4/5" />
        </div>)}
      </div>
      <div className={workspaceLayout.card}><Heading /><Block className="mt-6 h-8 w-16" /><Block className="mt-4 aspect-[710/230] w-full" /></div>
    </div>
    <div className="space-y-4"><div className={workspaceLayout.card}><Heading /><Block className="mt-4 h-48" /></div>
      <div className={workspaceLayout.card}><Rows count={3} /></div></div>
  </div>;
}

function Body({ screen }: { screen: string }) {
  switch (screen) {
    case 'overview':
    case 'dashboard':
      return <Overview />;
    case 'settings':
      return <div className="grid items-start gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <div className={workspaceLayout.card}><Rows count={6} /></div><div className="hidden lg:block"><Fields /></div>
      </div>;
    case 'clients':
      return <><Block className="mb-4 h-11 w-full max-w-sm rounded-full" /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map(i => <div key={i} className={workspaceLayout.card + ' space-y-4'}><Block className="size-12 rounded-full" /><Heading /></div>)}
      </div></>;
    case 'new-order':
      return <div className="grid gap-2 lg:grid-cols-2"><Fields /><div className={workspaceLayout.card + ' hidden lg:block'}><Heading /><Block className="mt-5 h-80" /></div></div>;
    case 'order':
      return <div className="grid gap-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className={workspaceLayout.card}><Rows count={5} /></div>
        <div className={workspaceLayout.card}><Heading /><Block className="mt-5 h-80" /></div>
      </div>;
    default:
      return <div className={workspaceLayout.card}><Rows count={4} /></div>;
  }
}

export function WorkspaceLoading({ embedded = false, screen = 'workspace', stage = 'account' }: {
  embedded?: boolean; screen?: string; stage?: 'account' | 'records';
}) {
  const [slow, setSlow] = useState(false);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), 10000);
    const onVisibility = () => setPaused(document.hidden);
    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
  const actions = ['overview', 'dashboard', 'clients'].includes(screen);
  return <div className={embedded ? 'w-full' : 'min-h-dvh bg-[var(--page)] pt-4'} data-workspace-loading="" data-paused={paused}>
    {!embedded && <div aria-hidden="true" className="mx-auto w-full max-w-[1216px] px-3 sm:px-4 xl:px-0">
      <div className="flex min-h-[60px] items-center justify-between gap-4 rounded-lg border-2 border-white bg-[var(--card)] px-4 sm:px-6">
        <Image src="/assets/branding/tailorfit-navbar-logo.png" alt="" width={134} height={30} priority className="h-[26px] w-auto sm:h-[30px]" />
        <Block className="hidden h-9 w-60 rounded-full lg:block" /><Block className="h-8 w-16 rounded-full" />
      </div></div>}
    <div className={workspaceLayout.shell}>
      <div role="status" className={slow ? 'mb-2 text-sm text-[var(--text-2)]' : 'sr-only'}>
        {slow ? 'Taking longer than usual. Check your connection.' : stage === 'account' ? 'Opening your workspace…' : 'Loading your records…'}
      </div>
      {slow && <a href="" className="mb-3 inline-block text-sm text-[var(--primary)] underline">Reload workspace</a>}
      <div aria-hidden="true" className={workspaceLayout.frame + ' relative'} data-loading-screen={screen}>
        <div className={styles.activity} />
        <div className={workspaceLayout.header + ' flex flex-col justify-between gap-4 lg:flex-row lg:items-center'}>
          <Heading />
          {actions && <div className="flex flex-col gap-2 sm:flex-row"><Block className="h-11 rounded-full sm:w-28" /><Block className="h-11 rounded-full sm:w-28" /></div>}
        </div>
        <div className={workspaceLayout.inset}><Body screen={screen} /></div>
      </div>
    </div>
  </div>;
}
