'use client';

import { 
  ClipboardText,
  Clock,
  User,
  PlayCircle,
  SpinnerGap,
  Lightning,
  CheckCircle,
  ClockCounterClockwise,
  ArrowRight
} from '@phosphor-icons/react';
import { useBeauticianTasks } from '@/hooks/useBeauticianTasks';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export default function TaskQueue({ 
  staffId, 
  onStartTreatment 
}: { 
  staffId: string;
  onStartTreatment: (taskId: string, workflowId: string) => Promise<void>;
}) {
  // Fetch real-time tasks from API
  const { data: tasks = [], isLoading: loading, refetch } = useBeauticianTasks('pending', 20);

  return (
    <Card className="rounded-[40px] border-border/50 shadow-premium overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
        <ClipboardText className="w-64 h-64 text-primary" />
      </div>

      <CardHeader className="p-8 border-b border-border/50 bg-secondary/30 flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
            <Clock weight="duotone" className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-xl font-black uppercase tracking-tight">Case Registry</CardTitle>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black mt-0.5">Daily Treatment Queue</p>
          </div>
        </div>
        <Badge variant="ghost" className="bg-primary/5 text-primary border-none font-black text-[10px] tracking-widest uppercase px-4 py-1.5 shadow-sm">
          {tasks.length} Nodes Pending
        </Badge>
      </CardHeader>

      <CardContent className="p-8 relative z-10 space-y-6">
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {loading ? (
              <div className="space-y-4 py-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-28 bg-secondary/20 rounded-[32px] animate-pulse border border-border/50" />
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <div className="py-24 text-center opacity-20 flex flex-col items-center gap-6">
                <div className="w-20 h-20 rounded-[40px] bg-secondary flex items-center justify-center text-muted-foreground">
                  <ClockCounterClockwise weight="duotone" className="w-10 h-10" />
                </div>
                <p className="text-sm font-black uppercase tracking-[0.3em]">Zero treatments in queue node.</p>
              </div>
            ) : (
              tasks.map((task, idx) => {
                const customer = task.workflow_states?.customers;
                const customerName = customer?.full_name || 'Unknown Identity';
                const dueTime = task.due_date ? new Date(task.due_date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '--:--';
                
                return (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className="p-6 bg-secondary/30 rounded-[32px] border border-border/50 hover:border-primary/30 transition-all group/item flex flex-col gap-5 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center text-muted-foreground group-hover/item:bg-primary/10 group-hover/item:text-primary transition-all duration-500 shadow-inner">
                          <User weight="duotone" className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-base font-bold text-foreground group-hover/item:text-primary transition-colors truncate tracking-tight uppercase">
                            {customerName}
                          </h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="ghost" className="bg-primary/5 text-primary border-none font-mono text-[8px] px-2 tracking-widest uppercase">NODE-{task.id.slice(0,4)}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-foreground tabular-nums tracking-widest">{dueTime}</p>
                        <Badge 
                          variant={task.priority === 'high' ? 'destructive' : 'default'} 
                          size="sm"
                          className="font-black uppercase text-[7px] tracking-widest mt-1.5 px-2"
                        >
                          {task.priority} Priority
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-3 relative z-10">
                      <div className="p-3 bg-card/50 rounded-2xl border border-border/50">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Target Protocol</p>
                        <p className="text-xs font-bold text-foreground/80 truncate uppercase">{task.title}</p>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-border/30">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-pulse" />
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{task.status}</span>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => onStartTreatment(task.id, task.workflow_id)}
                          className="px-5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-premium gap-2 hover:scale-105 transition-all"
                        >
                          <PlayCircle weight="bold" className="w-4 h-4" />
                          Initialize Node
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}