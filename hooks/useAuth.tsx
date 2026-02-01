'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthUser extends User {
  user_metadata: {
    role?: string;
    clinic_id?: string;
    full_name?: string;
    clinic_name?: string;
    clinic_metadata?: any;
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
  getClinicMetadata: () => any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [clinicMetadata, setClinicMetadata] = useState<any>(null);
  const supabase = createClient();

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      // Fetch user profile from users table
      const { data: userData, error } = await supabase
        .from('users')
        .select('role, clinic_id, full_name')
        .eq('id', userId)
        .single();
      
      // Also fetch clinic_staff role if exists
      const { data: staffData } = await supabase
        .from('clinic_staff')
        .select('role, clinic_id, clinics(display_name, metadata)')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      // Determine effective role and clinic_id
      let effectiveRole = userData?.role || 'guest';
      let effectiveClinicId = userData?.clinic_id || null;
      let clinicName = 'Bangkok Premium Clinic';
      let clinicMeta = null;

      // If user is in clinic_staff, use that role for clinic access
      if (staffData) {
        effectiveRole = staffData.role;
        effectiveClinicId = staffData.clinic_id;
        if (staffData.clinics) {
          const clinic = staffData.clinics as any;
          clinicName = typeof clinic.display_name === 'object' 
            ? clinic.display_name.th || clinic.display_name.en 
            : clinic.display_name;
          clinicMeta = clinic.metadata;
          setClinicMetadata(clinicMeta);
        }
      }

      // Super admin keeps their role but can access clinic if in clinic_staff
      if (userData?.role === 'super_admin') {
        effectiveRole = 'super_admin';
      }

      setUser(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          user_metadata: {
            ...prev.user_metadata,
            role: effectiveRole,
            clinic_id: effectiveClinicId,
            full_name: userData?.full_name || prev.email?.split('@')[0],
            clinic_name: clinicName,
            clinic_metadata: clinicMeta,
          }
        };
      });

      // If user has clinic_id from users table but no staff record, fetch clinic info
      if (userData?.clinic_id && !staffData) {
        const { data: clinicData } = await supabase
          .from('clinics')
          .select('metadata, display_name')
          .eq('id', userData.clinic_id)
          .single();
        if (clinicData) {
          setClinicMetadata(clinicData.metadata);
          setUser(prev => {
            if (!prev) return prev;
            const displayName = typeof clinicData.display_name === 'object' 
              ? (clinicData.display_name as any).th || (clinicData.display_name as any).en 
              : clinicData.display_name;
            return {
              ...prev,
              user_metadata: {
                ...prev.user_metadata,
                clinic_name: displayName,
                clinic_metadata: clinicData.metadata,
              }
            };
          });
        }
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  }, [supabase]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const authUser = session?.user as AuthUser || null;
      setUser(authUser);
      if (authUser?.id) {
        fetchUserProfile(authUser.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const authUser = session?.user as AuthUser || null;
      setUser(authUser);
      if (authUser?.id) {
        fetchUserProfile(authUser.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, fetchUserProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setClinicMetadata(null);
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

  const getClinicMetadata = (): any => {
    return clinicMetadata || {};
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
    getClinicMetadata,
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
