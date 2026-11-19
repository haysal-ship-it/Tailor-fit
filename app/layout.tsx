import type {Metadata, Viewport} from 'next';
import { manrope, instrumentSerif } from './fonts';
import './globals.css';
import { AccountProvider } from '@/components/auth/AccountProvider';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
};

export const metadata: Metadata = {
  title: 'TailorFit — Studio Management & Body Measurements',
  description: 'Bespoke tailoring and fashion design management app for client profiles, interactive body diagram measurements, style reference images, and pickup scheduling.',
  openGraph: {
    title: 'TailorFit — Studio Management & Body Measurements',
    description: 'Bespoke tailoring and fashion design management app for client profiles, interactive body diagram measurements, style reference images, and pickup scheduling.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TailorFit — Studio Management & Body Measurements',
    description: 'Bespoke tailoring and fashion design management app for client profiles, interactive body diagram measurements, style reference images, and pickup scheduling.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${manrope.variable} ${instrumentSerif.variable}`}>
      <body className="font-sans antialiased bg-[var(--page)] text-[var(--text)] min-h-screen selection:bg-[var(--primary)]/15 selection:text-[var(--primary)]">
        <AccountProvider>{children}</AccountProvider>
      </body>
    </html>
  );
}
