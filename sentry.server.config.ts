import * as Sentry from '@sentry/nextjs';

// No DSN means Sentry.init is a no-op, so local dev and previews without the
// env var configured stay silent instead of failing.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
  // Errors matter; traces are a cost. Sample lightly until there is traffic
  // worth profiling.
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
});
