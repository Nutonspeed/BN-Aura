'use client';

import { useState, useEffect, useCallback } from 'react';
import { NetworkNode } from '@/app/[locale]/(dashboard)/admin/network-map/page';

interface UseRealTimeNetworkDataProps {
  initialNodes: NetworkNode[];
  refreshInterval?: number;
  enableWebSocket?: boolean;
}

export function useRealTimeNetworkData({ 
  initialNodes, 
  refreshInterval = 5000,
  enableWebSocket = true 
}: UseRealTimeNetworkDataProps) {
  const [nodes, setNodes] = useState<NetworkNode[]>(initialNodes);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connected');
  const [trafficData, setTrafficData] = useState<Record<string, number>>({});

  // Simulate real-time updates
  const updateNodeMetrics = useCallback(() => {
    setNodes(prevNodes => 
      prevNodes.map(node => ({
        ...node,
        metrics: {
          ...node.metrics,
          latency: Math.max(5, node.metrics.latency + (Math.random() - 0.5) * 10),
          load: Math.max(0, Math.min(100, node.metrics.load + (Math.random() - 0.5) * 20)),
          uptime: Math.max(95, Math.min(99.99, node.metrics.uptime + (Math.random() - 0.5) * 0.5)),
        },
        // Randomly change status for demo
        status: Math.random() > 0.95 ? 
          (node.status === 'online' ? 'warning' : 'online') : 
          node.status
      }))
    );

    // Update traffic data
    setTrafficData(prev => {
      const newTraffic = { ...prev };
      Object.keys(newTraffic).forEach(key => {
        newTraffic[key] = Math.max(0, newTraffic[key] + (Math.random() - 0.5) * 100);
      });
      return newTraffic;
    });

    setLastUpdate(new Date());
  }, []);

  // Fetch fresh data from API
  const fetchFreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/network-map');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setNodes(data.data);
          setLastUpdate(new Date());
        }
      }
    } catch (error) {
      console.error('Failed to fetch network data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Simulate WebSocket connection
  useEffect(() => {
    if (!enableWebSocket) return;

    setConnectionStatus('connecting');
    
    // Simulate connection
    const connectionTimer = setTimeout(() => {
      setConnectionStatus('connected');
    }, 1000);

    // Simulate real-time updates
    const interval = setInterval(() => {
      if (connectionStatus === 'connected') {
        updateNodeMetrics();
      }
    }, refreshInterval);

    // Fetch fresh data every 30 seconds
    const fetchInterval = setInterval(() => {
      fetchFreshData();
    }, 30000);

    return () => {
      clearTimeout(connectionTimer);
      clearInterval(interval);
      clearInterval(fetchInterval);
    };
  }, [enableWebSocket, connectionStatus, refreshInterval, updateNodeMetrics, fetchFreshData]);

  // Manual refresh
  const refresh = useCallback(() => {
    fetchFreshData();
  }, [fetchFreshData]);

  return {
    nodes,
    isLoading,
    lastUpdate,
    connectionStatus,
    trafficData,
    refresh
  };
}
