'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PermissionsContextType, Role, UserRole, Permission, TabType } from './types';

const supabase = createClient();

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export const usePermissionsContext = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissionsContext must be used within PermissionsProvider');
  }
  return context;
};

export const PermissionsProvider = ({ children }: { children: ReactNode }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<UserRole[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('roles');

  useEffect(() => {
    fetchPermissionsData();
  }, []);

  const fetchPermissionsData = async () => {
    try {
      setLoading(true);
      
      // Get token from localStorage the same way we did in Support/Security pages
      let token = null;
      
      try {
        const sessionStr = localStorage.getItem('sb-sb-royeyoxaaieipdajijni-auth-token');
        
        if (sessionStr) {
          const base64Data = sessionStr.replace('base64-', '');
          const decodedSession = JSON.parse(atob(base64Data));
          token = decodedSession.access_token;
        }
      } catch (tokenError) {
        console.warn('Failed to get token from localStorage:', tokenError);
      }
      
      // Fallback: Try to get session from Supabase client
      if (!token) {
        try {
          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();
          token = session?.access_token;
        } catch (supabaseError) {
          console.warn('Failed to get token from Supabase client:', supabaseError);
        }
      }
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch('/api/admin/permissions?type=all', {
        method: 'GET',
        headers
      });
      
      if (!res.ok) throw new Error('Failed to fetch permissions data');
      const { data } = await res.json();
      
      setRoles(data.roles || []);
      setUsers(data.users || []);
      setPermissions(data.permissions || []);
    } catch (error) {
      console.error('Error fetching permissions data:', error);
    } finally {
      setLoading(false);
    }
  };

  const value: PermissionsContextType = {
    roles,
    users,
    permissions,
    loading,
    searchTerm,
    activeTab,
    setRoles,
    setUsers,
    setPermissions,
    setSearchTerm,
    setActiveTab
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};
