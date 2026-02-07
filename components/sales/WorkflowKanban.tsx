/**
 * Sales Workflow Kanban Board
 * แสดง workflows ในรูปแบบ Kanban ตาม stage
 */

'use client';

import { 
  User,
  CalendarDots,
  CurrencyDollar,
  ChatCircle,
  Clock,
  CheckCircle,
  WarningCircle,
  ArrowRight,
  DotsThreeVertical,
  Briefcase,
  TrendUp,
  Funnel,
  Target,
  Sparkle,
  Pulse,
  IdentificationCard,
  CaretRight,
  ArrowsClockwise,
  X,
  Plus,
  Monitor,
  IdentificationBadge,
  SpinnerGap,
  Lightning,
  Icon
} from '@phosphor-icons/react';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useWorkflowEvents } from '@/hooks/useWorkflowEvents';
import { workflowBridge, WorkflowData } from '@/lib/workflow/workflowBridge';

const workflowStages = [
  { id: 'lead_created', label: 'Lead Entry', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { id: 'scanned', label: 'Diagnostic', color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  { id: 'proposal_sent', label: 'Quotation', color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  { id: 'payment_confirmed', label: 'Settlement', color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  { id: 'treatment_scheduled', label: 'Scheduling', color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
  { id: 'in_treatment', label: 'Execution', color: 'text-pink-500', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
  { id: 'treatment_completed', label: 'Operational', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' }
];

interface WorkflowCard {
  id: string;
  customer_id: string;
  customer_name?: string;
  current_stage: string;
  treatment_plan?: any;
  created_at: string;
  estimated_commission?: number;
}

export default function WorkflowKanban() {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<Record<string, WorkflowCard[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowCard | null>(null);
  
  const { events, broadcast } = useWorkflowEvents({
    onStageChange: (workflowId, oldStage, newStage) => {
      // Update local state when stage changes
      setWorkflows(prev => {
        const updated = { ...prev };
        
        // Move card between columns
        const oldStageCards = prev[oldStage] || [];
        const cardIndex = oldStageCards.findIndex(w => w.id === workflowId);
        
        if (cardIndex !== -1) {
          const [card] = oldStageCards.splice(cardIndex, 1);
          card.current_stage = newStage;
          
          if (!updated[newStage]) {
            updated[newStage] = [];
          }
          updated[newStage].push(card);
        }
        
        return updated;
      });
    },
    onCommissionEarned: (workflowId, amount) => {
      console.log(`Commission earned: ${amount} for workflow ${workflowId}`);
    }
  });

  // Calculate stats from workflows
  const stats = useMemo(() => {
    const allWorkflows = Object.values(workflows).flat();
    return {
      total: allWorkflows.length,
      volume: allWorkflows.reduce((sum, w) => sum + (w.estimated_commission || 0), 0),
      active: allWorkflows.filter(w => !['treatment_completed', 'cancelled'].includes(w.current_stage)).length,
      completed: allWorkflows.filter(w => w.current_stage === 'treatment_completed').length
    };
  }, [workflows]);

  // Load workflows
  useEffect(() => {
    if (!user?.id) return;

    const loadWorkflows = async () => {
      try {
        setLoading(true);
        
        // Use unified API to get sales workflows
        const response = await fetch('/api/workflow/unified?operation=list_by_sales&sales_id=' + user.id);
        const result = await response.json();
        
        if (result.success && result.data) {
          // Group by stage
          const grouped: Record<string, WorkflowCard[]> = {};
          
          workflowStages.forEach(stage => {
            grouped[stage.id] = [];
          });
          
          result.data.forEach((workflow: any) => {
            if (!grouped[workflow.current_stage]) {
              grouped[workflow.current_stage] = [];
            }
            
            grouped[workflow.current_stage].push({
              id: workflow.id,
              customer_id: workflow.customer_id,
              customer_name: workflow.metadata?.customer_name || 'Unknown',
              current_stage: workflow.current_stage,
              treatment_plan: workflow.treatment_plan,
              created_at: workflow.created_at,
              estimated_commission: workflow.estimated_commission
            });
          });
          
          setWorkflows(grouped);
        }
      } catch (error) {
        console.error('Failed to load workflows:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWorkflows();
  }, [user?.id]);

  // Handle stage transition
  const handleStageTransition = async (workflowId: string, newStage: string) => {
    try {
      await fetch('/api/workflow/unified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'transition',
          workflowId,
          data: { new_stage: newStage }
        })
      });
      
      // Broadcast the change
      await broadcast('workflow_stage_changed', workflowId, {
        old_stage: selectedWorkflow?.current_stage,
        new_stage: newStage,
        changed_by: user?.id
      });
      
      setSelectedWorkflow(null);
    } catch (error) {
      console.error('Failed to transition workflow:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-6">
        <SpinnerGap weight="bold" className="w-12 h-12 text-primary animate-spin" />
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] animate-pulse">Synchronizing Workflow Matrix...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-20 font-sans"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]"
          >
            <Pulse weight="duotone" className="w-4 h-4" />
            Operational Orchestration Node
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-foreground tracking-tight uppercase"
          >
            Workflow <span className="text-primary">Pipeline</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            Orchestrating end-to-end customer journeys and clinical transformation protocol cycles.
          </motion.p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" className="gap-2 px-6 py-6 rounded-2xl text-xs font-black uppercase tracking-widest border-border/50 hover:bg-secondary">
            <Funnel weight="bold" className="w-4 h-4" />
            Node Filter
          </Button>
          <Button className="gap-3 shadow-premium px-8 py-6 rounded-2xl text-xs font-black uppercase tracking-widest group">
            <Plus weight="bold" className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Initialize Workflow
          </Button>
        </div>
      </div>

      {/* Stats Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-2">
        <StatCard
          title="Consolidated Nodes"
          value={stats.total}
          icon={Briefcase as any}
          className="p-4"
        />
        <StatCard
          title="Yield Forecast"
          value={stats.volume}
          prefix="฿"
          icon={CurrencyDollar as any}
          iconColor="text-emerald-500"
          trend="up"
          change={12.4}
          className="p-4"
        />
        <StatCard
          title="Active Flux"
          value={stats.active}
          icon={Lightning as any}
          iconColor="text-amber-500"
          className="p-4"
        />
        <StatCard
          title="Success Quota"
          value={stats.completed}
          icon={CheckCircle as any}
          iconColor="text-primary"
          className="p-4"
        />
      </div>

      {/* Kanban Matrix */}
      <div className="flex gap-8 overflow-x-auto pb-10 no-scrollbar px-2 scroll-smooth">
        {workflowStages.map(stage => (
          <div key={stage.id} className="flex-shrink-0 w-80 flex flex-col gap-6">
            <div className={cn("rounded-[32px] p-6 border shadow-card transition-all relative overflow-hidden group", stage.bg, stage.border)}>
              <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                <Pulse weight="fill" className={cn("w-16 h-16", stage.color)} />
              </div>
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className={cn("w-2 h-2 rounded-full shadow-[0_0_10px_currentColor]", stage.color)} />
                  <h3 className={cn("text-xs font-black uppercase tracking-[0.2em]", stage.color)}>{stage.label}</h3>
                </div>
                <Badge variant="ghost" size="sm" className={cn("font-black border-none bg-white/10 text-[10px] px-3", stage.color)}>
                  {workflows[stage.id]?.length || 0}
                </Badge>
              </div>
            </div>
            
            <div className="flex-1 space-y-5 bg-secondary/20 border border-border/50 rounded-[40px] p-5 min-h-[600px] backdrop-blur-md relative group/column overflow-y-auto custom-scrollbar shadow-inner">
              <AnimatePresence mode="popLayout">
                {workflows[stage.id]?.map((workflow, idx) => (
                  <motion.div
                    key={workflow.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="bg-card p-6 rounded-[32px] border border-border/50 hover:border-primary/40 hover:shadow-premium transition-all cursor-pointer group/card relative overflow-hidden flex flex-col shadow-card"
                    onClick={() => setSelectedWorkflow(workflow)}
                  >
                    <div className="absolute top-0 right-0 p-6 opacity-0 group-hover/card:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-xl text-muted-foreground hover:text-primary border border-transparent hover:border-border/50 shadow-sm">
                        <DotsThreeVertical weight="bold" className="w-5 h-5" />
                      </Button>
                    </div>

                    <div className="flex items-start gap-5 mb-6 relative z-10">
                      <div className="w-14 h-14 rounded-2xl bg-secondary border border-border/50 flex items-center justify-center text-primary group-hover/card:bg-primary/10 group-hover/card:border-primary/20 transition-all duration-500 shadow-inner">
                        <span className="text-base font-black uppercase">{workflow.customer_name?.charAt(0) || 'U'}</span>
                      </div>
                      <div className="space-y-1.5 pr-8 min-w-0 flex-1">
                        <h4 className="text-base font-black text-foreground group-hover/card:text-primary transition-colors truncate uppercase tracking-tight leading-tight">
                          {workflow.customer_name}
                        </h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="ghost" size="sm" className="bg-primary/5 border-none text-primary font-mono text-[8px] px-2 py-0.5 tracking-widest uppercase">NODE-{workflow.id.slice(0, 4)}</Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-5 relative z-10">
                      {workflow.treatment_plan && (
                        <div className="p-4 bg-secondary/30 rounded-2xl border border-border/50 group-hover/card:border-primary/20 transition-all shadow-inner">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkle weight="bold" className="w-3 h-3 text-primary/60" />
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none">Active Protocol</p>
                          </div>
                          <p className="text-[11px] text-foreground/80 font-bold truncate leading-relaxed italic">
                            {workflow.treatment_plan.treatments?.[0] || 'No protocol defined'}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-5 border-t border-border/30">
                        <div className="flex items-center gap-2.5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                          <CalendarDots weight="duotone" className="w-4 h-4 opacity-60" />
                          {new Date(workflow.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                        {workflow.estimated_commission && (
                          <div className="flex flex-col items-end">
                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-0.5 opacity-60">Incentive</p>
                            <span className="text-xs font-black text-emerald-500 tabular-nums shadow-glow-sm">
                              ฿{workflow.estimated_commission.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {(!workflows[stage.id] || workflows[stage.id].length === 0) && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-32 space-y-6">
                  <div className="w-20 h-20 border-2 border-dashed border-border rounded-[32px] flex items-center justify-center shadow-inner">
                    <Plus weight="duotone" className="w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-[0.3em]">Nominal Node</p>
                    <p className="text-[9px] font-medium max-w-[160px] italic">Awaiting transmission</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Workflow Detail Modal Protocol */}
      <AnimatePresence>
        {selectedWorkflow && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedWorkflow(null)}
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-card border border-border rounded-[40px] overflow-hidden shadow-premium group p-10"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                <Briefcase className="w-64 h-64 text-primary" />
              </div>

              <div className="relative z-10 space-y-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm shadow-inner">
                      <IdentificationCard weight="duotone" className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-foreground tracking-tight uppercase leading-tight">{selectedWorkflow.customer_name}</h3>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Identity Node Alpha Registry</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedWorkflow(null)} className="h-10 w-10 p-0 rounded-xl hover:bg-secondary">
                    <X weight="bold" className="w-6 h-6" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-8">
                  <div className="p-6 bg-secondary/30 rounded-[32px] border border-border/50 shadow-inner">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 opacity-60">Operational Stage</p>
                    <Badge variant="ghost" className="bg-primary/10 text-primary border-none font-black text-[10px] uppercase tracking-[0.2em] px-4 py-2">
                      {workflowStages.find(s => s.id === selectedWorkflow.current_stage)?.label || 'UNDEFINED'}
                    </Badge>
                  </div>
                  
                  <div className="p-6 bg-secondary/30 rounded-[32px] border border-border/50 shadow-inner text-right">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 opacity-60">Yield Valuation</p>
                    <p className="text-2xl font-black text-emerald-500 tabular-nums tracking-tighter text-glow-sm">
                      ฿{selectedWorkflow.estimated_commission?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
                
                {selectedWorkflow.treatment_plan && (
                  <div className="p-8 bg-secondary/30 rounded-[32px] border border-border/50 space-y-6 shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.02]">
                      <Sparkle weight="fill" className="w-24 h-24 text-primary" />
                    </div>
                    <div className="flex items-center gap-3 relative z-10">
                      <Sparkle weight="duotone" className="w-5 h-5 text-primary" />
                      <h4 className="text-[10px] font-black text-foreground uppercase tracking-[0.3em]">Prescribed Protocol payload</h4>
                    </div>
                    <div className="flex flex-wrap gap-2.5 relative z-10">
                      {selectedWorkflow.treatment_plan.treatments?.map((t: string, i: number) => (
                        <Badge key={i} variant="secondary" className="font-black text-[9px] px-4 py-1.5 rounded-full border-border/50 uppercase tracking-widest">
                          {t}
                        </Badge>
                      )) || <p className="text-xs text-muted-foreground italic font-medium">No treatments identified in this clinical cycle.</p>}
                    </div>
                  </div>
                )}

                <div className="space-y-6 pt-4">
                  <div className="flex items-center justify-between px-2">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Protocol Transition Control</p>
                    <Badge variant="ghost" className="bg-primary/5 text-primary border-none font-black text-[8px] uppercase px-3 py-1">Linear Sequence</Badge>
                  </div>
                  <div className="flex flex-wrap gap-3 justify-center bg-secondary/20 p-6 rounded-[32px] border border-border/50 shadow-inner">
                    {workflowStages.map((stage, index) => {
                      const currentIndex = workflowStages.findIndex(s => s.id === selectedWorkflow.current_stage);
                      const isNext = index === currentIndex + 1;
                      const isCompleted = index < currentIndex;
                      const isCurrent = index === currentIndex;
                      
                      return (
                        <Button
                          key={stage.id}
                          disabled={!isNext}
                          onClick={() => handleStageTransition(selectedWorkflow.id, stage.id)}
                          variant={isNext ? 'default' : isCompleted ? 'ghost' : 'outline'}
                          className={cn(
                            "px-5 py-6 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all h-auto min-w-[100px]",
                            isCompleted && "text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 border-none opacity-60 shadow-none",
                            isCurrent && "border-primary text-primary bg-primary/10 shadow-glow-sm",
                            !isNext && !isCompleted && !isCurrent && "opacity-20 border-border/30 grayscale"
                          )}
                        >
                          {isCompleted ? <CheckCircle weight="bold" className="w-5 h-5" /> : stage.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <Button variant="outline" className="flex-1 py-6 rounded-[24px] text-[10px] font-black uppercase tracking-widest border-border/50 hover:bg-secondary">
                    View Case Node
                  </Button>
                  <Button className="flex-1 py-6 rounded-[24px] text-[10px] font-black uppercase tracking-widest shadow-premium">
                    Synchronize Ledger
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