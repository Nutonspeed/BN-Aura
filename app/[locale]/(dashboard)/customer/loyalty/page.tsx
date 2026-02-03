'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import LoyaltyDashboard from '@/components/customer/LoyaltyDashboard';

export default function CustomerLoyaltyPage() {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [clinicId, setClinicId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setCustomerId(null);
          setClinicId(null);
          return;
        }

        const { data: customer } = await supabase
          .from('customers')
          .select('id, clinic_id')
          .eq('user_id', user.id)
          .single();

        if (customer) {
          setCustomerId(customer.id);
          setClinicId(customer.clinic_id);
        } else {
          setCustomerId(null);
          setClinicId(null);
        }
      } catch (err) {
        console.error('Customer loyalty page error:', err);
        setCustomerId(null);
        setClinicId(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [supabase]);

  if (loading) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!customerId || !clinicId) {
    return (
      <div className="p-8">
        <div className="text-white text-lg font-bold mb-2">Loyalty</div>
        <div className="text-gray-400 text-sm">Customer profile not found.</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <LoyaltyDashboard customerId={customerId} clinicId={clinicId} />
    </div>
  );
}
