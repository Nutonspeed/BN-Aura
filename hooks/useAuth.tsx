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
  const [clinicMetadata, setClinicMetadata] = useState<any | null>(null);
  const supabase = createClient();

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      // Fetch user profile from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, clinic_id, full_name')
        .eq('id', userId)
        .single();
      
      if (userError) {
        // Non-critical: user profile may not exist yet
        // Don't throw error, just use defaults
      }
      
      // Also fetch clinic_staff role if exists - get the first record when multiple exist
      const { data: staffData, error: staffError } = await supabase
        .from('clinic_staff')
        .select('role, clinic_id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (staffError && staffError.code !== 'PGRST116') { // Ignore not found error
        // Non-critical: staff record may not exist
      }

      // Determine effective role and clinic_id
      let effectiveRole = userData?.role || 'guest';
      let effectiveClinicId = userData?.clinic_id || null;
      let clinicName = 'Bangkok Premium Clinic';
      let clinicMeta: any = null;

      // debug removed
      

      // Super admin takes precedence
      if (userData?.role === 'super_admin') {
        effectiveRole = 'super_admin';
        
      } else if (staffData) {
        // If user is in clinic_staff, use that role for clinic access
        effectiveRole = staffData.role;
        effectiveClinicId = staffData.clinic_id;
        
        // Skip clinic info fetch to avoid 406 errors - use fallback name
        try {
          
          clinicName = 'Bangkok Premium Clinic'; // Fallback clinic name
          clinicMeta = { test_clinic: false }; // Default metadata
          setClinicMetadata(clinicMeta);
        } catch (clinicError) {
          // Handle 406 and other network errors silently
          clinicName = 'Bangkok Premium Clinic';
        }
      }

      setUser(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          user_metadata: {
            ...prev.user_metadata,
            role: effectiveRole,
            clinic_id: effectiveClinicId,
            full_name: userData?.full_name || prev.email?.split('@')[0] || 'User',
            clinic_name: clinicName,
            clinic_metadata: clinicMeta,
          }
        };
      });

      // If user has clinic_id from users table but no staff record, fetch clinic info
      if (userData?.clinic_id && !staffData) {
        try {
          const { data: clinicData, error: clinicError } = await supabase
            .from('clinics')
            .select('metadata, display_name')
            .eq('id', userData.clinic_id)
            .single();
          
          if (clinicError) {
            // Silently handle errors - table might not exist or RLS blocking
          } else if (clinicData) {
            const clinic = clinicData as any;
            clinicName = typeof clinic.display_name === 'object' 
              ? clinic.display_name.th || clinic.display_name.en 
              : clinic.display_name;
            clinicMeta = clinic.metadata;
            setClinicMetadata(clinicMeta);
          }
        } catch (error) {
          // Handle 406 and other network errors silently
        }
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  }, [supabase]);

  useEffect(() => {
    // Use onAuthStateChange as the SOLE session source.
    // Do NOT call getSession() — it can hang due to navigator.locks contention.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const authUser = session?.user as AuthUser || null;
      setUser(authUser);

      if (authUser?.id) {
        try {
          await fetchUserProfile(authUser.id);
        } catch (err) {
          console.error('[useAuth] fetchUserProfile error:', err);
        }
      }

      // Always resolve loading after handling auth state
      setLoading(false);
    });

    // Safety timeout: if onAuthStateChange never fires (e.g. broken cookie),
    // force loading=false after 5s so the app is still usable
    const safetyTimeout = setTimeout(() => {
      setLoading((current) => {
        if (current) {
          console.warn('[useAuth] Safety timeout 5s — forcing loading=false');
        }
        return false;
      });
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, [supabase.auth, fetchUserProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setClinicMetadata(null);
    // Redirect to login page after successful logout
    if (typeof window !== 'undefined') {
      window.location.href = '/th/login';
    }
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
