'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthUser extends User {
  user_metadata: {
    role?: string;
    clinic_id?: string;
    full_name?: string;
    clinic_name?: string;
  };
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  getUserRole: () => string;
  getClinicId: () => string | null;
  getUserId: () => string | null;
  getFullName: () => string;
  getClinicName: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user as AuthUser || null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user as AuthUser || null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const getUserRole = (): string => {
    return user?.user_metadata?.role || 'guest';
  };

  const getClinicId = (): string | null => {
    return user?.user_metadata?.clinic_id || null;
  };

  const getUserId = (): string | null => {
    return user?.id || null;
  };

  const getFullName = (): string => {
    return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  };

  const getClinicName = (): string => {
    return user?.user_metadata?.clinic_name || 'Bangkok Premium Clinic';
  };

  const value = {
    user,
    loading,
    signOut,
    getUserRole,
    getClinicId,
    getUserId,
    getFullName,
    getClinicName,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Hook for clinic-specific data
export const useClinicContext = () => {
  const { getClinicId, getClinicName, getUserRole } = useAuth();
  
  const clinicId = getClinicId();
  const clinicName = getClinicName();
  const userRole = getUserRole();
  
  const hasClinicAccess = (requiredRoles: string[] = []) => {
    return requiredRoles.length === 0 || requiredRoles.includes(userRole);
  };

  const canManageStaff = () => {
    return ['clinic_owner', 'clinic_admin'].includes(userRole);
  };

  const canViewFinancials = () => {
    return ['clinic_owner', 'clinic_admin'].includes(userRole);
  };

  const canPerformScans = () => {
    return ['clinic_owner', 'clinic_staff', 'sales_staff'].includes(userRole);
  };

  return {
    clinicId,
    clinicName,
    userRole,
    hasClinicAccess,
    canManageStaff,
    canViewFinancials,
    canPerformScans,
  };
};
