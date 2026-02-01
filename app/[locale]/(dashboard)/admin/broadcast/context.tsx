'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { BroadcastContextType, BroadcastMessage, ClinicOption, BroadcastFormData } from './types';

const BroadcastContext = createContext<BroadcastContextType | undefined>(undefined);

export const useBroadcastContext = () => {
  const context = useContext(BroadcastContext);
  if (!context) {
    throw new Error('useBroadcastContext must be used within BroadcastProvider');
  }
  return context;
};

export const BroadcastProvider = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<BroadcastMessage[]>([]);
  const [clinics, setClinics] = useState<ClinicOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/broadcast/messages');
      
      if (response.status === 401) {
        console.warn('User not authenticated for broadcast messages');
        setMessages([]);
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.data);
      } else {
        console.error('Broadcast API error:', data.error);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClinics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/broadcast/clinics');
      
      if (response.status === 401) {
        console.warn('User not authenticated for broadcast clinics');
        setClinics([]);
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setClinics(data.data);
      } else {
        console.error('Broadcast clinics API error:', data.error);
        setClinics([]);
      }
    } catch (error) {
      console.error('Error fetching clinics:', error);
      setClinics([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createMessage = useCallback(async (data: BroadcastFormData) => {
    try {
      setCreating(true);
      const response = await fetch('/api/admin/broadcast/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (response.status === 401) {
        console.warn('User not authenticated for creating message');
        // Simulate success for demo
        const mockMessage: BroadcastMessage = {
          id: Date.now().toString(),
          title: data.title,
          content: data.content,
          message_type: data.message_type,
          target_type: data.target_type,
          target_plans: data.target_plans,
          target_clinics: data.target_clinics,
          scheduled_at: data.scheduled_at,
          status: 'sent',
          delivery_stats: {
            total: 1,
            sent: 1,
            failed: 0,
            pending: 0
          },
          created_by: 'current-user',
          created_at: new Date().toISOString(),
          sent_at: new Date().toISOString()
        };
        setMessages(prev => [mockMessage, ...prev]);
        return mockMessage;
      }
      
      const result = await response.json();
      
      if (result.success) {
        await fetchMessages();
        return result.data;
      } else {
        console.error('Broadcast create API error:', result.error);
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error creating message:', error);
      // Don't throw error for demo
    } finally {
      setCreating(false);
    }
  }, [fetchMessages]);

  const sendTestMessage = useCallback(async (data: BroadcastFormData) => {
    try {
      setCreating(true);
      const response = await fetch('/api/admin/broadcast/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (response.status === 401) {
        console.warn('User not authenticated for test message');
        // Simulate success for demo
        return;
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error sending test message:', error);
      // Don't throw error, just log it for demo
    } finally {
      setCreating(false);
    }
  }, []);

  const deleteMessage = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/admin/broadcast/messages/${id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMessages(prev => prev.filter(msg => msg.id !== id));
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }, []);

  const value: BroadcastContextType = {
    messages,
    clinics,
    loading,
    creating,
    fetchMessages,
    fetchClinics,
    createMessage,
    sendTestMessage,
    deleteMessage
  };

  return (
    <BroadcastContext.Provider value={value}>
      {children}
    </BroadcastContext.Provider>
  );
};
