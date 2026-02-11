// Sentry Configuration for BN-Aura
// Comprehensive error tracking and performance monitoring

import * as Sentry from '@sentry/nextjs';

// Type definitions for better TypeScript support
interface SentryEvent {
  tags?: Record<string, string>;
  exception?: {
    values?: Array<{
      stacktrace?: {
        frames?: Array<{
          filename?: string;
          function?: string;
        }>;
      };
    }>;
  };
  user?: Sentry.User;
}

interface SentryHint {
  originalException?: Error;
}

interface SentryBreadcrumb {
  category?: string;
  message?: string;
  level?: string;
  data?: Record<string, any>;
}

interface SentryTransaction {
  setData: (key: string, value: any) => void;
  setStatus: (status: string) => void;
  finish: () => void;
}

// Common configuration for both client and server
const commonConfig = {
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  
  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Session replay for debugging
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysOnErrorSampleRate: 1.0,
  
  // Integration settings
  integrations: [
    Sentry.captureConsoleIntegration({
      levels: ['error', 'warn']
    }),
  ],
  
  // Custom tags and context
  beforeSend: (event: SentryEvent, hint: SentryHint) => {
    // Add custom context
    event.tags = {
      ...event.tags,
      component: 'bn-aura',
      version: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0'
    };
    
    // Filter out sensitive data
    if (event.exception) {
      event.exception.values?.forEach((exception: any) => {
        // Remove potential sensitive information from stack traces
        if (exception.stacktrace) {
          exception.stacktrace.frames = exception.stacktrace.frames?.map((frame: any) => ({
            ...frame,
            // Remove query parameters and sensitive data from URLs
            filename: frame.filename?.replace(/\?.*$/, ''),
            // Remove potential secrets from function names
            function: frame.function?.replace(/token|password|secret/gi, '***')
          }));
        }
      });
    }
    
    return event;
  }
};

// Server-side configuration
export const serverConfig = {
  ...commonConfig,
  
  // Server-specific integrations
  integrations: [
    ...commonConfig.integrations,
  ],
  
  // Custom server-side context
  beforeBreadcrumb: (breadcrumb: SentryBreadcrumb, hint: SentryHint) => {
    // Add database query context
    if (breadcrumb.category === 'http' && breadcrumb.data?.url) {
      breadcrumb.data.query = breadcrumb.data.url?.replace(/\?.*$/, '');
    }
    
    return breadcrumb;
  }
};

// Client-side configuration
export const clientConfig = {
  ...commonConfig,
  
  // Client-specific integrations
  integrations: [
    ...commonConfig.integrations,
  ],
  
  // User feedback
  beforeSend: (event: SentryEvent, hint: SentryHint) => {
    // Add user context if available
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const userSession = localStorage.getItem('sb-sb-royeyoxaaieipdajijni-auth-token');
        if (userSession) {
          const session = JSON.parse(atob(userSession.replace('base64-', '')));
          event.user = {
            id: session.user?.id,
            email: session.user?.email,
            role: session.user?.user_metadata?.role
          };
        }
      } catch (error) {
        // Ignore localStorage errors
      }
    }
    
    return commonConfig.beforeSend(event, hint);
  }
};

// Performance monitoring utilities
export class PerformanceTracker {
  static startTransaction(name: string, operation: string) {
    return Sentry.startSpan({ name, op: operation }, () => {});
  }
  
  static trackAPICall(endpoint: string, method: string, duration: number) {
    Sentry.addBreadcrumb({
      category: 'api',
      message: `${method} ${endpoint}`,
      level: 'info',
      data: {
        endpoint,
        method,
        duration,
        timestamp: Date.now()
      }
    });
    
    // Track slow API calls
    if (duration > 1000) {
      Sentry.captureMessage(`Slow API call: ${method} ${endpoint} took ${duration}ms`, 'warning');
    }
  }
  
  static trackDatabaseQuery(query: string, table: string, duration: number) {
    Sentry.addBreadcrumb({
      category: 'db',
      message: `Query on ${table}`,
      level: 'info',
      data: {
        table,
        queryType: query.split(' ')[0]?.toUpperCase(),
        duration,
        timestamp: Date.now()
      }
    });
    
    // Track slow queries
    if (duration > 500) {
      Sentry.captureMessage(`Slow database query: ${table} took ${duration}ms`, 'warning');
    }
  }
  
  static trackCacheOperation(operation: string, key: string, hit: boolean, duration: number) {
    Sentry.addBreadcrumb({
      category: 'cache',
      message: `${operation} ${hit ? 'HIT' : 'MISS'}`,
      level: 'info',
      data: {
        operation,
        key: key.replace(/:.*/, ':***'), // Mask sensitive parts
        hit,
        duration,
        timestamp: Date.now()
      }
    });
  }
  
  static trackUserAction(action: string, details?: Record<string, any>) {
    Sentry.addBreadcrumb({
      category: 'user',
      message: action,
      level: 'info',
      data: {
        action,
        ...details,
        timestamp: Date.now()
      }
    });
  }
}

// Error handling utilities
export class ErrorHandler {
  static captureException(error: Error, context?: Record<string, any>) {
    Sentry.captureException(error, {
      tags: context?.tags,
      extra: context,
    });
  }
  
  static captureMessage(message: string, level: Sentry.SeverityLevel = 'error', context?: Record<string, any>) {
    Sentry.captureMessage(message, { level: level,
      tags: context?.tags,
      extra: context?.extra,
      user: context?.user
    });
  }
  
  static setUser(user: Sentry.User) {
    Sentry.setUser(user);
  }
  
  static clearUser() {
    Sentry.setUser(null);
  }
  
  static setTag(key: string, value: string) {
    Sentry.setTag(key, value);
  }
  
  static setContext(key: string, context: Record<string, any>) {
    Sentry.setContext(key, context);
  }
}

// Health check utilities
export class HealthMonitor {
  static async checkPerformance() {
    return Sentry.startSpan({ name: 'health-check', op: 'http' }, async () => {
      try {
        const checks = await Promise.all([
          this.checkDatabasePerformance(),
          this.checkCachePerformance(),
          this.checkAPIPerformance()
        ]);
        return checks;
      } catch (error) {
        ErrorHandler.captureException(error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    });
  }
  
  private static async checkDatabasePerformance() {
    const start = Date.now();
    // Simulate database health check
    await new Promise(resolve => setTimeout(resolve, 50));
    const duration = Date.now() - start;
    
    if (duration > 1000) {
      throw new Error('Database performance degraded');
    }
  }
  
  private static async checkCachePerformance() {
    const start = Date.now();
    // Simulate cache health check
    await new Promise(resolve => setTimeout(resolve, 10));
    const duration = Date.now() - start;
    
    PerformanceTracker.trackCacheOperation('get', 'health_check', true, duration);
    
    if (duration > 100) {
      throw new Error('Cache performance degraded');
    }
  }
  
  private static async checkAPIPerformance() {
    const start = Date.now();
    // Simulate API health check
    await new Promise(resolve => setTimeout(resolve, 25));
    const duration = Date.now() - start;
    
    PerformanceTracker.trackAPICall('/health', 'GET', duration);
    
    if (duration > 500) {
      throw new Error('API performance degraded');
    }
  }
}

export default Sentry;
