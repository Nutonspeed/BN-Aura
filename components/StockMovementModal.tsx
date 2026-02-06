'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowCircleUp, ArrowCircleDown, GearSix, SpinnerGap, FloppyDisk, Package, CaretDown, CheckCircle, Archive, WarningCircle, ArrowsLeftRight } from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: any;
}

export default function StockMovementModal({ isOpen, onClose, onSuccess, product }: StockMovementModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    movement_type: 'IN', // 'IN', 'OUT', 'ADJUST'
    quantity: 1,
    notes: '',
    reference_type: 'ADJUSTMENT'
  });

  useEffect(() => {
    setFormData({
      movement_type: 'IN',
      quantity: 1,
      notes: '',
      reference_type: 'ADJUSTMENT'
    });
  }, [product, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/stock/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          ...formData
        })
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error?.message || 'Failed to record movement');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error recording movement:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'quantity' ? parseInt(value) || 0 : value 
    }));
  };

  if (!product) return null;

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
            className="w-full max-w-md bg-card border border-border rounded-[40px] p-10 shadow-premium relative z-10 my-8 overflow-hidden group"
          >
            {/* Background Decor */}
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
              <Archive className="w-64 h-64 text-primary" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-10 relative z-10">
              <div className="flex items-center gap-5">
                <div className={cn(
                  "w-14 h-14 rounded-2xl border flex items-center justify-center shadow-inner transition-all duration-500",
                  formData.movement_type === 'IN' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                  formData.movement_type === 'OUT' ? "bg-rose-500/10 border-rose-500/20 text-rose-500" :
                  "bg-primary/10 border-primary/20 text-primary"
                )}>
                  {formData.movement_type === 'IN' ? <ArrowCircleUp weight="duotone" className="w-7 h-7" /> :
                   formData.movement_type === 'OUT' ? <ArrowCircleDown weight="duotone" className="w-7 h-7" /> :
                   <ArrowsLeftRight weight="duotone" className="w-7 h-7" />}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground tracking-tight uppercase">Stock Sync Node</h3>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1 truncate max-w-[240px]">
                    Updating Asset: {product.name}
                  </p>
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
              {/* Current Stock Display */}
              <div className="px-8 py-6 bg-secondary/30 border border-border/50 rounded-[32px] flex justify-between items-center shadow-inner relative overflow-hidden group/stock">
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/stock:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Available Inventory</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-foreground tabular-nums tracking-tighter">{product.stock_quantity}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Units Active</span>
                  </div>
                </div>
                <div className="relative z-10 w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center text-muted-foreground/40">
                  <Package weight="duotone" className="w-6 h-6" />
                </div>
              </div>

              {/* Movement Type Vector Selection */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">
                  Movement Vector
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'IN', label: 'Inbound', icon: ArrowCircleUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                    { id: 'OUT', label: 'Outbound', icon: ArrowCircleDown, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
                    { id: 'ADJUST', label: 'Sync', icon: ArrowsLeftRight, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
                  ].map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, movement_type: type.id }))}
                      className={cn(
                        "flex flex-col items-center gap-3 p-5 rounded-[24px] border transition-all duration-500",
                        formData.movement_type === type.id 
                          ? cn(type.bg, type.border, "shadow-premium scale-105") 
                          : "bg-secondary/20 border-border/50 opacity-40 grayscale hover:opacity-100 hover:grayscale-0"
                      )}
                    >
                      <type.icon weight={formData.movement_type === type.id ? "fill" : "duotone"} className={cn("w-7 h-7", formData.movement_type === type.id ? type.color : "text-foreground")} />
                      <span className={cn("text-[9px] font-black uppercase tracking-[0.2em]", formData.movement_type === type.id ? type.color : "text-foreground")}>
                        {type.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Input */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">
                  Sync Magnitude
                </label>
                <div className="relative group/input">
                  <div className="absolute inset-0 bg-primary/5 blur-2xl opacity-0 group-focus-within/input:opacity-100 transition-opacity rounded-3xl" />
                  <Package weight="bold" className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors relative z-10" />
                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className="w-full pl-16 pr-6 py-7 bg-secondary/30 border border-border rounded-[28px] text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-center text-4xl font-black tabular-nums relative z-10 shadow-inner"
                  />
                </div>
              </div>

              {/* Notes Area */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">
                  Audit Protocol Directives
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-8 py-5 bg-secondary/30 border border-border rounded-[28px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all resize-none font-medium leading-relaxed italic"
                  placeholder="Clinical reason for node synchronization..."
                />
              </div>

              {/* Error Protocol */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-3xl text-rose-500 text-[10px] font-black uppercase tracking-widest text-center"
                  >
                    System Exception: {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Node Selection */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-border/30">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                  className="w-full sm:flex-1 py-7 rounded-[24px] font-black uppercase tracking-widest text-[10px] border-border/50 hover:bg-secondary"
                >
                  Abort Cycle
                </Button>
                <Button
                  type="submit"
                  disabled={loading || formData.quantity < 1}
                  className="w-full sm:flex-[2] py-7 rounded-[24px] font-black uppercase tracking-widest text-[10px] shadow-premium gap-3"
                >
                  {loading ? (
                    <>
                      <SpinnerGap className="w-5 h-5 animate-spin" />
                      Synchronizing...
                    </>
                  ) : (
                    <>
                      <CheckCircle weight="bold" className="w-5 h-5" />
                      Commit Movement Node
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