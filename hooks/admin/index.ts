'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface SystemMetric {
  id: string;
  timestamp: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_in: number;
  network_out: number;
  active_connections: number;
  response_time: number;
  error_rate: number;
}

interface SystemAlert {
  id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  is_resolved: boolean;
  resolved_at?: string;
  created_at: string;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  last_check: string;
  services: {
    database: 'online' | 'offline';
    api: 'online' | 'offline';
    storage: 'online' | 'offline';
    cache: 'online' | 'offline';
  };
  alerts_count: number;
  latest_metrics: SystemMetric | null;
}

export function useRealtimeMetrics(refreshInterval = 30000) {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/admin/system?type=metrics');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      
      const data = await response.json();
      if (data.success) {
        setMetrics(data.data.metrics || []);
      }
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchMetrics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchMetrics, refreshInterval]);

  return { metrics, loading, error, refreshMetrics: fetchMetrics };
}

export function useSystemAlerts(refreshInterval = 60000) {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/admin/system?type=alerts');
      if (!response.ok) throw new Error('Failed to fetch alerts');
      
      const data = await response.json();
      if (data.success) {
        setAlerts(data.data.alerts || []);
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  const resolveAlert = useCallback(async (alertId: string) => {
    try {
      const response = await fetch('/api/admin/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resolve',
          type: 'alert',
          id: alertId
        })
      });

      if (response.ok) {
        setAlerts(prev => prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, is_resolved: true, resolved_at: new Date().toISOString() }
            : alert
        ));
      }
    } catch (err) {
      console.error('Error resolving alert:', err);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchAlerts, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchAlerts, refreshInterval]);

  return { alerts, loading, error, refreshAlerts: fetchAlerts, resolveAlert };
}

export function useSystemHealth(refreshInterval = 30000) {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/admin/system?type=health');
      if (!response.ok) throw new Error('Failed to fetch health');
      
      const data = await response.json();
      if (data.success) {
        setHealth(data.data);
      }
    } catch (err) {
      console.error('Error fetching health:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch health');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchHealth, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchHealth, refreshInterval]);

  return { health, loading, error, refreshHealth: fetchHealth };
}

export function useAuditLogs(refreshInterval = 60000) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    action: '',
    table: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 50
  });

  const fetchLogs = useCallback(async () => {
    try {
      setError(null);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });

      const response = await fetch(`/api/admin/audit/logs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch audit logs');
      
      const data = await response.json();
      if (data.success) {
        setLogs(data.data.logs || []);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const addLog = useCallback(async (logData: any) => {
    try {
      const response = await fetch('/api/admin/audit/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setLogs(prev => [data.data.log, ...prev]);
        }
      }
    } catch (err) {
      console.error('Error adding audit log:', err);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchLogs, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchLogs, refreshInterval]);

  return { 
    logs, 
    loading, 
    error, 
    filters, 
    setFilters, 
    refreshLogs: fetchLogs, 
    addLog 
  };
}

export function useSupportTickets(refreshInterval = 30000) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    search: '',
    page: 1,
    limit: 20
  });

  const fetchTickets = useCallback(async () => {
    try {
      setError(null);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });

      const response = await fetch(`/api/admin/support/tickets?${params}`);
      if (!response.ok) throw new Error('Failed to fetch support tickets');
      
      const data = await response.json();
      if (data.success) {
        setTickets(data.data.tickets || []);
      }
    } catch (err) {
      console.error('Error fetching support tickets:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch support tickets');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const updateTicket = useCallback(async (ticketId: string, updates: any) => {
    try {
      const response = await fetch('/api/admin/support/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ticketId, ...updates })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTickets(prev => prev.map(ticket => 
            ticket.id === ticketId ? { ...ticket, ...data.data.ticket } : ticket
          ));
        }
      }
    } catch (err) {
      console.error('Error updating ticket:', err);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchTickets, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchTickets, refreshInterval]);

  return { 
    tickets, 
    loading, 
    error, 
    filters, 
    setFilters, 
    refreshTickets: fetchTickets, 
    updateTicket 
  };
}

// Supabase Realtime subscription hook
export function useRealtimeSubscription<T = any>(
  table: string,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
  callback: (payload: any) => void,
  filter?: string
) {
  const [client, setClient] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    const initClient = async () => {
      const supabase = await createClient();
      setClient(supabase);
    };

    initClient();
  }, []);

  useEffect(() => {
    if (!client) return;

    const channel = client
      .channel(`realtime-${table}`)
      .on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table,
          filter
        },
        callback
      )
      .subscribe();

    setSubscription(channel);

    return () => {
      if (subscription) {
        client.removeChannel(subscription);
      }
    };
  }, [client, table, event, filter, callback]);

  return subscription;
}
