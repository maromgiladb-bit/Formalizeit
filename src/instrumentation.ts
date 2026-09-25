import * as Sentry from '@sentry/nextjs';

// Next.js calls this once per server/edge instance at startup. Load the matching
// Sentry config for the runtime we are actually in.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

// Server-component and route-handler errors that Next catches on its own never
// reach a try/catch of ours; this hook is how they get reported.
export const onRequestError = Sentry.captureRequestError;
