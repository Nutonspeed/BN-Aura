import { captureException, captureMessage, withScope } from '@sentry/nextjs';

/**
 * Error reporting utilities for BN-Aura
 * Provides centralized error logging to Sentry with context
 */

export interface ErrorContext {
  userId?: string;
  clinicId?: string;
  userRole?: string;
  action?: string;
  component?: string;
  additionalData?: Record<string, any>;
}

/**
 * Report an error to Sentry with context
 */
export function reportError(
  error: Error | string,
  context?: ErrorContext,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'error'
) {
  withScope((scope) => {
    // Set user context if available
    if (context?.userId) {
      scope.setUser({ id: context.userId });
    }
    
    // Set tags for filtering
    if (context?.userRole) {
      scope.setTag('userRole', context.userRole);
    }
    if (context?.clinicId) {
      scope.setTag('clinicId', context.clinicId);
    }
    if (context?.action) {
      scope.setTag('action', context.action);
    }
    if (context?.component) {
      scope.setTag('component', context.component);
    }
    
    // Set additional context
    if (context?.additionalData) {
      Object.entries(context.additionalData).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
    }
    
    // Capture the error
    if (typeof error === 'string') {
      captureMessage(error, level);
    } else {
      captureException(error, {
        level,
        tags: {
          feature: 'bn-aura-platform'
        }
      });
    }
  });
}

/**
 * Report a user action for analytics
 */
export function reportAction(action: string, context?: Omit<ErrorContext, 'action'>) {
  reportMessage(`User action: ${action}`, {
    ...context,
    action,
    component: 'UserAction'
  }, 'info');
}

/**
 * Report a message to Sentry
 */
export function reportMessage(
  message: string,
  context?: ErrorContext,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info'
) {
  withScope((scope) => {
    // Set user context if available
    if (context?.userId) {
      scope.setUser({ id: context.userId });
    }
    
    // Set tags for filtering
    if (context?.userRole) {
      scope.setTag('userRole', context.userRole);
    }
    if (context?.clinicId) {
      scope.setTag('clinicId', context.clinicId);
    }
    if (context?.action) {
      scope.setTag('action', context.action);
    }
    if (context?.component) {
      scope.setTag('component', context.component);
    }
    
    // Set additional context
    if (context?.additionalData) {
      Object.entries(context.additionalData).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
    }
    
    captureMessage(message, level);
  });
}

/**
 * Create a wrapper for async functions that catches and reports errors
 */
export function withErrorReporting<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: ErrorContext
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      reportError(error as Error, {
        ...context,
        action: fn.name,
        additionalData: {
          args: args.map(arg => 
            typeof arg === 'object' ? '[Object]' : String(arg)
          )
        }
      });
      throw error;
    }
  }) as T;
}

/**
 * React hook for error reporting
 */
export function useErrorReporting(defaultContext?: Partial<ErrorContext>) {
  const reportErrorWithContext = (error: Error | string, context?: ErrorContext) => {
    reportError(error, { ...defaultContext, ...context });
  };
  
  const reportMessageWithContext = (message: string, context?: ErrorContext) => {
    reportMessage(message, { ...defaultContext, ...context });
  };
  
  const reportActionWithContext = (action: string, context?: Omit<ErrorContext, 'action'>) => {
    reportAction(action, { ...defaultContext, ...context });
  };
  
  return {
    reportError: reportErrorWithContext,
    reportMessage: reportMessageWithContext,
    reportAction: reportActionWithContext
  };
}
