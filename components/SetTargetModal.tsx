'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X,
  Target,
  CurrencyDollar,
  SpinnerGap,
  FloppyDisk,
  CalendarDots,
  CaretDown,
  CheckCircle,
  TrendUp,
  IdentificationBadge,
  Strategy
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface SetTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  staffId: string;
  staffName: string;
  currentClinicId: string;
}

export default function SetTargetModal({ isOpen, onClose, onSuccess, staffId, staffName, currentClinicId }: SetTargetModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    targetAmount: 0,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    notes: ''
  });

  useEffect(() => {
    if (isOpen && staffId) {
      const fetchCurrentTarget = async () => {
        try {
          const res = await fetch(`/api/sales/targets?userId=${staffId}&month=${formData.month}&year=${formData.year}`);
          const result = await res.json();
          if (result.success && result.data.target?.target_amount) {
            setFormData(prev => ({
              ...prev,
              targetAmount: Number(result.data.target.target_amount),
              notes: result.data.target.notes || ''
            }));
          } else {
            setFormData(prev => ({
              ...prev,
              targetAmount: 0,
              notes: ''
            }));
          }
        } catch (err) {
          console.error('Error fetching current target:', err);
        }
      };
      fetchCurrentTarget();
    }
  }, [isOpen, staffId, formData.month, formData.year]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/sales/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: staffId,
          ...formData
        })
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error?.message || 'Failed to save target');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error saving target:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === 'number' ? parseFloat(value) : value;
    setFormData(prev => ({ ...prev, [name]: val }));
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
            className="w-full max-w-lg bg-card border border-border rounded-[40px] p-10 shadow-premium relative z-10 my-8 overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
              <Strategy className="w-64 h-64 text-primary" />
            </div>

            <div className="flex items-center justify-between mb-10 relative z-10">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                  <Target weight="duotone" className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground tracking-tight uppercase">Performance Node</h3>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1 truncate max-w-[240px]">Configuring Target for {staffName}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={onClose}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all"
              >
                <X weight="bold" className="w-6 h-6" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Period Month</label>
                  <div className="relative group/input">
                    <select
                      name="month"
                      value={formData.month}
                      onChange={handleInputChange}
                      className="w-full px-5 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all appearance-none font-bold uppercase text-[10px] tracking-widest"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                        <option key={m} value={m} className="bg-card">
                          {new Date(2000, m - 1).toLocaleString('default', { month: 'long' }).toUpperCase()}
                        </option>
                      ))}
                    </select>
                    <CaretDown weight="bold" className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Period Year</label>
                  <div className="relative group/input">
                    <input
                      type="number"
                      name="year"
                      value={formData.year}
                      onChange={handleInputChange}
                      className="w-full px-5 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold tabular-nums"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                  Revenue Target (THB) *
                </label>
                <div className="relative group/input">
                  <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity rounded-2xl" />
                  <CurrencyDollar weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors relative z-10" />
                  <input
                    type="number"
                    name="targetAmount"
                    required
                    min="0"
                    step="1000"
                    value={formData.targetAmount}
                    onChange={handleInputChange}
                    className="w-full pl-14 pr-4 py-6 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-3xl font-black tabular-nums relative z-10"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                  Strategy Directives
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-6 py-4 bg-secondary/30 border border-border rounded-[24px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all resize-none font-medium leading-relaxed italic"
                  placeholder="Clinical goals and performance expectations for this operational cycle..."
                />
              </div>

              <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-[24px] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest text-emerald-500">Active Strategy Node</span>
                    <p className="text-[9px] text-muted-foreground font-medium italic mt-0.5 uppercase tracking-widest opacity-60">Target will be synchronized with live yield</p>
                  </div>
                </div>
                <TrendUp weight="duotone" className="w-7 h-7 text-emerald-500/40" />
              </div>

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

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-border/30">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                  className="w-full sm:flex-1 py-7 rounded-[20px] font-black uppercase tracking-widest text-[10px] border-border/50 hover:bg-secondary"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={loading || formData.targetAmount <= 0}
                  className="w-full sm:flex-[2] py-7 rounded-[20px] font-black uppercase tracking-widest text-[10px] shadow-premium gap-3"
                >
                  {loading ? (
                    <>
                      <SpinnerGap className="w-4 h-4 animate-spin" />
                      กำลังประมวลผล...
                    </>
                  ) : (
                    <>
                      <FloppyDisk weight="bold" className="w-5 h-5" />
                      Deploy Target Node
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}