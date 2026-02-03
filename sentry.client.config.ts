import { clientConfig } from '@/lib/monitoring/sentry';

// Initialize Sentry for client-side
import * as Sentry from '@sentry/nextjs';

Sentry.init(clientConfig);

export { Sentry };
