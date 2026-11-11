import PublicLanding from '@/components/landing/PublicLanding';
import { redirect } from 'next/navigation';
export { metadata } from '@/components/landing/PublicLanding';
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
 const params=await searchParams;
 if(typeof params.tab==='string' && ['overview','clients','settings'].includes(params.tab)) redirect('/app?tab='+params.tab);
 return <PublicLanding/>;
}
