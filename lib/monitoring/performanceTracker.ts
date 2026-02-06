/**
 * Performance Tracker - Monitor app performance metrics
 * Tracks: API latency, page load times, AI response times
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

interface APIMetric {
  endpoint: string;
  method: string;
  statusCode: number;
  latency: number;
  timestamp: number;
}

// In-memory storage (use analytics service in production)
const metrics: PerformanceMetric[] = [];
const apiMetrics: APIMetric[] = [];

class PerformanceTracker {
  
  /**
   * Track a performance metric
   */
  static track(name: string, value: number, tags?: Record<string, string>): void {
    metrics.push({
      name,
      value,
      timestamp: Date.now(),
      tags,
    });
    
    // Keep only last 1000 metrics
    if (metrics.length > 1000) {
      metrics.shift();
    }
  }

  /**
   * Track API call performance
   */
  static trackAPI(metric: Omit<APIMetric, 'timestamp'>): void {
    apiMetrics.push({
      ...metric,
      timestamp: Date.now(),
    });
    
    // Keep only last 500 API metrics
    if (apiMetrics.length > 500) {
      apiMetrics.shift();
    }
  }

  /**
   * Measure function execution time
   */
  static async measure<T>(
    name: string,
    fn: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      this.track(name, performance.now() - start, { ...tags, status: 'success' });
      return result;
    } catch (error) {
      this.track(name, performance.now() - start, { ...tags, status: 'error' });
      throw error;
    }
  }

  /**
   * Get performance summary
   */
  static getSummary(minutes: number = 60): {
    api: {
      totalRequests: number;
      avgLatency: number;
      p95Latency: number;
      errorRate: number;
      byEndpoint: Record<string, { count: number; avgLatency: number }>;
    };
    custom: {
      byName: Record<string, { count: number; avg: number; min: number; max: number }>;
    };
  } {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    
    // API metrics
    const recentAPI = apiMetrics.filter(m => m.timestamp >= cutoff);
    const latencies = recentAPI.map(m => m.latency).sort((a, b) => a - b);
    const errors = recentAPI.filter(m => m.statusCode >= 400);
    
    const byEndpoint: Record<string, { count: number; totalLatency: number }> = {};
    for (const m of recentAPI) {
      if (!byEndpoint[m.endpoint]) {
        byEndpoint[m.endpoint] = { count: 0, totalLatency: 0 };
      }
      byEndpoint[m.endpoint].count++;
      byEndpoint[m.endpoint].totalLatency += m.latency;
    }

    // Custom metrics
    const recentCustom = metrics.filter(m => m.timestamp >= cutoff);
    const byName: Record<string, { values: number[] }> = {};
    for (const m of recentCustom) {
      if (!byName[m.name]) {
        byName[m.name] = { values: [] };
      }
      byName[m.name].values.push(m.value);
    }

    return {
      api: {
        totalRequests: recentAPI.length,
        avgLatency: latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
        p95Latency: latencies.length ? latencies[Math.floor(latencies.length * 0.95)] : 0,
        errorRate: recentAPI.length ? (errors.length / recentAPI.length) * 100 : 0,
        byEndpoint: Object.fromEntries(
          Object.entries(byEndpoint).map(([k, v]) => [k, { count: v.count, avgLatency: v.totalLatency / v.count }])
        ),
      },
      custom: {
        byName: Object.fromEntries(
          Object.entries(byName).map(([k, v]) => [
            k,
            {
              count: v.values.length,
              avg: v.values.reduce((a, b) => a + b, 0) / v.values.length,
              min: Math.min(...v.values),
              max: Math.max(...v.values),
            },
          ])
        ),
      },
    };
  }

  /**
   * Web Vitals tracking (client-side)
   */
  static trackWebVitals(metric: { name: string; value: number; id: string }): void {
    this.track(`webvital_${metric.name}`, metric.value, { id: metric.id });
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[WebVital] ${metric.name}: ${metric.value.toFixed(2)}`);
    }
  }
}

export { PerformanceTracker };
export type { PerformanceMetric, APIMetric };
