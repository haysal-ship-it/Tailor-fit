import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // Allow verification builds without overwriting a running development preview.
  distDir: process.env.TAILORFIT_DIST_DIR || '.next',
  reactStrictMode: true,
  devIndicators: false,
  experimental: process.env.TAILORFIT_VERIFY_SINGLE_WORKER === 'true' ? { cpus: 1 } : undefined,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Allow access to remote image placeholder.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**', // This allows any path under the hostname
      },
    ],
  },
  output: 'standalone',
  outputFileTracingIncludes: {
    '/*': ['./public/assets/mannequin-*.png', './node_modules/@fontsource/manrope/files/manrope-latin-*-normal.woff'],
  },
  transpilePackages: ['motion'],
  webpack: (config, {dev}) => {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
