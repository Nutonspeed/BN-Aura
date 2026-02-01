'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PermissionsContextType, Role, UserRole, Permission, TabType } from './types';

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
      const res = await fetch('/api/admin/permissions?type=all');
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
