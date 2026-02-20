'use client';

import { Calendar, SpinnerGap } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Breadcrumb from '@/components/ui/Breadcrumb';

export default function BeauticianAppointments() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const today = new Date().toISOString().split('T')[0];
      const { data } = await sb
        .from('appointments')
        .select('*, customers(full_name, phone)')
        .eq('staff_id', user.id)
        .gte('appointment_date', today)
        .order('appointment_date', { ascending: true })
        .limit(20);
      setAppointments(data || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="h-[60vh] flex items-center justify-center"><SpinnerGap className="w-10 h-10 text-primary animate-spin" /></div>;

  return (
    <div className="space-y-6 pb-20">
      <Breadcrumb />
      <div className="flex items-center gap-3 text-primary text-xs font-bold uppercase tracking-widest">
        <Calendar className="w-4 h-4" />
        นัดหมายของฉัน
      </div>
      <h1 className="text-3xl font-bold">ตารางนัดหมาย</h1>
      {appointments.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">ไม่มีนัดหมายที่จะถึง</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => (
            <div key={apt.id} className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p className="font-bold">{(apt.customers as any)?.full_name || 'ลูกค้า'}</p>
                <p className="text-sm text-muted-foreground">{apt.appointment_date} {apt.start_time || ''}</p>
                <p className="text-xs text-muted-foreground">{(apt.customers as any)?.phone || ''}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${apt.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                {apt.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
