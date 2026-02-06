/**
 * QuotaMonitor - Real-time monitoring and alerting system for quota usage
 */

interface AlertThreshold {
  metric: string;
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  enabled: boolean;
}

interface MonitoringEvent {
  id: string;
  timestamp: string;
  type: 'quota_usage' | 'performance' | 'error' | 'cache' | 'billing';
  severity: 'info' | 'warning' | 'critical';
  clinicId?: string;
  message: string;
  metadata: any;
}

interface PerformanceMetric {
  timestamp: string;
  metric: string;
  value: number;
  clinicId?: string;
  tags: Record<string, string>;
}

class QuotaMonitor {
  private static events: MonitoringEvent[] = [];
  private static metrics: PerformanceMetric[] = [];
  private static alertThresholds: AlertThreshold[] = [
    { metric: 'quota_usage_percent', threshold: 80, severity: 'warning', enabled: true },
    { metric: 'quota_usage_percent', threshold: 95, severity: 'critical', enabled: true },
    { metric: 'cache_hit_rate', threshold: 70, severity: 'warning', enabled: true },
    { metric: 'avg_response_time', threshold: 500, severity: 'warning', enabled: true },
    { metric: 'error_rate', threshold: 5, severity: 'critical', enabled: true },
  ];

  /**
   * Record quota usage event
   */
  static recordQuotaUsage(clinicId: string, currentUsage: number, monthlyQuota: number, metadata: any = {}) {
    const usagePercent = (currentUsage / monthlyQuota) * 100;
    
    // Record metric
    this.recordMetric('quota_usage_percent', usagePercent, clinicId, {
      current_usage: currentUsage.toString(),
      monthly_quota: monthlyQuota.toString()
    });

    // Check for alerts
    this.checkAlerts('quota_usage_percent', usagePercent, {
      clinicId,
      currentUsage,
      monthlyQuota,
      ...metadata
    });

    // Log event
    const severity = usagePercent >= 95 ? 'critical' : usagePercent >= 80 ? 'warning' : 'info';
    this.logEvent({
      type: 'quota_usage',
      severity,
      clinicId,
      message: `Quota usage: ${usagePercent.toFixed(1)}% (${currentUsage}/${monthlyQuota})`,
      metadata: { usagePercent, currentUsage, monthlyQuota, ...metadata }
    });
  }

  /**
   * Record performance metric
   */
  static recordPerformance(operation: string, duration: number, clinicId?: string, success: boolean = true) {
    // Record response time
    this.recordMetric('response_time', duration, clinicId, {
      operation,
      success: success.toString()
    });

    // Update average response time
    const recentMetrics = this.metrics
      .filter(m => m.metric === 'response_time' && Date.now() - new Date(m.timestamp).getTime() < 300000) // Last 5 minutes
      .slice(-50); // Last 50 requests

    if (recentMetrics.length > 0) {
      const avgResponseTime = recentMetrics.reduce((acc, m) => acc + m.value, 0) / recentMetrics.length;
      this.checkAlerts('avg_response_time', avgResponseTime, { operation, clinicId });
    }

    // Log slow operations
    if (duration > 1000) {
      this.logEvent({
        type: 'performance',
        severity: duration > 5000 ? 'critical' : 'warning',
        clinicId,
        message: `Slow operation: ${operation} took ${duration}ms`,
        metadata: { operation, duration, success }
      });
    }
  }

  /**
   * Record cache performance
   */
  static recordCachePerformance(hitRate: number, cacheSize: number) {
    this.recordMetric('cache_hit_rate', hitRate, undefined, {
      cache_size: cacheSize.toString()
    });

    this.checkAlerts('cache_hit_rate', hitRate, { cacheSize });

    if (hitRate < 50) {
      this.logEvent({
        type: 'cache',
        severity: 'warning',
        message: `Low cache hit rate: ${hitRate}%`,
        metadata: { hitRate, cacheSize }
      });
    }
  }

  /**
   * Record error event
   */
  static recordError(error: Error, context: any = {}) {
    this.logEvent({
      type: 'error',
      severity: 'critical',
      clinicId: context.clinicId,
      message: error.message,
      metadata: {
        stack: error.stack,
        name: error.name,
        ...context
      }
    });

    // Update error rate
    const recentEvents = this.events
      .filter(e => e.type === 'error' && Date.now() - new Date(e.timestamp).getTime() < 300000); // Last 5 minutes

    const totalEvents = this.events
      .filter(e => Date.now() - new Date(e.timestamp).getTime() < 300000).length;

    if (totalEvents > 0) {
      const errorRate = (recentEvents.length / totalEvents) * 100;
      this.checkAlerts('error_rate', errorRate, { error: error.message });
    }
  }

  /**
   * Record billing event
   */
  static recordBilling(clinicId: string, operation: string, amount: number, success: boolean) {
    this.recordMetric('billing_amount', amount, clinicId, {
      operation,
      success: success.toString()
    });

    this.logEvent({
      type: 'billing',
      severity: success ? 'info' : 'warning',
      clinicId,
      message: `Billing operation: ${operation} ฿${amount} ${success ? 'successful' : 'failed'}`,
      metadata: { operation, amount, success }
    });
  }

  /**
   * Get monitoring dashboard data
   */
  static getDashboardData(timeRange: number = 3600000) { // Default 1 hour
    const cutoff = Date.now() - timeRange;
    
    const recentEvents = this.events.filter(e => new Date(e.timestamp).getTime() > cutoff);
    const recentMetrics = this.metrics.filter(m => new Date(m.timestamp).getTime() > cutoff);

    // Calculate summary statistics
    const eventsByType = recentEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const eventsBySeverity = recentEvents.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Performance metrics
    const responseTimeMetrics = recentMetrics.filter(m => m.metric === 'response_time');
    const avgResponseTime = responseTimeMetrics.length > 0 
      ? responseTimeMetrics.reduce((acc, m) => acc + m.value, 0) / responseTimeMetrics.length 
      : 0;

    const cacheMetrics = recentMetrics.filter(m => m.metric === 'cache_hit_rate');
    const avgCacheHitRate = cacheMetrics.length > 0
      ? cacheMetrics[cacheMetrics.length - 1].value // Latest cache hit rate
      : 0;

    // Quota usage by clinic
    const quotaMetrics = recentMetrics.filter(m => m.metric === 'quota_usage_percent');
    const quotaByClinic = quotaMetrics.reduce((acc, m) => {
      if (m.clinicId) {
        acc[m.clinicId] = m.value;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      timeRange,
      summary: {
        totalEvents: recentEvents.length,
        totalMetrics: recentMetrics.length,
        eventsByType,
        eventsBySeverity
      },
      performance: {
        avgResponseTime: Math.round(avgResponseTime),
        avgCacheHitRate: Math.round(avgCacheHitRate),
        slowOperations: responseTimeMetrics.filter(m => m.value > 1000).length
      },
      quotaUsage: {
        clinicsMonitored: Object.keys(quotaByClinic).length,
        averageUsage: Object.values(quotaByClinic).length > 0 
          ? Math.round(Object.values(quotaByClinic).reduce((acc, val) => acc + val, 0) / Object.values(quotaByClinic).length)
          : 0,
        clinicsNearLimit: Object.values(quotaByClinic).filter(usage => usage > 80).length,
        quotaByClinic
      },
      recentEvents: recentEvents.slice(-20), // Last 20 events
      alerts: this.getActiveAlerts()
    };
  }

  /**
   * Get system health status
   */
  static getHealthStatus() {
    const dashboardData = this.getDashboardData(300000); // Last 5 minutes
    
    let status = 'healthy';
    const issues = [];

    // Check critical events
    if (dashboardData.summary.eventsBySeverity.critical > 0) {
      status = 'critical';
      issues.push(`${dashboardData.summary.eventsBySeverity.critical} critical events`);
    }

    // Check performance
    if (dashboardData.performance.avgResponseTime > 1000) {
      status = status === 'healthy' ? 'warning' : status;
      issues.push(`High response time: ${dashboardData.performance.avgResponseTime}ms`);
    }

    if (dashboardData.performance.avgCacheHitRate < 70) {
      status = status === 'healthy' ? 'warning' : status;
      issues.push(`Low cache hit rate: ${dashboardData.performance.avgCacheHitRate}%`);
    }

    // Check quota usage
    if (dashboardData.quotaUsage.clinicsNearLimit > 0) {
      status = status === 'healthy' ? 'warning' : status;
      issues.push(`${dashboardData.quotaUsage.clinicsNearLimit} clinics near quota limit`);
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      issues,
      uptime: process.uptime() * 1000, // Convert to milliseconds
      ...dashboardData.performance
    };
  }

  /**
   * Private helper methods
   */
  private static logEvent(eventData: Omit<MonitoringEvent, 'id' | 'timestamp'>) {
    const event: MonitoringEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...eventData
    };

    this.events.push(event);

    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }

    // Console logging for development
    if (process.env.NODE_ENV !== 'production' || eventData.severity === 'critical') {
      console.log(`[${eventData.severity.toUpperCase()}] ${eventData.type}: ${eventData.message}`);
    }
  }

  private static recordMetric(metric: string, value: number, clinicId?: string, tags: Record<string, string> = {}) {
    const metricData: PerformanceMetric = {
      timestamp: new Date().toISOString(),
      metric,
      value,
      clinicId,
      tags
    };

    this.metrics.push(metricData);

    // Keep only last 5000 metrics
    if (this.metrics.length > 5000) {
      this.metrics = this.metrics.slice(-5000);
    }
  }

  private static checkAlerts(metric: string, value: number, context: any = {}) {
    const threshold = this.alertThresholds.find(t => t.metric === metric && t.enabled);
    
    if (!threshold) return;

    const shouldAlert = metric === 'cache_hit_rate' ? value < threshold.threshold : value > threshold.threshold;

    if (shouldAlert) {
      this.logEvent({
        type: 'performance',
        severity: threshold.severity,
        clinicId: context.clinicId,
        message: `Alert: ${metric} ${metric === 'cache_hit_rate' ? 'below' : 'above'} threshold (${value} vs ${threshold.threshold})`,
        metadata: { metric, value, threshold: threshold.threshold, ...context }
      });
    }
  }

  private static getActiveAlerts() {
    const recentAlerts = this.events
      .filter(e => e.severity !== 'info' && Date.now() - new Date(e.timestamp).getTime() < 3600000) // Last hour
      .slice(-10);

    return recentAlerts.map(alert => ({
      id: alert.id,
      timestamp: alert.timestamp,
      severity: alert.severity,
      message: alert.message,
      type: alert.type
    }));
  }

  /**
   * Configuration methods
   */
  static updateAlertThreshold(metric: string, threshold: number, severity: 'info' | 'warning' | 'critical') {
    const existingIndex = this.alertThresholds.findIndex(t => t.metric === metric);
    
    if (existingIndex >= 0) {
      this.alertThresholds[existingIndex] = { metric, threshold, severity, enabled: true };
    } else {
      this.alertThresholds.push({ metric, threshold, severity, enabled: true });
    }
  }

  static disableAlert(metric: string) {
    const threshold = this.alertThresholds.find(t => t.metric === metric);
    if (threshold) {
      threshold.enabled = false;
    }
  }

  /**
   * Export data for external monitoring systems
   */
  static exportMetrics(format: 'json' | 'prometheus' = 'json') {
    if (format === 'prometheus') {
      // Prometheus format
      const lines: string[] = [];
      
      this.metrics.forEach(metric => {
        const labels = Object.entries(metric.tags)
          .map(([key, value]) => `${key}="${value}"`)
          .join(',');
        
        lines.push(`bnaua_quota_${metric.metric}{${labels}} ${metric.value} ${new Date(metric.timestamp).getTime()}`);
      });

      return lines.join('\n');
    }

    // JSON format (default)
    return {
      metrics: this.metrics.slice(-1000), // Last 1000 metrics
      events: this.events.slice(-100),    // Last 100 events
      timestamp: new Date().toISOString()
    };
  }
}

export { QuotaMonitor, type MonitoringEvent, type PerformanceMetric, type AlertThreshold };
