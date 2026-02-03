import { serverConfig } from '@/lib/monitoring/sentry';

// Initialize Sentry for server-side
import * as Sentry from '@sentry/nextjs';

Sentry.init(serverConfig);

export { Sentry };
