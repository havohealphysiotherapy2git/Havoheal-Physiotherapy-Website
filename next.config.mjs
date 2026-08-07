/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  images: {
    formats: ['image/avif', 'image/webp'],
    // All imagery currently ships as project-owned SVG/local assets. Add remote
    // patterns here only when the owner supplies a real photo CDN.
    remotePatterns: [],
  },

  eslint: {
    dirs: ['src', 'scripts', 'tests'],
  },

  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },

  async headers() {
    return [
      {
        // Security headers that do not need a per-request value.
        // The Content-Security-Policy itself is issued by middleware.ts because
        // it carries a per-request nonce.
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value:
              'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0' }],
      },
    ];
  },

  async redirects() {
    return [
      { source: '/book', destination: '/book-appointment', permanent: true },
      { source: '/booking', destination: '/book-appointment', permanent: true },
      { source: '/prices', destination: '/physiotherapy-pricing', permanent: true },
      { source: '/pricing', destination: '/physiotherapy-pricing', permanent: true },
      { source: '/faq', destination: '/faqs', permanent: true },
      { source: '/areas', destination: '/areas-we-cover', permanent: true },
      { source: '/conditions', destination: '/conditions-we-support', permanent: true },
      {
        source: '/physiotherapy-birmingham',
        destination: '/birmingham-physiotherapy',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
