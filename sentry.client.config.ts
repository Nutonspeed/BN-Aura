// Initialize Sentry for client-side
import * as Sentry from '@sentry/nextjs';

try {
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (dsn) {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
  }
} catch (e) {
  // Sentry init failed, continue without monitoring
  console.warn('Sentry client init skipped:', e);
}

export { Sentry };
