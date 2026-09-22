import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/siteUrl';

/**
 * Crawl rules. The marketing and legal pages are the whole point of indexing;
 * everything behind sign-in is useless to a crawler, and the token-bearing
 * signing and fill links must never be indexed — those URLs are the credential.
 */
export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard',
          '/mydrafts',
          '/settings',
          '/onboarding',
          '/templates',
          '/fillndahtml',
          '/fillndahtml-public/',
          '/sign-nda',
          '/sign-nda-public/',
          '/view-nda/',
          '/viewpdf',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
