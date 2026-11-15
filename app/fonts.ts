import localFont from 'next/font/local';

export const manrope = localFont({
  src: [
    { path: '../public/fonts/manrope-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/manrope-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/manrope-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/manrope-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-manrope',
  display: 'swap',
});

export const instrumentSerif = localFont({
  src: [
    { path: '../public/fonts/InstrumentSerif-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../public/fonts/InstrumentSerif-Italic.ttf', weight: '400', style: 'italic' },
  ],
  variable: '--font-landing-serif',
  display: 'swap',
});
