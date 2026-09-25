import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/siteUrl';

/**
 * Only the publicly reachable marketing and legal pages. Anything requiring a
 * session, and every token-bearing link, is deliberately absent.
 */
const ROUTES: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }> = [
  { path: '/', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/about', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/plans', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/faq', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/help', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/support', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.6, changeFrequency: 'yearly' },
  { path: '/security', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/standard-nda', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/nda-governance', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/nda-changelog', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/esignature-consent', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/compliance', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/privacy', priority: 0.4, changeFrequency: 'yearly' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const lastModified = new Date();

  return ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${base}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
