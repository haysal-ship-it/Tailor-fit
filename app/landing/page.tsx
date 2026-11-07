import type { Metadata } from 'next';
import { LandingPage } from '@/components/landing/LandingPage';

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
  return <LandingPage />;
}
