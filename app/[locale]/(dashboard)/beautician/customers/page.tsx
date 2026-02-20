'use client';

import { Users, SpinnerGap } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Breadcrumb from '@/components/ui/Breadcrumb';

export default function BeauticianCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const { data } = await sb
        .from('customer_treatment_journeys')
        .select('*, customers(id, full_name, phone, email)')
        .eq('assigned_beautician_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      const uniqueCustomers = new Map();
      (data || []).forEach((j: any) => {
        if (j.customers && !uniqueCustomers.has(j.customers.id)) {
          uniqueCustomers.set(j.customers.id, j.customers);
        }
      });
      setCustomers(Array.from(uniqueCustomers.values()));
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="h-[60vh] flex items-center justify-center"><SpinnerGap className="w-10 h-10 text-primary animate-spin" /></div>;

  return (
    <div className="space-y-6 pb-20">
      <Breadcrumb />
      <div className="flex items-center gap-3 text-primary text-xs font-bold uppercase tracking-widest">
        <Users className="w-4 h-4" />
        ลูกค้าที่ดูแล
      </div>
      <h1 className="text-3xl font-bold">ลูกค้าของฉัน</h1>
      {customers.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">ยังไม่มีลูกค้าที่ได้รับมอบหมาย</p>
        </div>
      ) : (
        <div className="space-y-3">
          {customers.map((c) => (
            <div key={c.id} className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                {c.full_name?.charAt(0) || '?'}
              </div>
              <div>
                <p className="font-bold">{c.full_name}</p>
                <p className="text-sm text-muted-foreground">{c.phone || c.email || ''}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
