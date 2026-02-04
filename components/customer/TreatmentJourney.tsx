'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Pulse, 
  CheckCircle, 
  Circle, 
  CalendarDots, 
  Sparkle,
  ArrowRight
} from '@phosphor-icons/react';

import { createClient } from '@/lib/supabase/client';

interface JourneyStep {
  id: string;
  status: 'consultation' | 'treatment_planned' | 'in_progress' | 'completed' | 'follow_up';
  date: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

export default function TreatmentJourney({ customerId }: { customerId: string }) {
  const [journey, setJourney] = useState<JourneyStep[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchJourney() {
      if (!customerId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('customer_treatment_journeys')
          .select('*')
          .eq('customer_id', customerId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          const steps: JourneyStep[] = data.map((item, index) => {
            const isLast = index === data.length - 1;
            const isCompleted = ['completed', 'follow_up', 'closed'].includes(item.journey_status);
            const isCurrent = !isCompleted && (item.journey_status === 'in_progress' || (isLast && item.journey_status === 'consultation'));
            
            let title = 'Skin Analysis';
            let description = 'Initial skin diagnostic and consultation.';
            
            if (item.journey_status === 'treatment_planned') {
              title = item.treatment_name || 'Treatment Planned';
              description = 'Custom protocol developed by aesthetic advisor.';
            } else if (item.journey_status === 'in_progress') {
              title = item.treatment_name || 'Treatment Active';
              description = 'Clinical procedures currently being performed.';
            } else if (item.journey_status === 'completed') {
              title = 'Treatment Cycle Complete';
              description = 'Successful execution of planned aesthetic protocol.';
            } else if (item.journey_status === 'follow_up') {
              title = 'Post-Treatment Follow-up';
              description = 'Progress monitoring and home-care optimization.';
            }

            return {
              id: item.id,
              status: item.journey_status as JourneyStep['status'],
              date: item.actual_completion_date || item.treatment_start_date || item.consultation_date || item.created_at,
              title,
              description,
              isCompleted: isCompleted,
              isCurrent: isCurrent
            };
          });
          setJourney(steps);
        } else {
          setJourney([]);
        }
      } catch (err) {
        console.error('Error fetching treatment journey:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchJourney();
  }, [customerId, supabase]);

  return (
    <div className="glass-card p-8 rounded-[40px] border border-white/10 space-y-8 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
        <Pulse className="w-24 h-24 text-primary" />
      </div>

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-premium">
            <Sparkle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white uppercase tracking-tight">Your Skin Journey</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Progressive Aesthetic Intelligence</p>
          </div>
        </div>
      </div>

      <div className="relative z-10 space-y-8 ml-4">
        {/* Vertical Line */}
        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary/50 via-primary/20 to-transparent" />

        {loading ? (
          <div className="space-y-8 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-6">
                <div className="w-6 h-6 rounded-full bg-white/10" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-1/3 bg-white/10 rounded" />
                  <div className="h-3 w-2/3 bg-white/10 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          journey.map((step, idx) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative flex gap-8 group/step"
            >
              <div className="relative z-10 mt-1">
                {step.isCompleted ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                ) : step.isCurrent ? (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(var(--primary),0.5)] animate-pulse">
                    <div className="w-2.5 h-2.5 rounded-full bg-white" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center group-hover/step:border-primary/50 transition-colors">
                    <Circle className="w-3 h-3 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className={cn(
                "flex-1 p-5 rounded-2xl border transition-all",
                step.isCurrent 
                  ? "bg-white/5 border-primary/30 shadow-premium scale-[1.02]" 
                  : "bg-transparent border-white/5 hover:border-white/10"
              )}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className={cn(
                    "text-sm font-bold uppercase tracking-tight",
                    step.isCompleted ? "text-emerald-400" : "text-white"
                  )}>
                    {step.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-light">
                    <CalendarDots className="w-3 h-3" />
                    {new Date(step.date).toLocaleDateString()}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed font-light">
                  {step.description}
                </p>
                
                {step.isCurrent && (
                  <button className="mt-4 flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest hover:gap-3 transition-all">
                    View Session Details
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] text-white hover:bg-white/10 transition-all active:scale-95 z-10 relative">
        Export Treatment History
      </button>
    </div>
  );
}

function cn(...classes: (string | undefined | null | boolean)[]) {
  return classes.filter(Boolean).join(' ');
}
