import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';
export const metadata: Metadata = {title:'Terms of Use | TailorFit',description:'Terms for using TailorFit, including account responsibilities, client records, acceptable use and contact information.',openGraph:{title:'Terms of Use | TailorFit',description:'The terms for using your TailorFit workspace.'}};
export default function TermsPage(){return <LegalPage kind="terms"/>;}
