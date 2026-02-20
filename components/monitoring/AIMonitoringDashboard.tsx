'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  TrendingDown,
  Zap,
  Server,
  Database
} from 'lucide-react';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  metrics: {
    count: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    p95Duration: number;
    errorRate: number;
  };
  alerts: Array<{
    operation: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

interface SystemHealth {
  status: string;
  checks: any;
  services: any;
  aiPipeline: HealthStatus;
  responseTime: string;
  uptime: number;
}

export default function AIMonitoringDashboard() {
  const [healthData, setHealthData] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchHealthStatus = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setHealthData(data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch health status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthStatus();

    if (autoRefresh) {
      const interval = setInterval(fetchHealthStatus, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'degraded':
        return 'text-yellow-600';
      case 'unhealthy':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'unhealthy':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!healthData) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load monitoring data. Please refresh the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Pipeline Monitoring</h2>
          <p className="text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="h-4 w-4 mr-2" />
            Auto Refresh: {autoRefresh ? 'On' : 'Off'}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchHealthStatus}>
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>System Status</span>
            <div className="flex items-center space-x-2">
              {getStatusIcon(healthData.status)}
              <span className={`font-semibold ${getStatusColor(healthData.status)}`}>
                {healthData.status.toUpperCase()}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Server className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Response Time</p>
                <p className="font-semibold">{healthData.responseTime}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Uptime</p>
                <p className="font-semibold">{formatUptime(healthData.uptime)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Database</p>
                <p className="font-semibold capitalize">{healthData.services.database}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">AI Pipeline</p>
                <p className="font-semibold capitalize">{healthData.aiPipeline.status}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Pipeline Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthData.aiPipeline.metrics.count}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(healthData.aiPipeline.metrics.avgDuration)}
            </div>
            <div className="flex items-center text-xs">
              {healthData.aiPipeline.metrics.avgDuration > 3000 ? (
                <TrendingUp className="h-3 w-3 text-red-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
              )}
              <span className={healthData.aiPipeline.metrics.avgDuration > 3000 ? 'text-red-500' : 'text-green-500'}>
                {healthData.aiPipeline.metrics.avgDuration > 3000 ? 'High' : 'Normal'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">P95 Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(healthData.aiPipeline.metrics.p95Duration)}
            </div>
            <p className="text-xs text-muted-foreground">95th percentile</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthData.aiPipeline.metrics.errorRate.toFixed(1)}%</div>
            <Progress 
              value={healthData.aiPipeline.metrics.errorRate} 
              className="mt-2"
              indicatorClassName={healthData.aiPipeline.metrics.errorRate > 5 ? 'bg-red-500' : 'bg-green-500'}
            />
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {healthData.aiPipeline.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {healthData.aiPipeline.alerts.map((alert, index) => (
                <Alert key={index} variant={alert.severity === 'high' ? 'destructive' : 'default'}>
                  <AlertDescription className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{alert.operation}:</span> {alert.message}
                    </div>
                    <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'}>
                      {alert.severity}
                    </Badge>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Min Duration</p>
              <p className="font-semibold">{formatDuration(healthData.aiPipeline.metrics.minDuration)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Max Duration</p>
              <p className="font-semibold">{formatDuration(healthData.aiPipeline.metrics.maxDuration)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Average Duration</p>
              <p className="font-semibold">{formatDuration(healthData.aiPipeline.metrics.avgDuration)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">P95 Duration</p>
              <p className="font-semibold">{formatDuration(healthData.aiPipeline.metrics.p95Duration)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
