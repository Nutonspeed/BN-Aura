'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  SpinnerGap,
  X,
  MonitorPlay
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
  called_at?: string;
  customer?: { full_name: string };
  appointment?: { time: string; service_name: string };
}

export default function QueuePage() {
  const { goBack } = useBackNavigation();
  const [queue, setQueue] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [clinicId, setClinicId] = useState<string>('');
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [checkinPhone, setCheckinPhone] = useState('');
  const [checkinProcessing, setCheckinProcessing] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    initQueue();
    return () => {
      // Cleanup realtime subscription
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (clinicId) {
      fetchQueue();
      subscribeRealtime();
      // Fallback polling every 30s (in case realtime hiccups)
      const interval = setInterval(fetchQueue, 30000);
      return () => {
        clearInterval(interval);
        if (channelRef.current) {
          channelRef.current.unsubscribe();
        }
      };
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

  const subscribeRealtime = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      
      // Subscribe to kiosk_checkins changes for this clinic
      const channel = supabase
        .channel(`queue:${clinicId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'kiosk_checkins',
            filter: `clinic_id=eq.${clinicId}`,
          },
          (payload: any) => {
            console.log('Queue realtime update:', payload.eventType);
            // Refetch on any change
            fetchQueue();
          }
        )
        .subscribe((status: string) => {
          setRealtimeConnected(status === 'SUBSCRIBED');
        });

      channelRef.current = channel;
    } catch (e) {
      console.warn('Realtime subscription failed, using polling:', e);
    }
  };

  const fetchQueue = async () => {
    if (!clinicId) return;
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
        called_at: d.called_at,
        customer: d.customer
      })));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const updateStatus = async (checkinId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/kiosk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkinId, status: newStatus })
      });
      if (res.ok) {
        // Realtime will trigger refresh, but also do immediate update
        fetchQueue();
      }
    } catch (e) { console.error(e); }
  };

  const manualCheckIn = async () => {
    if (!clinicId) return;
    setCheckinProcessing(true);
    try {
      const res = await fetch('/api/kiosk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId,
          method: checkinPhone ? 'phone' : 'walk_in',
          phone: checkinPhone || undefined
        })
      });
      if (res.ok) {
        setShowCheckinModal(false);
        setCheckinPhone('');
        fetchQueue();
      }
    } catch (e) { console.error(e); }
    setCheckinProcessing(false);
  };

  const formatTime = (d: string) => new Date(d).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

  const getWaitMinutes = (checkedInAt: string) => {
    const diff = Math.floor((Date.now() - new Date(checkedInAt).getTime()) / 60000);
    return diff;
  };

  const getMethodLabel = (m: string) => {
    const labels: Record<string, string> = {
      phone: 'เบอร์โทร', walk_in: 'Walk-in', appointment: 'นัดหมาย', qr_code: 'QR', membership: 'สมาชิก'
    };
    return labels[m] || m;
  };

  const waiting = queue.filter(q => q.status === 'waiting');
  const called = queue.filter(q => q.status === 'called');
  const serving = queue.filter(q => q.status === 'serving');

  const openDisplayPage = () => {
    if (clinicId) {
      window.open(`/th/kiosk/${clinicId}/display`, '_blank');
    }
  };

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
            {realtimeConnected && (
              <span className="flex items-center gap-1 text-emerald-500">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                LIVE
              </span>
            )}
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
            onClick={openDisplayPage}
            className="gap-2"
          >
            <MonitorPlay weight="bold" className="w-4 h-4" />
            Queue Display
          </Button>
          <Button 
            variant="outline" 
            onClick={fetchQueue}
            disabled={loading}
            className="gap-2"
          >
            <ArrowsClockwise weight="bold" className={cn("w-4 h-4", loading && "animate-spin")} />
            Sync
          </Button>
          <Button onClick={() => setShowCheckinModal(true)} className="gap-2 shadow-premium px-8">
            <Plus weight="bold" className="w-4 h-4" />
            Check-in Client
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Clients Waiting"
          value={waiting.length}
          icon={Clock}
          trend="neutral"
          iconColor="text-amber-500"
        />
        <StatCard
          title="Being Called"
          value={called.length}
          icon={Bell}
          trend="neutral"
          iconColor="text-primary"
        />
        <StatCard
          title="Now Serving"
          value={serving.length}
          icon={CheckCircle}
          trend="neutral"
          iconColor="text-emerald-500"
        />
        <StatCard
          title="Avg Wait"
          value={waiting.length > 0 ? Math.round(waiting.reduce((s, w) => s + getWaitMinutes(w.checked_in_at), 0) / waiting.length) : 0}
          suffix="min"
          icon={Clock}
          trend="neutral"
          iconColor="text-slate-400"
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
                Waiting ({waiting.length})
              </CardTitle>
              <Badge variant="warning" size="sm" className="font-bold">AWAITING</Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {loading && !queue.length ? (
              <div className="py-20 flex flex-col items-center gap-4">
                <SpinnerGap className="w-10 h-10 text-primary animate-spin" />
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Loading...</p>
              </div>
            ) : waiting.length === 0 ? (
              <div className="py-20 text-center opacity-30 flex flex-col items-center gap-4">
                <Users weight="duotone" className="w-12 h-12" />
                <p className="text-[10px] font-black uppercase tracking-widest">No Waiting Clients</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {waiting.map(item => (
                  <motion.div 
                    key={item.id} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-secondary/30 rounded-[24px] border border-border/50 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-amber-500/30 transition-all group/item"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex flex-col items-center justify-center group-hover/item:bg-amber-500/20 transition-all">
                        <span className="text-xl font-black text-amber-600 tabular-nums leading-none">{item.queue_number}</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-foreground tracking-tight">{item.customer?.full_name || item.phone_lookup || 'Walk-in'}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="ghost" size="sm" className="font-bold uppercase tracking-wider text-[9px]">{getMethodLabel(item.check_in_method)}</Badge>
                          <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
                            {getWaitMinutes(item.checked_in_at)}m ago
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => updateStatus(item.id, 'called')}
                      size="sm"
                      className="bg-primary text-white shadow-premium gap-2"
                    >
                      <Bell weight="bold" className="w-4 h-4" />
                      Call
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
                Called ({called.length})
              </CardTitle>
              <Badge variant="default" size="sm" className="font-bold">ACTIVE</Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {called.length === 0 ? (
              <div className="py-20 text-center opacity-30 flex flex-col items-center gap-4">
                <Bell weight="duotone" className="w-12 h-12" />
                <p className="text-[10px] font-black uppercase tracking-widest">No Active Calls</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {called.map(item => (
                  <motion.div 
                    key={item.id} 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-primary/5 rounded-[24px] border border-primary/20 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-primary/10 transition-all group/item"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-primary rounded-2xl flex flex-col items-center justify-center shadow-premium animate-pulse">
                        <span className="text-xl font-black text-white tabular-nums leading-none">{item.queue_number}</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-foreground tracking-tight">{item.customer?.full_name || item.phone_lookup || 'Walk-in'}</p>
                        <Badge variant="secondary" size="sm" className="font-bold uppercase tracking-wider text-[9px] bg-primary/10 text-primary border-none">{getMethodLabel(item.check_in_method)}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => updateStatus(item.id, 'serving')}
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white border-none gap-2 shadow-sm"
                      >
                        <CheckCircle weight="bold" className="w-4 h-4" />
                        Serve
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
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

      {/* Manual Check-in Modal */}
      <AnimatePresence>
        {showCheckinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCheckinModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-background rounded-3xl border border-border shadow-2xl max-w-md w-full p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Manual Check-in</h3>
                <button onClick={() => setShowCheckinModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Phone (optional)</label>
                  <input
                    type="tel"
                    value={checkinPhone}
                    onChange={e => setCheckinPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="0812345678"
                    className="w-full px-4 py-3 border border-border rounded-xl bg-secondary/30 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-lg tabular-nums"
                    maxLength={10}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCheckinModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={manualCheckIn}
                    disabled={checkinProcessing}
                    className="flex-1 gap-2"
                  >
                    {checkinProcessing ? (
                      <SpinnerGap className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus weight="bold" className="w-4 h-4" />
                    )}
                    {checkinProcessing ? 'Processing...' : 'Check In'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
