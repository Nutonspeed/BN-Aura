'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { SupportContextType, SupportTicket, SupportStats } from './types';

const SupportContext = createContext<SupportContextType | undefined>(undefined);

export const useSupportContext = () => {
  const context = useContext(SupportContext);
  if (!context) {
    throw new Error('useSupportContext must be used within SupportProvider');
  }
  return context;
};

export const SupportProvider = ({ children }: { children: ReactNode }) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<SupportStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    search: '',
    page: 1
  });

  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const refreshTickets = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: filters.page.toString(),
        limit: '20'
      });

      if (filters.status !== 'all') {
        params.append('status', filters.status);
      }
      if (filters.priority !== 'all') {
        params.append('priority', filters.priority);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }

      const response = await fetch(`/api/admin/support/tickets?${params}`);
      const data = await response.json();

      if (data.success) {
        setTickets(data.data.tickets);
        setStats(data.data.stats);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const value: SupportContextType = {
    tickets,
    stats,
    loading,
    selectedTicket,
    filters,
    setTickets,
    setStats,
    setSelectedTicket,
    updateFilters,
    refreshTickets
  };

  return (
    <SupportContext.Provider value={value}>
      {children}
    </SupportContext.Provider>
  );
};
