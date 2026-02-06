'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';

interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency?: number;
  message?: string;
}

interface HealthData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  latency: number;
  version: string;
  environment: string;
  checks: HealthCheck[];
}

const statusConfig = {
  healthy: { color: 'bg-green-500', text: 'text-green-500', icon: '✅', label: 'Healthy' },
  degraded: { color: 'bg-yellow-500', text: 'text-yellow-500', icon: '⚠️', label: 'Degraded' },
  unhealthy: { color: 'bg-red-500', text: 'text-red-500', icon: '❌', label: 'Unhealthy' },
};

const serviceNames: Record<string, string> = {
  database: 'ฐานข้อมูล',
  ai_gateway: 'AI Gateway',
  storage: 'Storage',
  email: 'อีเมล',
  sms: 'SMS',
};

export default function SystemHealthCard() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/monitoring/health');
      const result = await response.json();
      setData(result);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch health:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          ไม่สามารถเชื่อมต่อได้
          <Button onClick={fetchHealth} variant="outline" size="sm" className="ml-2">
            ลองใหม่
          </Button>
        </CardContent>
      </Card>
    );
  }

  const config = statusConfig[data.status];

  return (
    <Card className="overflow-hidden">
      {/* Status Header */}
      <div className={`${config.color} p-4 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{config.icon}</span>
            <div>
              <h3 className="font-bold text-lg">System Status: {config.label}</h3>
              <p className="text-sm opacity-90">v{data.version} • {data.environment}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-90">{data.latency}ms</div>
            <Button 
              onClick={fetchHealth} 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/20"
              disabled={loading}
            >
              {loading ? '...' : '🔄'}
            </Button>
          </div>
        </div>
      </div>

      {/* Service Checks */}
      <CardContent className="p-4">
        <div className="space-y-3">
          {data.checks.map((check) => {
            const checkConfig = statusConfig[check.status];
            return (
              <div key={check.service} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${checkConfig.color}`} />
                  <div>
                    <div className="font-medium">{serviceNames[check.service] || check.service}</div>
                    {check.message && (
                      <div className="text-xs text-muted-foreground">{check.message}</div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {check.latency !== undefined && (
                    <span className="text-sm text-muted-foreground">{check.latency}ms</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {lastUpdate && (
          <div className="text-xs text-muted-foreground text-center mt-4">
            อัพเดทล่าสุด: {lastUpdate.toLocaleTimeString('th-TH')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
