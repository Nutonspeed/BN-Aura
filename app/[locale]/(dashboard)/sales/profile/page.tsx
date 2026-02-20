'use client';

import { User, SpinnerGap } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function SalesProfile() {
  const [p, setP] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const { data } = await sb.from('users').select('*').eq('id', user.id).maybeSingle();
      const { data: staff } = await sb.from('clinic_staff').select('*, clinics(display_name)').eq('user_id', user.id).maybeSingle();
      setP({ user, data, staff });
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <SpinnerGap className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  const clinicName = (p?.staff?.clinics as any)?.display_name?.th || (p?.staff?.clinics as any)?.display_name?.en || 'N/A';

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-3 text-primary text-xs font-bold uppercase tracking-widest">
        <User className="w-4 h-4" />
        โปรไฟล์พนักงานขาย
      </div>
      <h1 className="text-3xl font-bold">{p?.data?.full_name || 'Sales Staff'}</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-card border border-border rounded-2xl p-6 space-y-2">
          <p className="text-sm text-muted-foreground">อีเมล</p>
          <p className="font-bold">{p?.user?.email}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 space-y-2">
          <p className="text-sm text-muted-foreground">คลินิก</p>
          <p className="font-bold">{clinicName}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 space-y-2">
          <p className="text-sm text-muted-foreground">ตำแหน่ง</p>
          <p className="font-bold capitalize">{p?.staff?.role || p?.data?.role || 'sales_staff'}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 space-y-2">
          <p className="text-sm text-muted-foreground">สถานะ</p>
          <p className="font-bold text-emerald-500">ใช้งานอยู่</p>
        </div>
      </div>
    </div>
  );
}
