import type {Metadata} from 'next';
import {Inter, Geist_Mono, Playfair_Display} from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
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
    <html lang="en" className={`${inter.variable} ${geistMono.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased bg-[#eaedf0] text-[#111827] min-h-screen selection:bg-[#1d4ed8]/10 selection:text-[#1d4ed8]" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
