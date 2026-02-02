'use client';

import { motion } from 'framer-motion';
import { 
  ClipboardList, 
  Clock, 
  User, 
  PlayCircle,
  Loader2
} from 'lucide-react';
import { useBeauticianTasks } from '@/hooks/useBeauticianTasks';
import { cn } from '@/lib/utils';

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
    <div className="glass-card p-8 rounded-[40px] border border-white/10 space-y-8 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
        <ClipboardList className="w-24 h-24 text-primary" />
      </div>

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white uppercase tracking-tight">Case Registry</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Daily Treatment Queue</p>
          </div>
        </div>
        <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-white uppercase tracking-widest">
          {tasks.length} Cases Pending
        </div>
      </div>

      <div className="space-y-4 relative z-10 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-white/5 rounded-3xl border border-white/5" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm italic font-light">
            No treatments scheduled for you yet.
          </div>
        ) : (
          tasks.map((task, idx) => {
            const customer = task.workflow_states?.customers;
            const customerName = customer?.full_name || 'Unknown Customer';
            const dueTime = task.due_date ? new Date(task.due_date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '--:--';
            
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-5 bg-white/5 rounded-3xl border border-white/5 hover:border-primary/30 transition-all group/item flex flex-col gap-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground group-hover/item:bg-primary/20 group-hover/item:text-primary transition-colors">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover/item:text-primary transition-colors">
                        {customerName}
                      </h4>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                        {task.title}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-white">{dueTime}</div>
                    <div className={cn(
                      "text-[9px] font-bold uppercase px-2 py-0.5 rounded-full inline-block mt-1",
                      task.priority === 'high' && 'bg-rose-500/20 text-rose-400',
                      task.priority === 'medium' && 'bg-amber-500/20 text-amber-400',
                      task.priority === 'low' && 'bg-emerald-500/20 text-emerald-400'
                    )}>
                      {task.priority} Priority
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse" />
                      {task.status}
                    </span>
                  </div>
                  <button 
                    onClick={() => onStartTreatment(task.id, task.workflow_id)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all"
                  >
                    <PlayCircle className="w-4 h-4" />
                    Begin Treatment
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <button 
        onClick={() => refetch()}
        className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] text-white hover:bg-white/10 transition-all active:scale-95"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            Refreshing...
          </span>
        ) : (
          'Refresh Schedule'
        )}
      </button>
    </div>
  );
}
