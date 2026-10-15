import type {Metadata, Viewport} from 'next';
import {Inter, Geist_Mono, Playfair_Display} from 'next/font/google';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

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
  description: 'Bespoke tailoring and fashion design management app with EasyUI design system, interactive body diagram measurements, style reference images, and pickup scheduling.',
  openGraph: {
    title: 'TailorFit — Studio Management & Body Measurements',
    description: 'Bespoke tailoring and fashion design management app with EasyUI design system, interactive body diagram measurements, style reference images, and pickup scheduling.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TailorFit — Studio Management & Body Measurements',
    description: 'Bespoke tailoring and fashion design management app with EasyUI design system, interactive body diagram measurements, style reference images, and pickup scheduling.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${geistMono.variable} ${playfair.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('tailorfit_theme');
                  if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased bg-[var(--bg)] text-[var(--text)] min-h-screen selection:bg-[var(--accent)]/15 selection:text-[var(--accent)]" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
