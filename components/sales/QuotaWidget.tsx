'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  Lightning,
  Warning,
  Brain
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

export default function QuotaWidget() {
  const [quota, setQuota] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuota();
    const interval = setInterval(fetchQuota, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchQuota = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: staff } = await supabase.from('clinic_staff').select('clinic_id').eq('user_id', user.id).single();
      if (!staff?.clinic_id) return;
      
      const res = await fetch(`/api/quota/billing-test?action=quota-config&clinicId=${staff.clinic_id}`);
      const result = await res.json();
      if (result.success) {
        const q = result.data;
        setQuota({
          used: q.currentUsage || 0,
          total: q.monthlyQuota || 200,
          rate: Math.round((q.currentUsage / q.monthlyQuota) * 100),
          remaining: Math.max(0, q.monthlyQuota - q.currentUsage),
          plan: q.plan || 'professional'
        });
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  if (loading) return <Card className="p-4 animate-pulse h-24" />;

  const rate = quota?.rate || 0;
  const color = rate >= 95 ? 'red' : rate >= 80 ? 'amber' : 'emerald';

  return (
    <Card className="p-4 rounded-xl border-border/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Lightning weight="duotone" className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold">AI Quota</span>
        </div>
        <Badge variant="outline" className="text-[9px]">{quota?.plan?.toUpperCase()}</Badge>
      </div>
      
      <div className="flex items-end justify-between mb-2">
        <div className="text-2xl font-black">{quota?.remaining || 0}</div>
        <div className="text-xs text-muted-foreground">{quota?.used}/{quota?.total}</div>
      </div>
      
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <motion.div initial={{width:0}} animate={{width:`${Math.min(rate,100)}%`}} className={`h-full bg-${color}-500 rounded-full`} />
      </div>
      
      {rate >= 80 && (
        <div className={`mt-2 flex items-center gap-1 text-${color}-500 text-xs`}>
          <Warning className="w-3 h-3" />
          {rate >= 95 ? 'โควตาใกล้หมด!' : 'ใช้ไปมากแล้ว'}
        </div>
      )}
    </Card>
  );
}
