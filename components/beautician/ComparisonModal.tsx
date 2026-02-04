'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, ArrowRight, SpinnerGap, FloppyDisk, Sparkle, Image } from '@phosphor-icons/react';
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl bg-[#0A0A0A] border border-white/10 rounded-[40px] p-10 shadow-2xl my-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/20 flex items-center justify-center text-primary">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Clinical Transformation Diagnostic</h3>
                  <p className="text-sm text-muted-foreground italic font-light">Synthesizing evolution delta between temporal nodes</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-3 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/10"
              >
                <X className="w-6 h-6 text-muted-foreground" />
              </button>
            </div>

            {fetching ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4">
                <SpinnerGap className="w-10 h-10 text-primary animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Accessing Neural Archive...</p>
              </div>
            ) : analyses.length < 2 ? (
              <div className="py-20 text-center space-y-6">
                <div className="w-20 h-20 rounded-[32px] bg-white/5 border border-white/5 flex items-center justify-center mx-auto text-muted-foreground opacity-20">
                  <Image className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <p className="text-xl font-black text-white/40 uppercase tracking-widest">Insufficient Data Nodes</p>
                  <p className="text-sm text-muted-foreground font-light max-w-sm mx-auto italic">This patient profile requires at least two distinct skin analysis records to perform a clinical comparison.</p>
                </div>
                <button onClick={onClose} className="px-8 py-3 bg-white/5 border border-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest">Close Registry</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Select Before */}
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Temporal Origin (Before)</p>
                    <div className="grid grid-cols-3 gap-3">
                      {analyses.map((a) => (
                        <button
                          key={`before-${a.id}`}
                          type="button"
                          onClick={() => setSelectedBefore(a.id)}
                          className={cn(
                            "aspect-square rounded-2xl border-2 overflow-hidden transition-all relative group",
                            selectedBefore === a.id ? "border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-105" : "border-white/5 opacity-40 hover:opacity-100"
                          )}
                        >
                          <img src={a.image_url} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[8px] font-black text-white">{new Date(a.analyzed_at).toLocaleDateString()}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Select After */}
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Terminal Node (After)</p>
                    <div className="grid grid-cols-3 gap-3">
                      {analyses.map((a) => (
                        <button
                          key={`after-${a.id}`}
                          type="button"
                          onClick={() => setSelectedAfter(a.id)}
                          className={cn(
                            "aspect-square rounded-2xl border-2 overflow-hidden transition-all relative group",
                            selectedAfter === a.id ? "border-primary shadow-glow-sm scale-105" : "border-white/5 opacity-40 hover:opacity-100"
                          )}
                        >
                          <img src={a.image_url} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[8px] font-black text-white">{new Date(a.analyzed_at).toLocaleDateString()}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {selectedBefore && selectedAfter && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-primary/5 border border-primary/20 rounded-3xl flex items-center justify-center gap-10"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-xl border border-white/10 overflow-hidden">
                        <img src={analyses.find(a => a.id === selectedBefore)?.image_url} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[8px] font-black text-white/40 uppercase">Origin</span>
                    </div>
                    <ArrowRight className="w-6 h-6 text-primary" />
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-xl border border-white/10 overflow-hidden">
                        <img src={analyses.find(a => a.id === selectedAfter)?.image_url} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[8px] font-black text-white/40 uppercase">Terminal</span>
                    </div>
                  </motion.div>
                )}

                {error && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-bold uppercase tracking-widest text-center">
                    Exception: {error}
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="flex-1 px-8 py-5 bg-white/5 border border-white/10 text-white rounded-[24px] font-black uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-50 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !selectedBefore || !selectedAfter || selectedBefore === selectedAfter}
                    className="flex-[2] px-8 py-5 bg-primary text-primary-foreground rounded-[24px] font-black uppercase tracking-[0.2em] shadow-premium hover:brightness-110 transition-all disabled:opacity-20 flex items-center justify-center gap-3 text-xs"
                  >
                    {loading ? <SpinnerGap className="w-4 h-4 animate-spin" /> : <Sparkle className="w-4 h-4" />}
                    {selectedBefore === selectedAfter ? 'Distinct Nodes Required' : 'Generate Evolution Report'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
