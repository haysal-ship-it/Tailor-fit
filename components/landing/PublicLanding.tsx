import type { Metadata } from 'next';
import { Instrument_Serif } from 'next/font/google';
import { LandingPage } from '@/components/landing/LandingPage';

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'], weight: '400', style: 'italic',
  variable: '--font-landing-serif', display: 'swap',
});

export const metadata: Metadata = {
  title: 'TailorFit — Made to Measure. Built to Keep You Organized.',
  description:
    'Capture measurements with an interactive mannequin, save client details, and keep track of garment orders and due dates.',
  openGraph: {
    title: 'TailorFit — Made to Measure. Built to Keep You Organized.',
    description:
      'Capture measurements with an interactive mannequin, save client details, and keep track of garment orders and due dates.',
    type: 'website',
  },
};

export default function Page() {
  return <div className={instrumentSerif.variable}><LandingPage /></div>;
}
