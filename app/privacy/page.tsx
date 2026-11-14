import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';
export const metadata: Metadata = {title:'Privacy Policy | TailorFit',description:'How TailorFit handles account information, client measurements, images and garment records, and how to contact us about your privacy.',openGraph:{title:'Privacy Policy | TailorFit',description:'How TailorFit handles your information.'}};
export default function PrivacyPage(){return <LegalPage kind="privacy"/>;}
