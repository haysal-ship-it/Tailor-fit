import type {Metadata, Viewport} from 'next';
import {Manrope} from 'next/font/google';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-manrope',
  display: 'swap',
});

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
    <html lang="en" className={manrope.variable}>
      <body className="font-sans antialiased bg-[var(--page)] text-[var(--text)] min-h-screen selection:bg-[var(--primary)]/15 selection:text-[var(--primary)]">
        {children}
      </body>
    </html>
  );
}
