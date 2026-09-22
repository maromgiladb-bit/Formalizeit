/**
 * The canonical public origin for this deployment.
 *
 * Mirrors the resolution used for email links in `src/lib/email.ts`: an
 * explicitly configured URL wins, Preview deployments fall back to Vercel's
 * per-deployment host, and local development lands on localhost. Kept as its
 * own module so metadata, robots and sitemap can use it without importing the
 * email layer.
 */
export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  );
}
