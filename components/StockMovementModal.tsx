'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowCircleUp, ArrowCircleDown, GearSix, SpinnerGap, FloppyDisk, Package } from '@phosphor-icons/react';
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
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
                <div className={cn(
                  "w-12 h-12 rounded-2xl border flex items-center justify-center",
                  formData.movement_type === 'IN' ? "bg-emerald-500/20 border-emerald-500/20 text-emerald-400" :
                  formData.movement_type === 'OUT' ? "bg-rose-500/20 border-rose-500/20 text-rose-400" :
                  "bg-blue-500/20 border-blue-500/20 text-blue-400"
                )}>
                  {formData.movement_type === 'IN' ? <ArrowCircleUp className="w-6 h-6" /> :
                   formData.movement_type === 'OUT' ? <ArrowCircleDown className="w-6 h-6" /> :
                   <GearSix className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Stock Adjustment</h3>
                  <p className="text-sm text-muted-foreground italic font-light truncate max-w-[200px]">
                    {product.name}
                  </p>
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
              {/* Current Stock Display */}
              <div className="px-6 py-4 bg-white/5 border border-white/5 rounded-2xl flex justify-between items-center">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Current Inventory</span>
                <span className="text-xl font-black text-white">{product.stock_quantity} <span className="text-[10px] text-muted-foreground ml-1">UNITS</span></span>
              </div>

              {/* Movement Type */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                  Movement Vector
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'IN', label: 'Restock', icon: ArrowCircleUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                    { id: 'OUT', label: 'Removal', icon: ArrowCircleDown, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
                    { id: 'ADJUST', label: 'Correction', icon: GearSix, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                  ].map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, movement_type: type.id }))}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all",
                        formData.movement_type === type.id 
                          ? cn(type.bg, type.border, "scale-105 shadow-lg") 
                          : "bg-white/5 border-white/5 opacity-40 grayscale hover:opacity-100 hover:grayscale-0"
                      )}
                    >
                      <type.icon className={cn("w-5 h-5", formData.movement_type === type.id ? type.color : "text-white")} />
                      <span className={cn("text-[9px] font-black uppercase tracking-widest", formData.movement_type === type.id ? type.color : "text-white")}>
                        {type.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                  Node Quantity
                </label>
                <div className="relative">
                  <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-primary/50 transition-all text-center text-lg font-black"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                  Audit Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all resize-none text-xs"
                  placeholder="Reason for adjustment..."
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-[10px] font-black uppercase tracking-widest text-center">
                  Exception: {error}
                </div>
              )}

              {/* Actions */}
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
                  disabled={loading || formData.quantity < 1}
                  className="flex-1 px-6 py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-xs shadow-premium"
                >
                  {loading ? <SpinnerGap className="w-4 h-4 animate-spin" /> : <FloppyDisk className="w-4 h-4" />}
                  Record Movement
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

