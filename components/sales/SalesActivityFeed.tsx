'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus,
  ShoppingBag,
  ChatCircle,
  Sparkle,
  CalendarDots,
  TrendUp,
  CurrencyDollar,
  Clock,
  ArrowRight,
  SpinnerGap
} from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface Activity {
  id: string;
  type: 'new_customer' | 'purchase' | 'chat' | 'skin_analysis' | 'appointment' | 'commission' | 'conversion';
  title: string;
  description: string;
  timestamp: string;
  amount?: number;
  customerName?: string;
  metadata?: any;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'เมื่อสักครู่';
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ชม.ที่แล้ว`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} วันที่แล้ว`;
  return new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
}

const activityConfig: Record<string, { icon: any; color: string; bg: string }> = {
  new_customer: { icon: UserPlus, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  purchase: { icon: ShoppingBag, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  chat: { icon: ChatCircle, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  skin_analysis: { icon: Sparkle, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  appointment: { icon: CalendarDots, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  commission: { icon: CurrencyDollar, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  conversion: { icon: TrendUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
};

export default function SalesActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const allActivities: Activity[] = [];

      // Fetch recent customers
      const { data: customers } = await supabase
        .from('customers')
        .select('id, full_name, created_at, status')
        .eq('assigned_sales_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      (customers || []).forEach(c => {
        allActivities.push({
          id: `cust-${c.id}`,
          type: 'new_customer',
          title: 'ลูกค้าใหม่',
          description: c.full_name || 'ไม่ระบุชื่อ',
          timestamp: c.created_at,
          customerName: c.full_name,
        });

        if (c.status === 'converted') {
          allActivities.push({
            id: `conv-${c.id}`,
            type: 'conversion',
            title: 'แปลงลูกค้าสำเร็จ',
            description: `${c.full_name} เปลี่ยนสถานะเป็นลูกค้า`,
            timestamp: c.created_at,
            customerName: c.full_name,
          });
        }
      });

      // Fetch recent transactions
      const customerIds = (customers || []).map(c => c.id);
      if (customerIds.length > 0) {
        const { data: transactions } = await supabase
          .from('pos_transactions')
          .select('id, total_amount, created_at, customer_id, customers(full_name)')
          .in('customer_id', customerIds)
          .order('created_at', { ascending: false })
          .limit(5);

        (transactions || []).forEach((t: any) => {
          allActivities.push({
            id: `tx-${t.id}`,
            type: 'purchase',
            title: 'การซื้อใหม่',
            description: `${t.customers?.full_name || 'ลูกค้า'} ซื้อสินค้า`,
            timestamp: t.created_at,
            amount: parseFloat(t.total_amount || '0'),
            customerName: t.customers?.full_name,
          });
        });
      }

      // Fetch recent commissions
      const { data: commissions } = await supabase
        .from('sales_commissions')
        .select('id, amount, created_at, status')
        .eq('sales_staff_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      (commissions || []).forEach(c => {
        allActivities.push({
          id: `comm-${c.id}`,
          type: 'commission',
          title: 'ค่าคอมมิชชัน',
          description: `ได้รับค่าคอมมิชชัน ฿${parseFloat(c.amount || '0').toLocaleString()}`,
          timestamp: c.created_at,
          amount: parseFloat(c.amount || '0'),
        });
      });

      // Fetch recent skin analyses
      const { data: analyses } = await supabase
        .from('skin_analyses')
        .select('id, created_at, customer_id, customers(full_name)')
        .eq('sales_staff_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      (analyses || []).forEach((a: any) => {
        allActivities.push({
          id: `scan-${a.id}`,
          type: 'skin_analysis',
          title: 'AI สแกนผิว',
          description: `สแกนผิวให้ ${a.customers?.full_name || 'ลูกค้า'}`,
          timestamp: a.created_at,
          customerName: a.customers?.full_name,
        });
      });

      // Sort by timestamp descending
      allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(allActivities.slice(0, 10));
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <SpinnerGap className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">ยังไม่มีกิจกรรมล่าสุด</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {activities.map((activity, idx) => {
        const config = activityConfig[activity.type] || activityConfig.new_customer;
        const Icon = config.icon;

        return (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="flex items-start gap-3 p-3 rounded-xl hover:bg-secondary/30 transition-colors group"
          >
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', config.bg)}>
              <Icon weight="duotone" className={cn('w-4 h-4', config.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground truncate">{activity.title}</p>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{timeAgo(activity.timestamp)}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
              {activity.amount != null && activity.amount > 0 && (
                <Badge className="mt-1 bg-emerald-500/10 text-emerald-500 text-[10px]">
                  ฿{activity.amount.toLocaleString()}
                </Badge>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
