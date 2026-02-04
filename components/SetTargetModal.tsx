'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, CurrencyDollar, SpinnerGap, FloppyDisk, CalendarDots } from '@phosphor-icons/react';
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-[32px] p-8 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/20 flex items-center justify-center text-primary">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Set Performance Node</h3>
                  <p className="text-sm text-muted-foreground italic font-light truncate max-w-[200px]">Target for {staffName}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-3 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/10"
              >
                <X className="w-6 h-6 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Period Month</label>
                  <select
                    name="month"
                    value={formData.month}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary/50 appearance-none"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m} className="bg-[#0A0A0A]">
                        {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Period Year</label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                  Revenue Target (THB) *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input
                    type="number"
                    name="targetAmount"
                    required
                    min="0"
                    step="1000"
                    value={formData.targetAmount}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-primary/50 transition-all text-xl font-black"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                  Strategy Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all resize-none text-xs"
                  placeholder="Goals and expectations for this cycle..."
                />
              </div>

              {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-[10px] font-black uppercase tracking-widest text-center">
                  Exception: {error}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-6 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-50 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || formData.targetAmount <= 0}
                  className="flex-1 px-6 py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-xs shadow-premium"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Deploy Target
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
