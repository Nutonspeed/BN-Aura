'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users,
  Bell,
  CheckCircle,
  Clock,
  Phone,
  ArrowsClockwise,
  ArrowLeft,
  User,
  CaretRight,
  MagnifyingGlass,
  Plus,
  Queue,
  WarningCircle,
  SpinnerGap
} from '@phosphor-icons/react';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { cn } from '@/lib/utils';

interface CheckIn {
  id: string;
  queue_number: number;
  status: string;
  check_in_method: string;
  phone_lookup?: string;
  checked_in_at: string;
  customer?: { full_name: string };
  appointment?: { time: string; service_name: string };
}

export default function QueuePage() {
  const { goBack } = useBackNavigation();
  const [queue, setQueue] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [clinicId, setClinicId] = useState<string>('');

  useEffect(() => {
    initQueue();
  }, []);

  useEffect(() => {
    if (clinicId) {
      fetchQueue();
      const interval = setInterval(fetchQueue, 10000);
      return () => clearInterval(interval);
    }
  }, [clinicId]);

  const initQueue = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: staffData } = await supabase
        .from('clinic_staff')
        .select('clinic_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (staffData) setClinicId(staffData.clinic_id);
    } catch (e) { console.error(e); }
  };

  const fetchQueue = async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from('kiosk_checkins')
        .select('*, customer:customers(full_name)')
        .eq('clinic_id', clinicId)
        .gte('checked_in_at', today.toISOString())
        .in('status', ['waiting', 'called', 'serving'])
        .order('queue_number', { ascending: true });

      setQueue((data || []).map((d: any) => ({
        id: d.id,
        queue_number: d.queue_number || 0,
        status: d.status,
        check_in_method: d.check_in_method || 'walk_in',
        phone_lookup: d.phone_lookup,
        checked_in_at: d.checked_in_at,
        customer: d.customer
      })));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const updateStatus = async (checkinId: string, newStatus: string) => {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const updateData: Record<string, any> = { status: newStatus };
      if (newStatus === 'called') updateData.called_at = new Date().toISOString();
      if (newStatus === 'serving') updateData.served_at = new Date().toISOString();

      await supabase.from('kiosk_checkins').update(updateData).eq('id', checkinId);
      fetchQueue();
    } catch (e) { console.error(e); }
  };

  const formatTime = (d: string) => new Date(d).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

  const getMethodLabel = (m: string) => {
    const labels: Record<string, string> = {
      phone: 'เบอร์โทร', walk_in: 'Walk-in', appointment: 'นัดหมาย', qr_code: 'QR', membership: 'สมาชิก'
    };
    return labels[m] || m;
  };

  const waiting = queue.filter(q => q.status === 'waiting');
  const called = queue.filter(q => q.status === 'called');

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-20 font-sans"
    >
      <Breadcrumb />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]"
          >
            <Queue weight="duotone" className="w-4 h-4" />
            Live Operations Node
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-foreground tracking-tight"
          >
            Queue <span className="text-primary">Management</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            Real-time synchronization of client arrival and practitioner assignment.
          </motion.p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={fetchQueue}
            disabled={loading}
            className="gap-2"
          >
            <ArrowsClockwise weight="bold" className={cn("w-4 h-4", loading && "animate-spin")} />
            Sync Queue
          </Button>
          <Button className="gap-2 shadow-premium px-8">
            <Plus weight="bold" className="w-4 h-4" />
            Check-in Client
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Clients Waiting"
          value={waiting.length}
          icon={Clock}
          trend="neutral"
          iconColor="text-amber-500"
        />
        <StatCard
          title="Currently Serving"
          value={called.length}
          icon={Bell}
          trend="neutral"
          iconColor="text-primary"
        />
        <StatCard
          title="Next Queue ID"
          value={waiting[0]?.queue_number || 0}
          prefix={waiting[0] ? "#" : "None"}
          icon={CheckCircle}
          trend="neutral"
          iconColor="text-emerald-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Waiting List */}
        <Card className="relative overflow-hidden group border-border/50">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
            <Clock className="w-48 h-48 text-amber-500" />
          </div>

          <CardHeader className="border-b border-border/50 pb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3">
                <Clock weight="duotone" className="w-5 h-5 text-amber-500" />
                Waiting Nodes ({waiting.length})
              </CardTitle>
              <Badge variant="warning" size="sm" className="font-bold">AWAITING ACTION</Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {loading && !queue.length ? (
              <div className="py-20 flex flex-col items-center gap-4">
                <SpinnerGap className="w-10 h-10 text-primary animate-spin" />
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Accessing Queue Node...</p>
              </div>
            ) : waiting.length === 0 ? (
              <div className="py-20 text-center opacity-30 flex flex-col items-center gap-4">
                <Users weight="duotone" className="w-12 h-12" />
                <p className="text-[10px] font-black uppercase tracking-widest">Registry Empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {waiting.map(item => (
                  <motion.div 
                    key={item.id} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-secondary/30 rounded-[24px] border border-border/50 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:border-amber-500/30 transition-all group/item"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex flex-col items-center justify-center shadow-sm group-hover/item:bg-amber-500/20 transition-all">
                        <span className="text-2xl font-black text-amber-600 tabular-nums leading-none">{item.queue_number}</span>
                        <span className="text-[8px] font-black text-amber-600/60 uppercase tracking-widest mt-1">Node</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-base font-bold text-foreground tracking-tight">{item.customer?.full_name || item.phone_lookup || 'Registered Client'}</p>
                        <div className="flex items-center gap-3">
                          <Badge variant="ghost" size="sm" className="font-bold uppercase tracking-wider text-[9px]">{getMethodLabel(item.check_in_method)}</Badge>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            <Clock weight="bold" className="w-3 h-3" />
                            {formatTime(item.checked_in_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => updateStatus(item.id, 'called')}
                      className="bg-primary text-white shadow-premium gap-2 px-6"
                    >
                      <Bell weight="bold" className="w-4 h-4" />
                      Initiate Call
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Called List */}
        <Card className="relative overflow-hidden group border-border/50">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
            <Bell className="w-48 h-48 text-primary" />
          </div>

          <CardHeader className="border-b border-border/50 pb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3">
                <Bell weight="duotone" className="w-5 h-5 text-primary" />
                Active Call Nodes ({called.length})
              </CardTitle>
              <Badge variant="default" size="sm" className="font-bold">IN TRANSIT</Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {called.length === 0 ? (
              <div className="py-20 text-center opacity-30 flex flex-col items-center gap-4">
                <Bell weight="duotone" className="w-12 h-12" />
                <p className="text-[10px] font-black uppercase tracking-widest">Zero Active Calls</p>
              </div>
            ) : (
              <div className="space-y-4">
                {called.map(item => (
                  <motion.div 
                    key={item.id} 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-primary/5 rounded-[24px] border border-primary/20 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-primary/10 transition-all group/item"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 bg-primary rounded-2xl flex flex-col items-center justify-center shadow-premium animate-pulse">
                        <span className="text-2xl font-black text-white tabular-nums leading-none">{item.queue_number}</span>
                        <span className="text-[8px] font-black text-white/60 uppercase tracking-widest mt-1">Calling</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-base font-bold text-foreground tracking-tight">{item.customer?.full_name || item.phone_lookup || 'Registered Client'}</p>
                        <Badge variant="secondary" size="sm" className="font-bold uppercase tracking-wider text-[9px] bg-primary/10 text-primary border-none">{getMethodLabel(item.check_in_method)}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => updateStatus(item.id, 'serving')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white border-none gap-2 shadow-sm"
                      >
                        <CheckCircle weight="bold" className="w-4 h-4" />
                        Acknowledge
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => updateStatus(item.id, 'no_show')}
                        className="text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                      >
                        No Show
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
