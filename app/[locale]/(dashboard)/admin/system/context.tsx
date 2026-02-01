'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface SystemMetric {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  network_in: number;
  network_out: number;
  active_connections: number;
  response_time: number;
  error_rate: number;
}

export interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface SystemLog {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  source: string;
  metadata?: any;
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  last_check: string;
  services: {
    database: 'online' | 'offline' | 'degraded';
    api: 'online' | 'offline' | 'degraded';
    storage: 'online' | 'offline' | 'degraded';
    cache: 'online' | 'offline' | 'degraded';
  };
}

export interface SystemMonitoringContextType {
  metrics: SystemMetric[];
  alerts: SystemAlert[];
  logs: SystemLog[];
  health: SystemHealth | null;
  loading: boolean;
  refreshing: boolean;
  fetchMetrics: () => Promise<void>;
  fetchAlerts: () => Promise<void>;
  fetchLogs: () => Promise<void>;
  fetchHealth: () => Promise<void>;
  resolveAlert: (id: string) => Promise<void>;
  clearLogs: () => Promise<void>;
}

const SystemMonitoringContext = createContext<SystemMonitoringContextType | undefined>(undefined);

export const useSystemMonitoringContext = () => {
  const context = useContext(SystemMonitoringContext);
  if (!context) {
    throw new Error('useSystemMonitoringContext must be used within SystemMonitoringProvider');
  }
  return context;
};

export const SystemMonitoringProvider = ({ children }: { children: ReactNode }) => {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMetrics = useCallback(async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/admin/system/metrics');
      
      if (response.status === 401) {
        console.warn('User not authenticated for system metrics');
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setMetrics(data.data.metrics || []);
      } else {
        console.error('System metrics API error:', data.error);
      }
    } catch (error) {
      console.error('Error fetching system metrics:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/system/alerts');
      
      if (response.status === 401) {
        console.warn('User not authenticated for system alerts');
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setAlerts(data.data.alerts || []);
      } else {
        console.error('System alerts API error:', data.error);
      }
    } catch (error) {
      console.error('Error fetching system alerts:', error);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/system/logs');
      
      if (response.status === 401) {
        console.warn('User not authenticated for system logs');
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setLogs(data.data.logs || []);
      } else {
        console.error('System logs API error:', data.error);
      }
    } catch (error) {
      console.error('Error fetching system logs:', error);
    }
  }, []);

  const fetchHealth = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/system/health');
      
      if (response.status === 401) {
        console.warn('User not authenticated for system health');
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setHealth(data.data);
      } else {
        console.error('System health API error:', data.error);
      }
    } catch (error) {
      console.error('Error fetching system health:', error);
    }
  }, []);

  const resolveAlert = useCallback(async (id: string) => {
    try {
      const response = await fetch('/api/admin/system/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'resolve', id })
      });
      
      if (response.ok) {
        setAlerts(prev => prev.map(alert => 
          alert.id === id ? { ...alert, resolved: true } : alert
        ));
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  }, []);

  const clearLogs = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/system/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'clear' })
      });
      
      if (response.ok) {
        setLogs([]);
      }
    } catch (error) {
      console.error('Error clearing logs:', error);
    }
  }, []);

  const value: SystemMonitoringContextType = {
    metrics,
    alerts,
    logs,
    health,
    loading,
    refreshing,
    fetchMetrics,
    fetchAlerts,
    fetchLogs,
    fetchHealth,
    resolveAlert,
    clearLogs
  };

  return (
    <SystemMonitoringContext.Provider value={value}>
      {children}
    </SystemMonitoringContext.Provider>
  );
};
