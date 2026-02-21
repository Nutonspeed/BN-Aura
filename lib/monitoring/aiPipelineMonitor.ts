/**
 * AI Pipeline Performance Monitor
 * Monitors performance metrics for all AI components
 */

import { performance } from 'perf_hooks';

interface PerformanceMetrics {
  operation: string;
  startTime: number;
  endTime: number;
  duration: number;
  metadata?: Record<string, any>;
}

interface AlertThresholds {
  skinAnalysis: number; // ms
  geneticAnalysis: number; // ms
  treatmentPrediction: number; // ms
  trendAnalysis: number; // ms
  fullPipeline: number; // ms
}

class AIPipelineMonitor {
  private metrics: PerformanceMetrics[] = [];
  private alertThresholds: AlertThresholds = {
    skinAnalysis: 3000,
    geneticAnalysis: 2000,
    treatmentPrediction: 1500,
    trendAnalysis: 1000,
    fullPipeline: 5000
  };

  private activeOperations = new Map<string, number>();

  /**
   * Start monitoring an operation
   */
  startOperation(operation: string, metadata?: Record<string, any>): string {
    const operationId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = performance.now();
    
    this.activeOperations.set(operationId, startTime);
    
    console.log(`[AI Monitor] Started: ${operation}`, metadata);
    
    return operationId;
  }

  /**
   * End monitoring an operation and record metrics
   */
  endOperation(operationId: string, metadata?: Record<string, any>): PerformanceMetrics {
    const startTime = this.activeOperations.get(operationId);
    if (!startTime) {
      throw new Error(`Operation ${operationId} not found`);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    const metric: PerformanceMetrics = {
      operation: operationId.split('_')[0],
      startTime,
      endTime,
      duration,
      metadata
    };

    this.metrics.push(metric);
    this.activeOperations.delete(operationId);

    // Check alert thresholds
    this.checkAlerts(metric);

    console.log(`[AI Monitor] Completed: ${metric.operation} in ${duration.toFixed(2)}ms`);
    
    return metric;
  }

  /**
   * Check if operation exceeds alert thresholds
   */
  private checkAlerts(metric: PerformanceMetrics): void {
    const threshold = this.alertThresholds[metric.operation as keyof AlertThresholds];
    
    if (threshold && metric.duration > threshold) {
      this.triggerAlert(metric, threshold);
    }
  }

  /**
   * Trigger performance alert
   */
  private triggerAlert(metric: PerformanceMetrics, threshold: number): void {
    const alert = {
      level: 'WARNING',
      operation: metric.operation,
      duration: metric.duration,
      threshold,
      exceededBy: metric.duration - threshold,
      timestamp: new Date().toISOString(),
      metadata: metric.metadata
    };

    console.error(`[AI Alert] Performance threshold exceeded:`, alert);
    
    // Send to monitoring service (Sentry, etc.)
    if (process.env.NODE_ENV === 'production') {
      // Integration with monitoring service
      this.sendAlertToService(alert);
    }
  }

  /**
   * Send alert to external monitoring service
   */
  private async sendAlertToService(alert: any): Promise<void> {
    // Example: Send to Sentry
    try {
      const Sentry = require('@sentry/nextjs');
      Sentry.captureMessage('AI Pipeline Performance Alert', 'warning', {
        extra: alert
      });
    } catch (error) {
      console.error('Failed to send alert to monitoring service:', error);
    }
  }

  /**
   * Get performance statistics
   */
  getStatistics(operation?: string): {
    count: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    p95Duration: number;
    errorRate: number;
  } {
    let filteredMetrics = this.metrics;
    
    if (operation) {
      filteredMetrics = this.metrics.filter(m => m.operation === operation);
    }

    if (filteredMetrics.length === 0) {
      return {
        count: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        p95Duration: 0,
        errorRate: 0
      };
    }

    const durations = filteredMetrics.map(m => m.duration).sort((a, b) => a - b);
    const count = durations.length;
    const sum = durations.reduce((a, b) => a + b, 0);
    const avgDuration = sum / count;
    const minDuration = durations[0];
    const maxDuration = durations[count - 1];
    const p95Index = Math.floor(count * 0.95);
    const p95Duration = durations[p95Index];

    // Calculate error rate (operations that exceeded thresholds)
    const errors = filteredMetrics.filter(m => {
      const threshold = this.alertThresholds[m.operation as keyof AlertThresholds];
      return threshold && m.duration > threshold;
    });
    const errorRate = (errors.length / count) * 100;

    return {
      count,
      avgDuration,
      minDuration,
      maxDuration,
      p95Duration,
      errorRate
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics = [];
    this.activeOperations.clear();
    console.log('[AI Monitor] Metrics reset');
  }

  /**
   * Export metrics for external analysis
   */
  exportMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Monitor a function execution
   */
  async monitorFunction<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<{ result: T; metric: PerformanceMetrics }> {
    const operationId = this.startOperation(operation, metadata);
    
    try {
      const result = await fn();
      const metric = this.endOperation(operationId, { ...metadata, success: true });
      return { result, metric };
    } catch (error) {
      const metric = this.endOperation(operationId, { 
        ...metadata, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}

// Singleton instance
export const aiMonitor = new AIPipelineMonitor();

// Decorator for monitoring functions
export function monitorPerformance(operation: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return aiMonitor.monitorFunction(
        operation,
        () => originalMethod.apply(this, args),
        { method: propertyKey, args: args.length }
      );
    };

    return descriptor;
  };
}

// Health check endpoint data
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  metrics: Record<string, any>;
  alerts: Array<{
    operation: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}


// Alert store
interface Alert {
  id: string;
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  active: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
}

const alertStore: Alert[] = [];

export function getAlerts(filters?: { severity?: 'low' | 'medium' | 'high' | 'critical'; activeOnly?: boolean }): Alert[] {
  let result = [...alertStore];
  if (filters?.severity) result = result.filter(a => a.severity === filters.severity);
  if (filters?.activeOnly) result = result.filter(a => a.active);
  return result;
}

export function createAlert(type: string, message: string, severity: 'low' | 'medium' | 'high' | 'critical', metadata?: Record<string, any>): Alert {
  const alert: Alert = {
    id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    message,
    severity,
    active: true,
    createdAt: new Date().toISOString(),
    metadata
  };
  alertStore.push(alert);
  return alert;
}

export function clearAlerts(): void {
  alertStore.length = 0;
}

export function clearAlert(id: string): void {
  const alert = alertStore.find(a => a.id === id);
  if (alert) alert.active = false;
}

export function getMetrics() {
  const stats = aiMonitor.getStatistics();
  return {
    totalOperations: stats.count,
    successRate: stats.errorRate > 0 ? 100 - stats.errorRate : 100,
    averageResponseTime: stats.avgDuration,
    operationsPerSecond: 0,
    p95ResponseTime: stats.p95Duration,
    minResponseTime: stats.minDuration,
    maxResponseTime: stats.maxDuration,
  };
}

export function resetMetrics(): void {
  aiMonitor.reset();
}

export function getHealthStatus(): HealthStatus {
  const stats = aiMonitor.getStatistics();
  const alerts = [];

  // Check overall system health
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  if (stats.errorRate > 10) {
    status = 'unhealthy';
    alerts.push({
      operation: 'system',
      message: `High error rate: ${stats.errorRate.toFixed(2)}%`,
      severity: 'high' as const
    });
  } else if (stats.errorRate > 5) {
    status = 'degraded';
    alerts.push({
      operation: 'system',
      message: `Elevated error rate: ${stats.errorRate.toFixed(2)}%`,
      severity: 'medium' as const
    });
  }

  if (stats.avgDuration > 3000) {
    status = status === 'healthy' ? 'degraded' : 'unhealthy';
    alerts.push({
      operation: 'system',
      message: `High average response time: ${stats.avgDuration.toFixed(2)}ms`,
      severity: 'medium' as const
    });
  }

  return {
    status,
    timestamp: new Date().toISOString(),
    metrics: stats,
    alerts
  };
}
