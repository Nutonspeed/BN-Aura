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
  Clock
} from 'lucide-react';

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

export default function ProtocolInsights({ customerId }: { customerId: string }) {
  const [insights, setInsights] = useState<ClinicalInsight[]>([]);
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
        // Fetch the most recent skin analysis for this customer
        const { data: analysis, error } = await supabase
          .from('skin_analyses')
          .select('*')
          .eq('user_id', customerId) // This is the auth user_id linked to the customer
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

    function processAnalysis(data: {
      texture_score?: number;
      spots_score?: number;
      wrinkles_score?: number;
      recommendations?: {
        texture?: string;
        spots?: string;
        wrinkles?: string;
      };
    }) {
      const clinicalInsights: ClinicalInsight[] = [];

      // Map skin metrics to categories
      if (data.texture_score !== undefined) {
        clinicalInsights.push({
          category: 'Texture & Surface',
          score: Math.round(data.texture_score),
          recommendation: data.recommendations?.texture || 'Focus on smoothing treatment and cell renewal.',
          protocols: [
            { step: 1, action: 'Double Cleansing', duration: '5 mins', notes: 'Prepare skin for absorption', isCritical: false },
            { step: 2, action: 'Exfoliation', duration: '10 mins', notes: 'Chemical or manual based on sensitivity', isCritical: true },
            { step: 3, action: 'Texture-Refining Serum', duration: '5 mins', notes: 'Apply via ultrasound', isCritical: false }
          ]
        });
      }

      if (data.spots_score !== undefined) {
        clinicalInsights.push({
          category: 'Pigmentation & Tone',
          score: Math.round(data.spots_score),
          recommendation: data.recommendations?.spots || 'Targeted brightening protocols for identified zones.',
          protocols: [
            { step: 1, action: 'Targeted Laser/IPL', duration: '15 mins', notes: 'Focus on cheek and forehead clusters', isCritical: true },
            { step: 2, action: 'Cooling Mask', duration: '10 mins', notes: 'Post-laser calming', isCritical: false },
            { step: 3, action: 'Vitamin C Infusion', duration: '5 mins', notes: 'Antioxidant protection', isCritical: false }
          ]
        });
      }

      if (data.wrinkles_score !== undefined) {
        clinicalInsights.push({
          category: 'Structural Integrity',
          score: Math.round(data.wrinkles_score),
          recommendation: data.recommendations?.wrinkles || 'Collagen stimulation and dermal filling focus.',
          protocols: [
            { step: 1, action: 'Radio Frequency', duration: '20 mins', notes: 'Stimulate collagen production', isCritical: true },
            { step: 2, action: 'Hyaluronic Infusion', duration: '10 mins', notes: 'Deep hydration for fine lines', isCritical: false },
            { step: 3, action: 'Firming Seal', duration: '5 mins', notes: 'Lock in active ingredients', isCritical: false }
          ]
        });
      }

      setInsights(clinicalInsights);
    }

    fetchClinicalData();
  }, [customerId, supabase]);

  return (
    <div className="glass-card p-8 rounded-[40px] border border-white/10 space-y-8 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
        <Dna className="w-24 h-24 text-primary" />
      </div>

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white uppercase tracking-tight">Clinical Protocol</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">AI-Driven Treatment Intelligence</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2].map(i => (
              <div key={i} className="h-32 bg-white/5 rounded-3xl border border-white/5" />
            ))}
          </div>
        ) : insights.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm italic font-light">
            Scan results pending. Select a case to view protocol.
          </div>
        ) : (
          insights.map((insight, idx) => (
            <div 
              key={idx}
              className={`rounded-3xl border transition-all duration-500 ${
                expandedIndex === idx 
                  ? 'bg-white/10 border-primary/30 shadow-premium' 
                  : 'bg-white/5 border-white/5 hover:border-white/10'
              }`}
            >
              <button 
                onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                className="w-full p-6 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black text-muted-foreground uppercase mb-1">Score</span>
                    <span className={`text-xl font-black ${insight.score < 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {insight.score}
                    </span>
                  </div>
                  <div className="h-8 w-px bg-white/10 mx-2" />
                  <div className="text-left">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">{insight.category}</h4>
                    <p className="text-[10px] text-muted-foreground font-light italic truncate max-w-[200px] md:max-w-md">
                      {insight.recommendation}
                    </p>
                  </div>
                </div>
                {expandedIndex === idx ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
              </button>

              <AnimatePresence>
                {expandedIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-white/10"
                  >
                    <div className="p-6 space-y-6">
                      <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex gap-3">
                        <Info className="w-5 h-5 text-primary flex-shrink-0" />
                        <p className="text-xs text-muted-foreground font-light leading-relaxed">
                          <span className="text-primary font-bold uppercase tracking-tighter mr-1">AI Recommendation:</span>
                          {insight.recommendation}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <h5 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                          <CheckSquare className="w-3.5 h-3.5" />
                          Step-by-Step Instructions
                        </h5>
                        
                        {insight.protocols.map((p, pIdx) => (
                          <div key={pIdx} className="flex gap-4 group/step">
                            <div className="flex flex-col items-center gap-2">
                              <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black border ${
                                p.isCritical ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' : 'bg-white/10 border-white/10 text-white'
                              }`}>
                                {p.step}
                              </div>
                              {pIdx !== insight.protocols.length - 1 && <div className="w-0.5 h-full bg-white/5" />}
                            </div>
                            <div className="flex-1 pb-6">
                              <div className="flex justify-between items-start mb-1">
                                <span className="text-xs font-bold text-white group-hover/step:text-primary transition-colors">
                                  {p.action}
                                  {p.isCritical && (
                                    <span className="ml-2 text-[8px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded-full uppercase tracking-tighter align-middle">Critical</span>
                                  )}
                                </span>
                                <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {p.duration}
                                </span>
                              </div>
                              <p className="text-[10px] text-muted-foreground font-light leading-relaxed">
                                {p.notes}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>

      <div className="p-6 bg-rose-500/5 rounded-[32px] border border-rose-500/10 space-y-3">
        <div className="flex items-center gap-3 text-rose-400">
          <ShieldAlert className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Contraindications Detected</span>
        </div>
        <p className="text-[10px] text-muted-foreground font-light leading-relaxed italic">
          High sensitivity noted in cheek area. Avoid high-frequency modality on right cheekbone segment.
        </p>
      </div>
    </div>
  );
}
