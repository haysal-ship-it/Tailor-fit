import Workspace from '@/components/Workspace';
import '@/components/onboarding/studio-setup.css';
export const dynamic = 'force-dynamic';
export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string; view?: string; order?: string; client?: string }> }) {
  const { tab, view, order, client } = await searchParams;
  const initialScreen = tab && ['overview', 'clients', 'settings'].includes(tab) ? tab : 'overview';
  let loadingScreen = initialScreen;
  if (tab === 'clients') {
    if (view === 'orders') loadingScreen = 'orders';
    else if (order) loadingScreen = order === 'new' ? 'new-order' : 'order';
    else if (client) loadingScreen = 'client-profile';
  }
  return <Workspace initialScreen={loadingScreen} />;
}
