import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
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

export default nextConfig;
