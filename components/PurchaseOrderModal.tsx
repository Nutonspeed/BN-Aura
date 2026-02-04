'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Truck, CurrencyDollar, SpinnerGap, FloppyDisk, Plus, Trash } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  purchaseOrder?: any;
}

export default function PurchaseOrderModal({ isOpen, onClose, onSuccess, purchaseOrder }: PurchaseOrderModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    supplier_id: '',
    total_amount: 0,
    status: 'draft',
    notes: '',
    ordered_at: new Date().toISOString()
  });

  const fetchSuppliers = useCallback(async () => {
    setFetching(true);
    try {
      const res = await fetch('/api/suppliers');
      const result = await res.json();
      if (result.success) {
        setSuppliers(result.data || []);
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchSuppliers();
      if (purchaseOrder) {
        setFormData({
          supplier_id: purchaseOrder.supplier_id || '',
          total_amount: Number(purchaseOrder.total_amount) || 0,
          status: purchaseOrder.status || 'draft',
          notes: purchaseOrder.notes || '',
          ordered_at: purchaseOrder.ordered_at || new Date().toISOString()
        });
      } else {
        setFormData({
          supplier_id: '',
          total_amount: 0,
          status: 'draft',
          notes: '',
          ordered_at: new Date().toISOString()
        });
      }
    }
  }, [purchaseOrder, isOpen, fetchSuppliers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = purchaseOrder ? `/api/purchase-orders/${purchaseOrder.id}` : '/api/purchase-orders';
      const method = purchaseOrder ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error?.message || 'Failed to save purchase order');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error saving purchase order:', err);
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-[#0A0A0A] border border-white/10 rounded-[32px] p-8 shadow-2xl my-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/20 flex items-center justify-center text-primary">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">
                    {purchaseOrder ? 'Modify Acquisition Node' : 'Initialize Purchase Order'}
                  </h3>
                  <p className="text-sm text-muted-foreground italic font-light">
                    {purchaseOrder ? 'Updating procurement telemetry' : 'Requesting new material stock from network'}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Supplier Selection */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Acquisition Source (Supplier) *
                  </label>
                  <div className="relative">
                    <Truck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <select
                      name="supplier_id"
                      required
                      value={formData.supplier_id}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-primary/50 transition-all appearance-none"
                    >
                      <option value="" className="bg-[#0A0A0A]">Select Supplier Node...</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id} className="bg-[#0A0A0A]">{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Total Investment *
                  </label>
                  <div className="relative">
                    <CurrencyDollar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input
                      type="number"
                      name="total_amount"
                      required
                      step="0.01"
                      value={formData.total_amount}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-primary/50 transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Procurement Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-primary/50 transition-all appearance-none"
                  >
                    <option value="draft" className="bg-[#0A0A0A]">DRAFT (Pending)</option>
                    <option value="ordered" className="bg-[#0A0A0A]">ORDERED (Active)</option>
                    <option value="received" className="bg-[#0A0A0A]">RECEIVED (Terminal)</option>
                    <option value="cancelled" className="bg-[#0A0A0A]">TERMINATED (Aborted)</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                  Clinical Directives / Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all resize-none text-xs font-light"
                  placeholder="Additional acquisition telemetry..."
                />
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-bold uppercase tracking-widest text-center"
                >
                  System Exception: {error}
                </motion.div>
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
                  disabled={loading || !formData.supplier_id || formData.total_amount <= 0}
                  className="flex-1 px-6 py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-xs shadow-premium"
                >
                  {loading ? (
                    <>
                      <SpinnerGap className="w-4 h-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <FloppyDisk className="w-4 h-4" />
                      {purchaseOrder ? 'Commit Updates' : 'Initialize Order'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
