'use client';

import { 
  Sparkle,
  Dna,
  Info,
  CheckSquare,
  ShieldWarning,
  CaretDown,
  CaretUp,
  Clock,
  ClipboardText,
  IdentificationBadge,
  Pulse,
  Heartbeat,
  ShieldCheck,
  CheckCircle,
  X
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
      <Card className="rounded-[40px] border-border/50 shadow-premium overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
          <CheckSquare className="w-64 h-64 text-primary" />
        </div>

        <CardHeader className="p-8 border-b border-border/50 bg-secondary/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
              <ClipboardText weight="duotone" className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-black uppercase tracking-tight">Execution Protocol</CardTitle>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black mt-0.5">{treatmentName || 'Standard Operating Procedure'}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8 relative z-10 space-y-6">
          {loading ? (
            <div className="space-y-4 py-4 animate-pulse">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-secondary/20 rounded-[32px] border border-border/50" />
              ))}
            </div>
          ) : actualProtocol.length === 0 ? (
            <div className="py-24 text-center opacity-20 flex flex-col items-center gap-6">
              <div className="w-20 h-20 rounded-[40px] bg-secondary flex items-center justify-center text-muted-foreground">
                <ClipboardText weight="duotone" className="w-10 h-10" />
              </div>
              <p className="text-sm font-black uppercase tracking-[0.3em]">No protocol nodes defined for this treatment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {actualProtocol.map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    "p-6 rounded-[32px] border transition-all duration-300 relative overflow-hidden",
                    step.isCritical ? "bg-rose-500/5 border-rose-500/20" : "bg-secondary/20 border-border/50 hover:border-primary/20"
                  )}
                >
                  <div className="flex gap-6 relative z-10">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shrink-0 border shadow-inner transition-all duration-500",
                      step.isCritical ? "bg-rose-500 text-white border-rose-400" : "bg-card border-border text-primary group-hover:border-primary/30"
                    )}>
                      {step.step}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className={cn("text-sm font-bold uppercase tracking-tight", step.isCritical ? "text-rose-500" : "text-foreground")}>{step.action}</h4>
                        <Badge variant="ghost" size="sm" className="bg-secondary/50 text-muted-foreground border-none font-black text-[8px] tracking-widest uppercase px-2 py-0.5">
                          <Clock weight="bold" className="w-3 h-3 mr-1.5" />
                          {step.duration}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium italic leading-relaxed opacity-80">
                        {step.notes}
                      </p>
                      {step.isCritical && (
                        <div className="pt-2 flex items-center gap-2">
                          <Badge variant="destructive" className="font-black text-[7px] tracking-widest px-2 py-0.5">SAFETY_CRITICAL</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. AI Diagnostic Insights (The "Why") */}
      <Card className="rounded-[40px] border-border/50 shadow-premium overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
          <Sparkle className="w-64 h-64 text-emerald-500" />
        </div>

        <CardHeader className="p-8 border-b border-border/50 bg-secondary/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-inner">
              <Sparkle weight="duotone" className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-black uppercase tracking-tight">AI Clinical Insights</CardTitle>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black mt-0.5">Cognitive diagnostic summary</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8 md:p-10 space-y-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {insights.map((insight, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="p-6 bg-secondary/20 border border-border/50 rounded-[32px] space-y-5 hover:border-emerald-500/30 transition-all group/insight"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-foreground uppercase tracking-widest group-hover/insight:text-emerald-500 transition-colors">{insight.category}</h4>
                  <Badge 
                    variant={insight.score > 80 ? 'success' : insight.score > 60 ? 'default' : 'warning'} 
                    size="sm" 
                    className="font-black text-[8px] tracking-widest px-2 py-0.5"
                  >
                    INDEX: {insight.score}
                  </Badge>
                </div>
                <div className="p-4 bg-card border border-border/50 rounded-2xl flex gap-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-[0.02]">
                    <Info weight="bold" className="w-8 h-8 text-primary" />
                  </div>
                  <Info weight="duotone" className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-[11px] text-muted-foreground font-medium italic leading-relaxed relative z-10">
                    {insight.recommendation}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
          
          {insights.length === 0 && !loading && (
            <div className="py-20 text-center opacity-20 flex flex-col items-center gap-6">
              <div className="w-20 h-20 rounded-[40px] bg-secondary flex items-center justify-center text-muted-foreground">
                <Dna weight="duotone" className="w-10 h-10" />
              </div>
              <p className="text-sm font-black uppercase tracking-[0.3em]">Zero diagnostic intelligence detected.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}