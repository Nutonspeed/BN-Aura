/**
 * Beautician Workflow Task Queue
 * แสดง tasks ที่มอบหมายให้ beautician พร้อม realtime updates
 */

'use client';

import { 
  Clock,
  User,
  CalendarDots,
  CheckCircle,
  Play,
  Pause,
  ChatCircle,
  WarningCircle,
  Scissors,
  Sparkle,
  Monitor,
  IdentificationBadge,
  Pulse,
  Briefcase,
  X,
  ArrowsClockwise,
  ArrowRight,
  DotsThreeVertical,
  IdentificationCard,
  MagnifyingGlass,
  Funnel,
  Info
} from '@phosphor-icons/react';
// Context not available - using inline defaults
const useSettingsContext = () => ({ tasks: [], refreshTasks: () => {} });
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/StatCard';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useWorkflowEvents } from '@/hooks/useWorkflowEvents';

interface TaskItem {
  id: string;
  workflow_id: string;
  customer_name: string;
  treatment_type: string;
  scheduled_time: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'paused';
  room_number?: string;
  notes?: string;
  estimated_duration: number;
}

export default function WorkflowTaskQueue() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'in_progress' | 'completed'>('all');
  
  const { events, broadcast } = useWorkflowEvents({
    onTreatmentScheduled: (workflowId, schedule) => {
      // Refresh tasks when new treatment is scheduled
      loadTasks();
    },
    onMessageReceived: (workflowId, message) => {
      // Show notification for new messages
      console.log('New message for workflow:', workflowId, message);
    }
  });

  // Load tasks for beautician
  const loadTasks = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Query workflow_states for treatments assigned to this beautician
      const supabase = createClient();
      const { data, error } = await supabase
        .from('workflow_states')
        .select(`
          id,
          customer_id,
          current_stage,
          treatment_plan,
          assigned_beautician_id,
          created_at,
          updated_at,
          metadata,
          customers!inner(
            full_name,
            phone
          )
        `)
        .eq('assigned_beautician_id', user.id)
        .in('current_stage', ['treatment_scheduled', 'in_treatment'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform to task items
      const taskItems: TaskItem[] = (data || []).map(workflow => ({
        id: workflow.id,
        workflow_id: workflow.id,
        customer_name: (workflow.customers as any)?.full_name || 'Unknown Customer',
        treatment_type: workflow.treatment_plan?.treatments?.[0] || 'General Treatment',
        scheduled_time: workflow.metadata?.scheduled_time || workflow.created_at,
        status: workflow.current_stage === 'in_treatment' ? 'in_progress' : 'scheduled',
        room_number: workflow.metadata?.room_number,
        notes: workflow.metadata?.notes,
        estimated_duration: workflow.treatment_plan?.duration || 60
      }));

      setTasks(taskItems);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [user?.id]);

  // Update task status
  const updateTaskStatus = async (taskId: string, newStatus: TaskItem['status']) => {
    try {
      const supabase = createClient();
      
      // Update workflow stage
      const { error } = await supabase
        .from('workflow_states')
        .update({
          current_stage: newStatus === 'in_progress' ? 'in_treatment' : 
                        newStatus === 'completed' ? 'treatment_completed' : 
                        'treatment_scheduled',
          updated_at: new Date().toISOString(),
          metadata: {
            ...selectedTask,
            status: newStatus,
            last_updated_by: user?.id
          }
        })
        .eq('id', taskId);

      if (error) throw error;

      // Broadcast the update
      await broadcast('task_status_updated', taskId, {
        old_status: selectedTask?.status,
        newStatus,
        updated_by: user?.id,
        timestamp: new Date().toISOString()
      });

      // Update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
      
      setSelectedTask(null);
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  // Filter tasks
  const filteredTasks = filter === 'all' 
    ? tasks 
    : tasks.filter(task => task.status === filter);

  // Get status color
  const getStatusColor = (status: TaskItem['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'in_progress': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'paused': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10 pb-20 font-sans"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]"
          >
            <Scissors weight="duotone" className="w-4 h-4" />
            Clinical Task Queue
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-foreground tracking-tight uppercase"
          >
            Treatment <span className="text-primary">Registry</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            Orchestrating your scheduled clinical sessions and active treatment protocols.
          </motion.p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={loadTasks}
            disabled={loading}
            className="gap-2 px-6 py-6 rounded-2xl text-xs font-black uppercase tracking-widest border-border/50 hover:bg-secondary group"
          >
            <ArrowsClockwise weight="bold" className={cn("w-4 h-4", loading && "animate-spin")} />
            Sync Queue
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-2">
        <StatCard
          title="Total Payload"
          value={tasks.length}
          icon={Briefcase}
          className="p-4"
        />
        <StatCard
          title="Scheduled Nodes"
          value={tasks.filter(t => t.status === 'scheduled').length}
          icon={CalendarDots}
          iconColor="text-blue-500"
          className="p-4"
        />
        <StatCard
          title="Active Cycles"
          value={tasks.filter(t => t.status === 'in_progress').length}
          icon={Pulse}
          iconColor="text-orange-500"
          className="p-4"
        />
        <StatCard
          title="Completed Nodes"
          value={tasks.filter(t => t.status === 'completed').length}
          icon={CheckCircle}
          iconColor="text-emerald-500"
          className="p-4"
        />
      </div>

      {/* Filter and Content Area */}
      <div className="space-y-8 px-2">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex bg-secondary/50 border border-border p-1.5 rounded-[24px] w-fit shadow-inner">
            {[
              { id: 'all', label: 'All Tasks', icon: Monitor },
              { id: 'scheduled', label: 'Scheduled', icon: CalendarDots },
              { id: 'in_progress', label: 'Active', icon: Pulse },
              { id: 'completed', label: 'Completed', icon: CheckCircle }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={cn(
                  "flex items-center gap-3 px-8 py-3 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest border whitespace-nowrap",
                  filter === tab.id
                    ? "bg-primary text-primary-foreground border-primary shadow-premium"
                    : "bg-transparent text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground"
                )}
              >
                <tab.icon weight={filter === tab.id ? "fill" : "bold"} className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative group w-full sm:w-72">
            <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-xl" />
            <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Query identity node..." 
              className="w-full bg-secondary/50 border border-border/50 rounded-2xl py-3 pl-11 pr-4 text-[10px] font-black uppercase tracking-widest text-foreground focus:outline-none focus:border-primary transition-all shadow-inner relative z-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredTasks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-32 flex flex-col items-center justify-center gap-6 opacity-20"
              >
                <div className="w-24 h-24 rounded-[48px] bg-secondary flex items-center justify-center text-muted-foreground shadow-inner">
                  <Monitor weight="duotone" className="w-12 h-12" />
                </div>
                <p className="text-sm font-black uppercase tracking-[0.3em]">Zero protocol nodes detected in registry.</p>
              </motion.div>
            ) : (
              filteredTasks.map((task, idx) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="rounded-[40px] border-border/50 hover:border-primary/30 transition-all group overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                      <IdentificationBadge className="w-64 h-64 text-primary" />
                    </div>

                    <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                      <div className="flex items-center gap-6">
                        <div className={cn(
                          "w-16 h-16 rounded-3xl flex items-center justify-center border transition-all duration-500 shadow-inner",
                          task.status === 'in_progress' ? "bg-primary/10 border-primary/20 text-primary animate-pulse" : "bg-secondary/50 border-border/50 text-muted-foreground"
                        )}>
                          <User weight="duotone" className="w-8 h-8" />
                        </div>
                        <div className="space-y-1.5 min-w-0">
                          <h4 className="text-xl font-black text-foreground group-hover:text-primary transition-colors uppercase tracking-tight truncate">{task.customer_name}</h4>
                          <div className="flex flex-wrap items-center gap-3">
                            <Badge variant="ghost" className={cn("border-none font-black text-[8px] uppercase tracking-widest px-3 py-1", getStatusColor(task.status))}>
                              {task.status.replace('_', ' ')}
                            </Badge>
                            {task.room_number && (
                              <Badge variant="ghost" className="bg-secondary text-muted-foreground border-none font-black text-[8px] uppercase px-3 py-1">Room {task.room_number}</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:flex items-center gap-8 md:gap-12">
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Protocol Type</p>
                          <div className="flex items-center gap-2">
                            <Scissors weight="bold" className="w-3.5 h-3.5 text-primary/60" />
                            <span className="text-sm font-bold text-foreground truncate max-w-[120px] uppercase">{task.treatment_type}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Temporal Cycle</p>
                          <div className="flex items-center gap-2">
                            <Clock weight="bold" className="w-3.5 h-3.5 text-primary/60" />
                            <span className="text-sm font-bold text-foreground tabular-nums uppercase">{new Date(task.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 col-span-2 sm:col-span-1 sm:ml-4">
                          {task.status === 'scheduled' && (
                            <Button 
                              onClick={() => { setSelectedTask(task); updateTaskStatus(task.id, 'in_progress'); }}
                              className="px-6 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-premium gap-2 hover:scale-105 transition-all"
                            >
                              <Play weight="bold" className="w-3.5 h-3.5" />
                              Initialize
                            </Button>
                          )}
                          
                          {task.status === 'in_progress' && (
                            <div className="flex gap-2">
                              <Button 
                                variant="outline"
                                onClick={() => updateTaskStatus(task.id, 'paused')}
                                className="h-12 w-12 p-0 rounded-2xl border-border/50 hover:bg-orange-500/10 hover:text-orange-500 hover:border-orange-500/20"
                              >
                                <Pause weight="bold" className="w-4 h-4" />
                              </Button>
                              <Button 
                                onClick={() => { setSelectedTask(task); updateTaskStatus(task.id, 'completed'); }}
                                className="px-6 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-premium gap-2 hover:scale-105 transition-all text-[9px] font-black uppercase tracking-widest"
                              >
                                <CheckCircle weight="bold" className="w-3.5 h-3.5" />
                                Finalize
                              </Button>
                            </div>
                          )}
                          
                          <Button 
                            variant="outline"
                            onClick={() => setSelectedTask(task)}
                            className="h-12 w-12 p-0 rounded-2xl border-border/50 hover:bg-secondary"
                          >
                            <ChatCircle weight="bold" className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Task Detail Modal - Premiumized */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedTask(null)}
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-card border border-border rounded-[40px] overflow-hidden shadow-premium group p-10"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                <Briefcase className="w-64 h-64 text-primary" />
              </div>

              <div className="relative z-10 space-y-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                      <IdentificationCard weight="duotone" className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground tracking-tight uppercase">{selectedTask.customer_name}</h3>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Identity node active</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedTask(null)} className="h-10 w-10 p-0 rounded-xl hover:bg-secondary">
                    <X weight="bold" className="w-5 h-5" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="p-5 bg-secondary/30 rounded-3xl border border-border/50">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Protocol node</p>
                    <p className="text-sm font-bold text-foreground uppercase truncate">{selectedTask.treatment_type}</p>
                  </div>
                  <div className="p-5 bg-secondary/30 rounded-3xl border border-border/50">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Cycle Duration</p>
                    <p className="text-sm font-bold text-foreground tabular-nums uppercase">{selectedTask.estimated_duration} MINS</p>
                  </div>
                </div>

                {selectedTask.notes && (
                  <div className="p-6 bg-secondary/30 rounded-3xl border border-border/50 space-y-3">
                    <div className="flex items-center gap-3">
                      <Info weight="duotone" className="w-5 h-5 text-primary" />
                      <h4 className="text-[10px] font-black text-foreground uppercase tracking-widest">Protocol Directives</h4>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium italic leading-relaxed">
                      {selectedTask.notes}
                    </p>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedTask(null)}
                    className="flex-1 py-6 rounded-[24px] text-[10px] font-black uppercase tracking-widest border-border/50 hover:bg-secondary"
                  >
                    Abort Review
                  </Button>
                  {selectedTask.status === 'scheduled' && (
                    <Button
                      onClick={() => { updateTaskStatus(selectedTask.id, 'in_progress'); setSelectedTask(null); }}
                      className="flex-[2] py-6 rounded-[24px] text-[10px] font-black uppercase tracking-widest shadow-premium gap-3"
                    >
                      <Play weight="bold" className="w-4 h-4" />
                      Initialize Protocol
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}