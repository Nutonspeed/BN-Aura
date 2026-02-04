'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  ClockCounterClockwise, 
  ChatCircle, 
  SpinnerGap,
  Stethoscope,
  CheckCircle,
  ClipboardText,
  Pulse,
  Lightning,
  Camera,
  ListChecks
} from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/client';
import TaskQueue from '@/components/beautician/TaskQueue';
import ProtocolInsights from '@/components/beautician/ProtocolInsights';
import ComparisonModal from '@/components/beautician/ComparisonModal';
import { cn } from '@/lib/utils';
import { useBeauticianTasks, useStartTreatment, useCompleteTreatment, useTaskRealtime } from '@/hooks/useBeauticianTasks';
import { toast } from 'sonner';

export default function BeauticianDashboard() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [staffName, setStaffName] = useState('');
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [activeCase, setActiveCase] = useState<{
    id: string;
    customer_id: string;
    treatment_name?: string;
    priority?: 'high' | 'normal' | 'low';
    customers?: { name: string };
  } | null>(null);
  const [throughput, setThroughput] = useState({ completed: 0, total: 0 });
  const [checklist, setChecklist] = useState<any[]>([]);

  const supabase = useMemo(() => createClient(), []);

  // Real-time task management hooks
  const { data: pendingTasks = [], isLoading: tasksLoading } = useBeauticianTasks('pending', 20);
  const startTreatment = useStartTreatment();
  const completeTreatment = useCompleteTreatment();
  
  // Setup real-time updates
  useTaskRealtime(userId || '');

  const fetchStaffData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        
        // Fetch real-time throughput and staff info
        const [staffRes, reportRes] = await Promise.all([
          supabase.from('clinic_staff').select('id, users:user_id(full_name)').eq('user_id', user.id).single(),
          fetch('/api/reports?type=beautician_overview').then(res => res.json())
        ]);
        
        if (staffRes.data?.users) {
          setStaffName((staffRes.data.users as any).full_name);
        }

        if (reportRes.success) {
          setThroughput({
            completed: reportRes.data.completedCases,
            total: reportRes.data.totalCases
          });
        }

        // Fetch active journey for this beautician
        const { data: journeys } = await supabase
          .from('customer_treatment_journeys')
          .select(`
            *,
            customers (
              full_name
            ),
            treatments (
              protocols
            )
          `)
          .or('journey_status.eq.treatment_planned,journey_status.eq.in_progress')
          .eq('assigned_beautician_id', user.id)
          .limit(1);
        
        if (journeys && journeys.length > 0) {
          const j = journeys[0];
          setActiveCase({
            id: j.id,
            customer_id: j.customer_id,
            treatment_name: (j.treatment_plan as any)?.treatment_name,
            priority: (j.metadata as any)?.priority || 'normal',
            customers: { name: (j.customers as any)?.full_name || 'Customer' }
          });

          // Initialize checklist from journey state or treatment protocols
          const existingChecklist = (j as any).treatment_checklist;
          if (Array.isArray(existingChecklist) && existingChecklist.length > 0) {
            setChecklist(existingChecklist);
          } else {
            const protocols = (j as any).treatments?.protocols;
            if (Array.isArray(protocols)) {
              setChecklist(protocols.map(p => ({ ...p, completed: false })));
            } else {
              setChecklist([]);
            }
          }
        } else {
          setActiveCase(null);
          setChecklist([]);
        }
      }
    } catch (err) {
      console.error('Beautician Dashboard Error:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const handleToggleChecklist = async (index: number) => {
    if (!activeCase) return;
    
    const newChecklist = [...checklist];
    newChecklist[index].completed = !newChecklist[index].completed;
    setChecklist(newChecklist);

    // Save to database
    try {
      await supabase
        .from('customer_treatment_journeys')
        .update({ treatment_checklist: newChecklist })
        .eq('id', activeCase.id);
    } catch (err) {
      console.error('Error saving checklist state:', err);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, [fetchStaffData]);

  const handleStartTreatment = async (taskId: string, workflowId: string) => {
    if (!userId) return;
    try {
      await startTreatment.mutateAsync({
        taskId,
        workflowId,
        beauticianId: userId
      });
      await fetchStaffData(); // Refresh dashboard state
    } catch (error) {
      console.error('Error starting treatment:', error);
    }
  };

  const handleCompleteTreatment = async (journeyId: string) => {
    // Find the task associated with this journey
    const task = pendingTasks.find(t => t.workflow_id === journeyId);
    if (!task) {
      toast.error('Task not found');
      return;
    }

    try {
      await completeTreatment.mutateAsync({
        taskId: task.id,
        workflowId: journeyId,
        notes: 'Treatment completed successfully according to protocol.'
      });
      await fetchStaffData(); // Refresh dashboard state
    } catch (error) {
      console.error('Error completing treatment:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <SpinnerGap className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse text-xs uppercase tracking-widest text-center">
          Syncing Protocol Node...
        </p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10 pb-20"
    >
      <ComparisonModal 
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        onSuccess={() => {}} // Could refresh insights if needed
        customerId={activeCase?.customer_id || ''}
      />

      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-[0.3em]"
          >
            <Stethoscope className="w-4 h-4" />
            Clinical Operations Node
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-white uppercase tracking-tight"
          >
            Systems <span className="text-primary text-glow">Active</span>, {staffName || 'Operator'}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            Delivering high-precision aesthetic treatments via cognitive protocols.
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex gap-3"
        >
          <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-6 backdrop-blur-md">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Shift Status</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                On Duty
              </span>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Throughput</span>
              <span className="text-xs font-bold text-white uppercase tabular-nums">{throughput.completed}/{throughput.total} Cases</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Task Queue */}
        <div className="lg:col-span-1">
          {userId && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <TaskQueue 
                staffId={userId} 
                onStartTreatment={handleStartTreatment}
              />
            </motion.div>
          )}
        </div>

        {/* Right: Protocol and Insights */}
        <div className="lg:col-span-2 space-y-8">
          {/* Case Context Header */}
          <AnimatePresence mode="wait">
            {activeCase ? (
              <motion.div 
                key="active-case"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass-premium p-8 rounded-[40px] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                  <Pulse className="w-32 h-32 text-primary" />
                </div>

                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20 shadow-premium">
                    <User className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                      {activeCase.customers?.name || 'Customer'}
                    </h3>
                    <div className="flex items-center gap-3">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest flex items-center gap-2">
                        Active Case: <span className="text-primary font-black">{activeCase.treatment_name || 'Protocol Registry'}</span>
                      </p>
                      <div className="w-1 h-1 rounded-full bg-white/20" />
                      <p className="text-[10px] text-muted-foreground font-light italic">ID: {activeCase.id.slice(0,8)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 relative z-10">
                  <span className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border",
                    activeCase.priority === 'high' 
                      ? "bg-rose-500/20 text-rose-400 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.2)]" 
                      : "bg-white/5 text-white border-white/10"
                  )}>
                    <Lightning className={cn("w-3 h-3", activeCase.priority === 'high' ? "animate-pulse" : "")} /> 
                    {activeCase.priority || 'Normal'} Priority
                  </span>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="no-case"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card p-16 rounded-[40px] border border-white/5 text-center flex flex-col items-center justify-center space-y-6"
              >
                <div className="w-20 h-20 rounded-[30px] bg-white/5 border border-white/5 flex items-center justify-center text-muted-foreground opacity-20 animate-float">
                  <ClockCounterClockwise className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-bold text-white/40 uppercase tracking-widest">Awaiting Case Assignment</h4>
                  <p className="text-xs text-muted-foreground italic font-light tracking-widest">Select a prioritized case from your registry node to begin treatment.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Clinical Protocols */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-8"
          >
            {activeCase && checklist.length > 0 && (
              <div className="glass-premium p-8 rounded-[40px] border border-primary/30 bg-primary/[0.02] space-y-8 relative overflow-hidden group">
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20 shadow-premium">
                      <ListChecks className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tight">Active <span className="text-primary">Checklist</span></h3>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Session Progress Tracking</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Completion</p>
                    <p className="text-xl font-black text-white">
                      {checklist.filter(c => c.completed).length}/{checklist.length}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                  {checklist.map((step, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleToggleChecklist(idx)}
                      className={cn(
                        "flex items-center gap-4 p-5 rounded-3xl border transition-all duration-300 text-left",
                        step.completed 
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                          : "bg-white/5 border-white/10 hover:border-white/20 text-white/60"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black border transition-all",
                        step.completed ? "bg-emerald-500 text-white border-emerald-400" : "bg-white/10 border-white/10"
                      )}>
                        {step.completed ? <CheckCircle className="w-4 h-4" /> : step.step}
                      </div>
                      <div className="flex-1">
                        <p className={cn(
                          "text-sm font-bold uppercase tracking-tight",
                          step.completed ? "line-through opacity-50" : ""
                        )}>{step.action}</p>
                        <p className="text-[10px] opacity-60 font-light italic line-clamp-1">{step.notes}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <ProtocolInsights 
              customerId={activeCase?.customer_id || ''} 
              journeyId={activeCase?.id}
            />
          </motion.div>

          {/* Quick Actions for Beautician */}
          <AnimatePresence>
            {activeCase && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <button 
                  onClick={() => handleCompleteTreatment(activeCase.id)}
                  className="p-8 glass-premium rounded-[40px] border border-white/5 hover:border-emerald-500/40 transition-all group text-center relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/[0.03] transition-colors" />
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mx-auto mb-4 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(16,185,129,0.1)] border border-emerald-500/20">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black text-white uppercase tracking-[0.25em] group-hover:text-emerald-400 transition-colors">Mark Session Complete</span>
                </button>

                <button 
                  onClick={() => setIsCompareModalOpen(true)}
                  className="p-8 glass-premium rounded-[40px] border border-white/5 hover:border-primary/40 transition-all group text-center relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/[0.03] transition-colors" />
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(var(--primary),0.1)] border border-primary/20">
                    <Camera className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black text-white uppercase tracking-[0.25em] group-hover:text-primary transition-colors">Compare Evolution</span>
                </button>

                <button className="p-8 glass-premium rounded-[40px] border border-white/5 hover:border-rose-500/40 transition-all group text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-rose-500/0 group-hover:bg-rose-500/[0.03] transition-colors" />
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-400 mx-auto mb-4 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(244,63,94,0.1)] border border-rose-500/20">
                    <ChatCircle className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black text-white uppercase tracking-[0.25em] group-hover:text-rose-400 transition-colors">Consult Sales Lead</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
