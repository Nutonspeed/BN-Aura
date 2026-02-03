'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { NetworkNode } from '@/app/[locale]/(dashboard)/admin/network-map/page';

export function useRealNetworkData() {
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');

  const supabase = createClient();

  // Fetch initial data
  const fetchNodes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('network_nodes')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      // Transform database data to NetworkNode format
      const transformedNodes: NetworkNode[] = data.map(node => ({
        id: node.id,
        name: node.name,
        type: node.type as NetworkNode['type'],
        status: node.status as NetworkNode['status'],
        location: node.location,
        metrics: node.metrics as NetworkNode['metrics']
      }));

      setNodes(transformedNodes);
      setLastUpdate(new Date());
      setConnectionStatus('connected');
    } catch (err) {
      console.error('Error fetching network nodes:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setConnectionStatus('disconnected');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Set up real-time subscription
  useEffect(() => {
    fetchNodes();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('network_nodes_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'network_nodes',
          filter: 'is_active=eq.true'
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          
          switch (payload.eventType) {
            case 'INSERT':
              if (payload.new && payload.new.is_active) {
                setNodes(prev => [...prev, {
                  id: payload.new.id,
                  name: payload.new.name,
                  type: payload.new.type as NetworkNode['type'],
                  status: payload.new.status as NetworkNode['status'],
                  location: payload.new.location,
                  metrics: payload.new.metrics as NetworkNode['metrics']
                }]);
              }
              break;
              
            case 'UPDATE':
              if (payload.new && payload.new.is_active) {
                setNodes(prev => prev.map(node => 
                  node.id === payload.new.id 
                    ? {
                        id: payload.new.id,
                        name: payload.new.name,
                        type: payload.new.type as NetworkNode['type'],
                        status: payload.new.status as NetworkNode['status'],
                        location: payload.new.location,
                        metrics: payload.new.metrics as NetworkNode['metrics']
                      }
                    : node
                ));
              }
              break;
              
            case 'DELETE':
              if (payload.old) {
                setNodes(prev => prev.filter(node => node.id !== payload.old.id));
              }
              break;
          }
          
          setLastUpdate(new Date());
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else if (status === 'CHANNEL_ERROR') {
          setConnectionStatus('disconnected');
        }
      });

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchNodes]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchNodes();
  }, [fetchNodes]);

  return {
    nodes,
    isLoading,
    error,
    lastUpdate,
    connectionStatus,
    refresh
  };
}
