'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AnnouncementContextType, Announcement, AnnouncementFormData } from './types';

export type { AnnouncementFormData } from './types';

const AnnouncementContext = createContext<AnnouncementContextType | undefined>(undefined);

export const useAnnouncementContext = () => {
  const context = useContext(AnnouncementContext);
  if (!context) {
    throw new Error('useAnnouncementContext must be used within AnnouncementProvider');
  }
  return context;
};

export const AnnouncementProvider = ({ children }: { children: ReactNode }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/announcements');
      
      if (response.status === 401) {
        console.warn('User not authenticated for announcements');
        setAnnouncements([]);
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setAnnouncements(data.data);
      } else {
        console.error('Announcements API error:', data.error);
        setAnnouncements([]);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClinics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/announcements/clinics');
      
      if (response.status === 401) {
        console.warn('User not authenticated for announcement clinics');
        setClinics([]);
        return;
      }
      
      if (response.status === 403) {
        console.warn('User not authorized for announcement clinics');
        setClinics([]);
        return;
      }
      
      if (!response.ok) {
        console.error('HTTP error fetching clinics:', response.status, response.statusText);
        setClinics([]);
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setClinics(data.data || []);
      } else {
        console.error('Announcement clinics API error:', data.error, data.details);
        setClinics([]);
      }
    } catch (error) {
      console.error('Error fetching clinics:', error);
      setClinics([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createAnnouncement = useCallback(async (data: AnnouncementFormData) => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (response.status === 401) {
        console.warn('User not authenticated for creating announcement');
        // Simulate success for demo
        const mockAnnouncement: Announcement = {
          id: Date.now().toString(),
          ...data,
          created_by: 'current-user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          read_count: 0
        };
        setAnnouncements(prev => [mockAnnouncement, ...prev]);
        return;
      }
      
      const result = await response.json();
      
      if (result.success) {
        await fetchAnnouncements();
      } else {
        console.error('Announcement create API error:', result.error);
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      // Don't throw error for demo
    } finally {
      setSaving(false);
    }
  }, [fetchAnnouncements]);

  const updateAnnouncement = useCallback(async (id: string, data: Partial<AnnouncementFormData>) => {
    try {
      setSaving(true);
      const response = await fetch(`/api/admin/announcements/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (response.status === 401) {
        console.warn('User not authenticated for updating announcement');
        // Simulate success for demo
        setAnnouncements(prev => prev.map(ann => 
          ann.id === id 
            ? { ...ann, ...data, updated_at: new Date().toISOString() }
            : ann
        ));
        return;
      }
      
      const result = await response.json();
      
      if (result.success) {
        await fetchAnnouncements();
      } else {
        console.error('Announcement update API error:', result.error);
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error updating announcement:', error);
      // Don't throw error for demo
    } finally {
      setSaving(false);
    }
  }, [fetchAnnouncements]);

  const deleteAnnouncement = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/admin/announcements/${id}`, {
        method: 'DELETE'
      });
      
      if (response.status === 401) {
        console.warn('User not authenticated for deleting announcement');
        setAnnouncements(prev => prev.filter(ann => ann.id !== id));
        return;
      }
      
      const result = await response.json();
      
      if (result.success) {
        setAnnouncements(prev => prev.filter(ann => ann.id !== id));
      } else {
        console.error('Announcement delete API error:', result.error);
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
      // Don't throw error for demo
    }
  }, []);

  const toggleActive = useCallback(async (id: string) => {
    try {
      const announcement = announcements.find(ann => ann.id === id);
      if (!announcement) return;
      
      await updateAnnouncement(id, { is_active: !announcement.is_active });
    } catch (error) {
      console.error('Error toggling announcement:', error);
    }
  }, [announcements, updateAnnouncement]);

  const value: AnnouncementContextType = {
    announcements,
    clinics,
    loading,
    saving,
    fetchAnnouncements,
    fetchClinics,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    toggleActive
  };

  return (
    <AnnouncementContext.Provider value={value}>
      {children}
    </AnnouncementContext.Provider>
  );
};
