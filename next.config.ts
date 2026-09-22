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
  serverExternalPackages: ['docusign-esign', 'stripe'],
  webpack: (config, { isServer }) => {
    // Exclude docusign-esign from client-side bundle
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'docusign-esign': false,
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
