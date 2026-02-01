'use client';

import { useAuth } from '@/hooks/useAuth';
import StaffProfileManager from '@/components/staff/StaffProfileManager';

/**
 * M1.1: Staff Profile Management Page
 * Micro-module integration for staff CRUD operations
 */

export default function StaffManagement() {
  const { getClinicId } = useAuth();
  const clinicId = getClinicId();

  return (
    <StaffProfileManager 
      clinicId={clinicId || undefined}
    />
  );
}
