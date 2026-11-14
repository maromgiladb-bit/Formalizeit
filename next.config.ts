import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  eslint: {
    // Still off: ~82 pre-existing errors and ~2,860 warnings. Clearing them is
    // real work, but not launch work.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // `tsc --noEmit` is clean, so the build gate costs nothing and stops type
    // errors from shipping silently to production.
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  serverExternalPackages: ['stripe'],
  poweredByHeader: false,
  // Conservative headers only. No Content-Security-Policy yet: it needs careful allowances for
  // Clerk, Stripe, Sentry and Vercel, and a wrong one breaks sign-in or checkout.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // The signing and review pages must not be framed by other sites (clickjacking).
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Signing links carry the credential in the path; never leak it in a Referer.
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // Keep server-only PDF tooling out of the client bundle
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@sparticuz/chromium': false,
        'puppeteer-core': false,
      };
    }

    // Note: Templates are now bundled via bundledTemplates.generated.ts
    // No need for copy-webpack-plugin anymore

    return config;
  },
};

// Source-map upload only happens when SENTRY_AUTH_TOKEN, SENTRY_ORG and
// SENTRY_PROJECT are all set (Vercel Production). Everywhere else this wrapper
// is inert apart from the runtime instrumentation, so local builds stay quiet.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
});
