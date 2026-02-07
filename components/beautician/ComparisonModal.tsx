'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X,
  Camera,
  ArrowRight,
  SpinnerGap,
  FloppyDisk,
  Sparkle,
  Image,
  ArrowLeft,
  CheckCircle,
  CaretRight,
  ArrowsClockwise,
  User,
  MonitorPlay
} from '@phosphor-icons/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (comparison: any) => void;
  customerId: string;
  userId?: string; // Auth user ID
}

export default function ComparisonModal({ isOpen, onClose, onSuccess, customerId, userId }: ComparisonModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [selectedBefore, setSelectedBefore] = useState<string | null>(null);
  const [selectedAfter, setSelectedAfter] = useState<string | null>(null);
  const [error, setError] = useState('');

  const supabase = createClient();

  const fetchAnalyses = useCallback(async () => {
    if (!isOpen || !customerId) return;
    
    setFetching(true);
    try {
      // Find the user_id linked to this customer record if not provided
      let targetUserId = userId;
      if (!targetUserId) {
        const { data: customer } = await supabase
          .from('customers')
          .select('user_id')
          .eq('id', customerId)
          .single();
        targetUserId = customer?.user_id;
      }

      if (!targetUserId) {
        setAnalyses([]);
        return;
      }

      const { data, error } = await supabase
        .from('skin_analyses')
        .select('*')
        .eq('user_id', targetUserId)
        .order('analyzed_at', { ascending: false });

      if (error) throw error;
      setAnalyses(data || []);
    } catch (err) {
      console.error('Error fetching analyses for comparison:', err);
    } finally {
      setFetching(false);
    }
  }, [isOpen, customerId, userId, supabase]);

  useEffect(() => {
    fetchAnalyses();
  }, [fetchAnalyses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBefore || !selectedAfter) return;

    setLoading(true);
    setError('');

    try {
      // Find user_id if not provided
      let targetUserId = userId;
      if (!targetUserId) {
        const { data: customer } = await supabase
          .from('customers')
          .select('user_id')
          .eq('id', customerId)
          .single();
        targetUserId = customer?.user_id;
      }

      const res = await fetch('/api/analysis/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: targetUserId,
          before_analysis_id: selectedBefore,
          after_analysis_id: selectedAfter
        })
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error?.message || 'Failed to create comparison');
      }

      onSuccess(result.data);
      onClose();
    } catch (err: any) {
      console.error('Error creating comparison:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl bg-card border border-border rounded-[40px] p-10 shadow-premium relative z-10 my-8 overflow-hidden group"
          >
            {/* Background Decor */}
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
              <MonitorPlay className="w-64 h-64 text-primary" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-10 relative z-10">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                  <Camera weight="duotone" className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground tracking-tight uppercase">Clinical Evolution Diagnostic</h3>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Synthesizing temporal delta between nodes</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all"
              >
                <X weight="bold" className="w-6 h-6" />
              </button>
            </div>

            {fetching ? (
              <div className="py-32 flex flex-col items-center justify-center gap-4 relative z-10">
                <SpinnerGap className="w-10 h-10 text-primary animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Accessing Neural Archive...</p>
              </div>
            ) : analyses.length < 2 ? (
              <div className="py-32 text-center space-y-8 relative z-10">
                <div className="w-24 h-24 rounded-[40px] bg-secondary border border-border/50 flex items-center justify-center mx-auto text-muted-foreground opacity-20">
                  <Image weight="duotone" className="w-12 h-12" />
                </div>
                <div className="space-y-3">
                  <p className="text-xl font-black text-foreground/40 uppercase tracking-widest">Insufficient Data Nodes</p>
                  <p className="text-sm text-muted-foreground font-medium max-w-sm mx-auto italic leading-relaxed">
                    This patient profile requires at least two distinct skin analysis records to perform a clinical evolution comparison.
                  </p>
                </div>
                <Button variant="outline" onClick={onClose} className="px-10 py-4 font-black text-[10px] uppercase tracking-widest">
                  Close Registry
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Select Before */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 ml-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Temporal Origin (Before)</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {analyses.map((a) => (
                        <button
                          key={`before-${a.id}`}
                          type="button"
                          onClick={() => setSelectedBefore(a.id)}
                          className={cn(
                            "aspect-square rounded-[24px] border-2 overflow-hidden transition-all duration-500 relative group/node",
                            selectedBefore === a.id 
                              ? "border-emerald-500 shadow-premium scale-105" 
                              : "border-border/50 opacity-40 hover:opacity-100 hover:border-primary/30"
                          )}
                        >
                          <img src={a.image_url} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/node:opacity-100 transition-opacity">
                            <span className="text-[10px] font-black text-white tabular-nums">{new Date(a.analyzed_at).toLocaleDateString()}</span>
                          </div>
                          {selectedBefore === a.id && (
                            <div className="absolute top-2 right-2 bg-emerald-500 rounded-full p-1 shadow-lg">
                              <CheckCircle weight="fill" className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Select After */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 ml-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Terminal Node (After)</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {analyses.map((a) => (
                        <button
                          key={`after-${a.id}`}
                          type="button"
                          onClick={() => setSelectedAfter(a.id)}
                          className={cn(
                            "aspect-square rounded-[24px] border-2 overflow-hidden transition-all duration-500 relative group/node",
                            selectedAfter === a.id 
                              ? "border-primary shadow-premium scale-105" 
                              : "border-border/50 opacity-40 hover:opacity-100 hover:border-primary/30"
                          )}
                        >
                          <img src={a.image_url} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/node:opacity-100 transition-opacity">
                            <span className="text-[10px] font-black text-white tabular-nums">{new Date(a.analyzed_at).toLocaleDateString()}</span>
                          </div>
                          {selectedAfter === a.id && (
                            <div className="absolute top-2 right-2 bg-primary rounded-full p-1 shadow-lg">
                              <CheckCircle weight="fill" className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Comparison Preview Link */}
                <AnimatePresence>
                  {selectedBefore && selectedAfter && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-8 bg-secondary/50 border border-border rounded-[32px] flex items-center justify-center gap-12 shadow-inner backdrop-blur-sm"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-20 h-20 rounded-2xl border-2 border-emerald-500/20 overflow-hidden shadow-sm">
                          <img src={analyses.find(a => a.id === selectedBefore)?.image_url} className="w-full h-full object-cover" />
                        </div>
                        <Badge variant="ghost" className="text-[8px] font-black tracking-widest uppercase">Node: Origin</Badge>
                      </div>
                      
                      <div className="flex flex-col items-center gap-2">
                        <ArrowRight weight="bold" className="w-8 h-8 text-primary animate-pulse" />
                        <span className="text-[8px] font-black text-primary uppercase tracking-[0.3em]">SYNTHESIZING</span>
                      </div>

                      <div className="flex flex-col items-center gap-3">
                        <div className="w-20 h-20 rounded-2xl border-2 border-primary/20 overflow-hidden shadow-sm">
                          <img src={analyses.find(a => a.id === selectedAfter)?.image_url} className="w-full h-full object-cover" />
                        </div>
                        <Badge variant="default" className="text-[8px] font-black tracking-widest uppercase">Node: Terminal</Badge>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error Message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-[10px] font-black uppercase tracking-widest text-center"
                    >
                      System Exception: {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center gap-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={loading}
                    className="w-full sm:flex-1 py-6 rounded-[20px] font-black uppercase tracking-widest text-[10px]"
                  >
                    Abort Logic
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !selectedBefore || !selectedAfter || selectedBefore === selectedAfter}
                    className="w-full sm:flex-[2] py-6 rounded-[20px] font-black uppercase tracking-widest text-[10px] shadow-premium gap-3"
                  >
                    {loading ? (
                      <>
                        <SpinnerGap className="w-5 h-5 animate-spin" />
                        Processing Delta...
                      </>
                    ) : (
                      <>
                        <Sparkle weight="bold" className="w-5 h-5" />
                        {selectedBefore === selectedAfter ? 'Distinct Nodes Required' : 'Generate Evolution Matrix'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}