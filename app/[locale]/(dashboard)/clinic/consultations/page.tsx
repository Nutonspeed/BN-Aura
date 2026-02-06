'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  VideoCamera, 
  CalendarDots, 
  Plus, 
  ArrowSquareOut, 
  Clock, 
  User, 
  ArrowsClockwise, 
  CheckCircle, 
  X, 
  Phone, 
  EnvelopeSimple,
  MonitorPlay,
  CaretRight,
  IdentificationCard,
  Icon,
  Video
} from '@phosphor-icons/react';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { StatCard } from '@/components/ui/StatCard';
import { SpinnerGap } from '@phosphor-icons/react';

interface Consultation {
  id: string;
  room_id: string;
  room_url: string;
  status: string;
  scheduled_at: string;
  started_at?: string;
  ended_at?: string;
  notes?: string;
  customer?: { full_name: string; phone: string; email: string };
}

export default function ConsultationsPage() {
  const { goBack } = useBackNavigation();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ customerId: '', scheduledAt: '', notes: '' });
  const [customers, setCustomers] = useState<{ id: string; full_name: string }[]>([]);

  useEffect(() => { 
    fetchConsultations(); 
    fetchCustomers();
  }, []);

  const fetchConsultations = async () => {
    setLoading(true);
    try {
      const supabase = (await import('@/lib/supabase/client')).createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: staffData } = await supabase
        .from('clinic_staff').select('clinic_id')
        .eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();
      if (!staffData?.clinic_id) return;

      const { data } = await supabase
        .from('consultations')
        .select('*, customer:customers(full_name, phone, email)')
        .eq('clinic_id', staffData.clinic_id)
        .order('scheduled_at', { ascending: false });
      setConsultations(data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers?limit=100');
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (e) { console.error(e); }
  };

  const createConsultation = async () => {
    if (!formData.customerId || !formData.scheduledAt) return;
    await fetch('/api/consultations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: formData.customerId,
        scheduledAt: formData.scheduledAt,
        notes: formData.notes
      })
    });
    setShowModal(false);
    setFormData({ customerId: '', scheduledAt: '', notes: '' });
    fetchConsultations();
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch('/api/consultations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consultationId: id, status })
    });
    fetchConsultations();
  };

  const formatDateTime = (d: string) => new Date(d).toLocaleString('th-TH', { 
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
  });

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'scheduled': return <Badge variant="primary" size="sm" className="font-black text-[8px] tracking-widest px-2.5 py-1">SCHEDULED</Badge>;
      case 'waiting': return <Badge variant="warning" size="sm" className="font-black text-[8px] tracking-widest px-2.5 py-1">WAITING</Badge>;
      case 'in_progress': return <Badge variant="success" size="sm" className="font-black text-[8px] tracking-widest px-2.5 py-1 animate-pulse">LIVE_SYNC</Badge>;
      case 'completed': return <Badge variant="secondary" size="sm" className="font-black text-[8px] tracking-widest px-2.5 py-1">ARCHIVED</Badge>;
      case 'cancelled': return <Badge variant="destructive" size="sm" className="font-black text-[8px] tracking-widest px-2.5 py-1">ABORTED</Badge>;
      default: return <Badge variant="secondary" size="sm" className="font-black text-[8px] tracking-widest px-2.5 py-1">{s.toUpperCase()}</Badge>;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-20 font-sans"
    >
      <Breadcrumb />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]"
          >
            <VideoCamera weight="duotone" className="w-4 h-4" />
            Telemedicine Gateway Matrix
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-foreground tracking-tight uppercase"
          >
            Virtual <span className="text-primary">Consultations</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            Orchestrating remote clinical evaluations and real-time aesthetic guidance nodes.
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-3"
        >
          <Button 
            variant="outline" 
            onClick={fetchConsultations}
            disabled={loading}
            className="gap-2 px-6 py-6 rounded-2xl text-xs font-black uppercase tracking-widest border-border/50 hover:bg-secondary group"
          >
            <ArrowsClockwise weight="bold" className={cn("w-4 h-4", loading && "animate-spin")} />
            Sync sessions
          </Button>
          <Button 
            onClick={() => setShowModal(true)}
            className="gap-3 shadow-premium px-8 py-6 rounded-2xl text-xs font-black uppercase tracking-widest group"
          >
            <Plus weight="bold" className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Initialize node
          </Button>
        </motion.div>
      </div>

      {/* Metrics Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-2">
        <StatCard
          title="Scheduled Nodes"
          value={consultations.filter(c => c.status === 'scheduled' || c.status === 'waiting').length}
          icon={CalendarDots as any}
          className="p-4"
        />
        <StatCard
          title="Successful Sessions"
          value={consultations.filter(c => c.status === 'completed').length}
          icon={CheckCircle as any}
          iconColor="text-emerald-500"
          trend="up"
          change={15.2}
          className="p-4"
        />
        <StatCard
          title="Temporal Horizon"
          value={consultations.filter(c => new Date(c.scheduled_at).toDateString() === new Date().toDateString()).length}
          icon={Clock as any}
          iconColor="text-amber-500"
          className="p-4"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 px-2">
        {/* Active Registry Node */}
        <Card className="rounded-[48px] border-border/50 shadow-premium overflow-hidden group">
          <CardHeader className="p-8 md:p-10 border-b border-border/50 bg-secondary/30 relative">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
              <MonitorPlay weight="fill" className="w-64 h-64 text-primary" />
            </div>
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm shadow-inner group-hover:bg-primary/20 transition-all">
                  <Video weight="duotone" className="w-7 h-7" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black uppercase tracking-tight">Scheduled Nodes</CardTitle>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-1">Pending virtual synchronizations</p>
                </div>
              </div>
              <Badge variant="ghost" className="bg-primary/5 text-primary border-none font-black text-[10px] tracking-widest uppercase px-4 py-1.5 shadow-sm">
                {consultations.filter(c => c.status === 'scheduled' || c.status === 'waiting').length} ACTIVE_REGISTRY
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-8 md:p-10 relative z-10">
            {loading && !consultations.length ? (
              <div className="py-32 flex flex-col items-center justify-center gap-6 opacity-40">
                <SpinnerGap weight="bold" className="w-12 h-12 text-primary animate-spin" />
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Accessing Session Matrix...</p>
              </div>
            ) : consultations.filter(c => c.status === 'scheduled' || c.status === 'waiting').length === 0 ? (
              <div className="py-32 text-center opacity-30 flex flex-col items-center gap-6">
                <VideoCamera weight="duotone" className="w-20 h-20" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Registry Nominal</p>
              </div>
            ) : (
              <div className="space-y-6">
                {consultations.filter(c => c.status === 'scheduled' || c.status === 'waiting').map((c, i) => (
                  <motion.div 
                    key={c.id} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-secondary/20 rounded-[32px] border border-border/50 p-6 space-y-6 hover:border-primary/30 transition-all group/item shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-card border border-border/50 rounded-2xl flex items-center justify-center text-primary shadow-inner group-hover/item:bg-primary/5 transition-all">
                          <User weight="duotone" className="w-8 h-8" />
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-lg font-black text-foreground uppercase tracking-tight leading-tight group-hover/item:text-primary transition-colors">{c.customer?.full_name || 'ANONYMOUS_IDENTITY'}</p>
                          <div className="flex items-center gap-3">
                            {getStatusBadge(c.status)}
                            <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                              <Clock weight="bold" className="w-3.5 h-3.5" />
                              {formatDateTime(c.scheduled_at)}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <a
                          href={c.room_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 sm:flex-none"
                        >
                          <Button size="sm" className="w-full gap-2 shadow-premium rounded-xl text-[10px] font-black uppercase tracking-widest px-6 h-11">
                            <ArrowSquareOut weight="bold" className="w-4 h-4" />
                            Access Room
                          </Button>
                        </a>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(c.id, 'in_progress')}
                          className="h-11 px-6 rounded-xl border-border/50 text-primary hover:bg-primary/5 font-black text-[10px] uppercase tracking-widest"
                        >
                          Initialize
                        </Button>
                      </div>
                    </div>
                    {c.notes && (
                      <div className="p-4 bg-secondary/30 rounded-2xl border border-border/50 shadow-inner">
                        <p className="text-[11px] text-muted-foreground font-medium italic leading-relaxed">
                          Node Notes: {c.notes}
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Historical Matrix Node */}
        <Card className="rounded-[48px] border-border/50 shadow-premium overflow-hidden group">
          <CardHeader className="p-8 md:p-10 border-b border-border/50 bg-secondary/30 relative">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
              <CheckCircle weight="fill" className="w-64 h-64 text-emerald-500" />
            </div>
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-sm shadow-inner group-hover:bg-emerald-500/20 transition-all">
                  <History weight="duotone" className="w-7 h-7" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black uppercase tracking-tight">Archived Nodes</CardTitle>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-1">Historical session logs</p>
                </div>
              </div>
              <Badge variant="ghost" className="bg-secondary text-muted-foreground border-none font-black text-[10px] tracking-widest uppercase px-4 py-1.5 shadow-sm">
                {consultations.filter(c => c.status === 'completed' || c.status === 'cancelled').length} LOGGED
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-8 md:p-10 relative z-10">
            {consultations.filter(c => c.status === 'completed' || c.status === 'cancelled').length === 0 ? (
              <div className="py-32 text-center opacity-30 flex flex-col items-center gap-6">
                <Clock weight="duotone" className="w-20 h-20" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Registry Nominal</p>
              </div>
            ) : (
              <div className="space-y-4">
                {consultations.filter(c => c.status === 'completed' || c.status === 'cancelled').map((item, i) => (
                  <motion.div 
                    key={item.id} 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-5 bg-secondary/20 rounded-[28px] border border-border/50 flex items-center justify-between group/past hover:bg-secondary/40 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-5 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground group-hover/past:text-emerald-500 transition-colors shadow-inner">
                        <CheckCircle weight="duotone" className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-black text-foreground truncate uppercase tracking-tight">{item.customer?.full_name || 'IDENTITY_NODE'}</p>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60 mt-0.5">{formatDateTime(item.scheduled_at)}</p>
                      </div>
                    </div>
                    {getStatusBadge(item.status)}
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Initialize Room Modal Protocol */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card p-10 rounded-[40px] border border-border shadow-premium w-full max-w-lg relative overflow-hidden group"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                <VideoCamera weight="fill" className="w-64 h-64 text-primary" />
              </div>

              <div className="flex items-center justify-between mb-10 relative z-10">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm shadow-inner">
                    <VideoCamera weight="duotone" className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-foreground uppercase tracking-tight leading-tight">Initialize Room</h2>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Configure virtual diagnostic node</p>
                  </div>
                </div>
                <Button 
                  variant="ghost"
                  onClick={() => setShowModal(false)}
                  className="h-11 w-11 p-0 rounded-xl hover:bg-secondary transition-all"
                >
                  <X weight="bold" className="w-6 h-6" />
                </Button>
              </div>

              <div className="space-y-10 relative z-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Target Identity Node *</label>
                  <div className="relative group/select">
                    <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within/select:opacity-100 transition-opacity rounded-xl" />
                    <select
                      value={formData.customerId}
                      onChange={e => setFormData({ ...formData, customerId: e.target.value })}
                      className="w-full bg-secondary/30 border border-border rounded-2xl py-4 px-6 text-sm text-foreground focus:border-primary outline-none transition-all font-bold shadow-inner appearance-none relative z-10 uppercase tracking-tight"
                    >
                      <option value="" className="bg-card">SELECT_CLIENT_NODE</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id} className="bg-card">{c.full_name.toUpperCase()}</option>
                      ))}
                    </select>
                    <CaretRight weight="bold" className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 rotate-90 text-muted-foreground/40 pointer-events-none z-20" />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                    <CalendarDots weight="bold" className="w-3.5 h-3.5 text-primary/60" />
                    Temporal Alignment *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={e => setFormData({ ...formData, scheduledAt: e.target.value })}
                    className="w-full bg-secondary/30 border border-border rounded-2xl py-4 px-6 text-sm text-foreground focus:border-primary outline-none transition-all font-black tabular-nums shadow-inner relative z-10"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Protocol Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-secondary/30 border border-border rounded-[28px] py-4 px-6 text-sm text-foreground focus:border-primary outline-none transition-all font-medium placeholder:text-muted-foreground/40 resize-none italic shadow-inner relative z-10"
                    rows={4}
                    placeholder="Input clinical context nodes..."
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-border/30">
                  <Button 
                    onClick={createConsultation} 
                    disabled={!formData.customerId || !formData.scheduledAt}
                    className="w-full sm:flex-[2] py-7 rounded-[24px] font-black uppercase tracking-widest text-[11px] shadow-premium gap-3"
                  >
                    <CheckCircle weight="bold" className="w-5 h-5" />
                    Authorize Node
                  </Button>
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => setShowModal(false)}
                    className="w-full sm:flex-1 py-7 rounded-[24px] font-black uppercase tracking-widest text-[11px] border-border/50 hover:bg-secondary"
                  >
                    Abort
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
