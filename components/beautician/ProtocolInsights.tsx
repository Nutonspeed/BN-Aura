'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Dna, 
  Info, 
  CheckSquare, 
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Clock,
  ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { createClient } from '@/lib/supabase/client';

interface Protocol {
  step: number;
  action: string;
  duration: string;
  notes: string;
  isCritical: boolean;
}

interface ClinicalInsight {
  category: string;
  score: number;
  recommendation: string;
  protocols: Protocol[];
}

export default function ProtocolInsights({ customerId, journeyId }: { customerId: string; journeyId?: string }) {
  const [insights, setInsights] = useState<ClinicalInsight[]>([]);
  const [actualProtocol, setActualProtocol] = useState<Protocol[]>([]);
  const [treatmentName, setTreatmentName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const supabase = createClient();

  useEffect(() => {
    async function fetchClinicalData() {
      if (!customerId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // 1. Fetch the actual treatment protocol if journeyId is provided
        if (journeyId) {
          const { data: journey, error: journeyError } = await supabase
            .from('customer_treatment_journeys')
            .select(`
              treatment_plan,
              treatment_id
            `)
            .eq('id', journeyId)
            .single();

          if (journey && !journeyError) {
            // Try to fetch protocols from the treatment table if not in journey
            const tId = (journey as any).treatment_id;
            if (tId) {
              const { data: treatment } = await supabase
                .from('treatments')
                .select('names, protocols')
                .eq('id', tId)
                .single();
              
              if (treatment) {
                setTreatmentName(typeof treatment.names === 'object' ? (treatment.names as any).th || (treatment.names as any).en : treatment.names);
                setActualProtocol(Array.isArray(treatment.protocols) ? treatment.protocols : []);
              }
            }
          }
        }

        // 2. Fetch the most recent skin analysis for AI insights
        const { data: analysis, error } = await supabase
          .from('skin_analyses')
          .select('*')
          .eq('user_id', customerId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error || !analysis) {
          // If no direct user_id match, try finding by customer record first
          const { data: customer } = await supabase
            .from('customers')
            .select('user_id')
            .eq('id', customerId)
            .single();
          
          if (customer?.user_id) {
            const { data: altAnalysis } = await supabase
              .from('skin_analyses')
              .select('*')
              .eq('user_id', customer.user_id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
            
            if (altAnalysis) {
              processAnalysis(altAnalysis);
              return;
            }
          }
          setInsights([]);
          return;
        }

        processAnalysis(analysis);
      } catch (err) {
        console.error('Error fetching clinical insights:', err);
      } finally {
        setLoading(false);
      }
    }

    function processAnalysis(data: any) {
      const clinicalInsights: ClinicalInsight[] = [];

      if (data.texture_score !== undefined) {
        clinicalInsights.push({
          category: 'Texture & Surface',
          score: Math.round(data.texture_score),
          recommendation: data.recommendations?.texture || 'Focus on smoothing treatment and cell renewal.',
          protocols: []
        });
      }

      if (data.spots_score !== undefined) {
        clinicalInsights.push({
          category: 'Pigmentation & Tone',
          score: Math.round(data.spots_score),
          recommendation: data.recommendations?.spots || 'Targeted brightening protocols for identified zones.',
          protocols: []
        });
      }

      if (data.wrinkles_score !== undefined) {
        clinicalInsights.push({
          category: 'Structural Integrity',
          score: Math.round(data.wrinkles_score),
          recommendation: data.recommendations?.wrinkles || 'Collagen stimulation and dermal filling focus.',
          protocols: []
        });
      }

      setInsights(clinicalInsights);
    }

    fetchClinicalData();
  }, [customerId, journeyId, supabase]);

  return (
    <div className="space-y-8">
      {/* 1. Actual Clinical Protocol (The "How-To") */}
      <div className="glass-premium p-8 rounded-[40px] border border-primary/30 bg-primary/[0.02] space-y-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
          <CheckSquare className="w-24 h-24 text-primary" />
        </div>

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20 shadow-premium">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Execution <span className="text-primary">Protocol</span></h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">{treatmentName || 'Standard Operating Procedure'}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 relative z-10">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-white/5 rounded-2xl border border-white/5" />
              ))}
            </div>
          ) : actualProtocol.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm italic font-light bg-white/5 rounded-[32px] border border-white/5">
              No custom protocol nodes defined for this treatment.
            </div>
          ) : (
            actualProtocol.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={cn(
                  "p-6 rounded-3xl border transition-all duration-300",
                  step.isCritical ? "bg-rose-500/5 border-rose-500/20" : "bg-white/5 border-white/5 hover:border-white/10"
                )}
              >
                <div className="flex gap-6">
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 border",
                    step.isCritical ? "bg-rose-500 text-white border-rose-400" : "bg-white/10 text-white/60 border-white/10"
                  )}>
                    {step.step}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-black text-white uppercase tracking-wider">{step.action}</h4>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {step.duration}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground font-light leading-relaxed italic">
                      {step.notes}
                    </p>
                    {step.isCritical && (
                      <div className="pt-2 flex items-center gap-2 text-rose-400">
                        <ShieldAlert className="w-3 h-3" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Safety Critical Step</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* 2. AI Diagnostic Insights (The "Why") */}
      <div className="glass-card p-8 rounded-[40px] border border-white/10 space-y-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
          <Dna className="w-24 h-24 text-primary" />
        </div>

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white uppercase tracking-tight">AI Insights</h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Diagnostic Data Summary</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 relative z-10">
          {insights.map((insight, idx) => (
            <div 
              key={idx}
              className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-white uppercase tracking-widest">{insight.category}</h4>
                <span className={cn(
                  "px-3 py-1 rounded-full text-[9px] font-black uppercase",
                  insight.score > 80 ? "bg-emerald-500/10 text-emerald-400" :
                  insight.score > 60 ? "bg-primary/10 text-primary" :
                  "bg-rose-500/10 text-rose-400"
                )}>
                  Score: {insight.score}
                </span>
              </div>
              <div className="flex gap-3 p-3 bg-black/40 rounded-2xl border border-white/5">
                <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted-foreground font-light leading-relaxed">
                  {insight.recommendation}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

