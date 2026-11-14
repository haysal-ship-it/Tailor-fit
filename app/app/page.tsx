import Workspace from '@/components/Workspace';
export const dynamic = 'force-dynamic';
export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const initialScreen = tab && ['overview', 'clients', 'settings'].includes(tab) ? tab : 'overview';
  return <Workspace initialScreen={initialScreen} />;
}
