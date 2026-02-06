'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Truck, CurrencyDollar, SpinnerGap, FloppyDisk, Plus, Trash, CaretDown, CheckCircle, Package } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
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
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 overflow-y-auto">
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
            className="w-full max-w-2xl bg-card border border-border rounded-[40px] p-10 shadow-premium relative z-10 my-8 overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
              <Package className="w-64 h-64 text-primary" />
            </div>

            <div className="flex items-center justify-between mb-10 relative z-10">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                  <FileText weight="duotone" className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground tracking-tight uppercase">
                    {purchaseOrder ? 'Modify Acquisition' : 'Initialize Order'}
                  </h3>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                    {purchaseOrder ? 'Updating procurement telemetry' : 'Requesting new material stock node'}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Acquisition Source (Supplier) *
                  </label>
                  <div className="relative group/input">
                    <Truck weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors" />
                    <select
                      name="supplier_id"
                      required
                      value={formData.supplier_id}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all appearance-none font-bold uppercase text-xs tracking-widest"
                    >
                      <option value="" className="bg-card">Select Supplier Node...</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id} className="bg-card">{s.name.toUpperCase()}</option>
                      ))}
                    </select>
                    <CaretDown weight="bold" className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Total Investment (THB) *
                  </label>
                  <div className="relative group/input">
                    <CurrencyDollar weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors" />
                    <input
                      type="number"
                      name="total_amount"
                      required
                      step="0.01"
                      value={formData.total_amount}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold tabular-nums"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Procurement Status
                  </label>
                  <div className="relative group/input">
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className={cn(
                        "w-full px-5 py-4 bg-secondary/30 border border-border rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all appearance-none font-black uppercase tracking-widest text-[10px]",
                        formData.status === 'received' ? "text-emerald-500" : 
                        formData.status === 'ordered' ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      <option value="draft" className="bg-card">DRAFT (Pending)</option>
                      <option value="ordered" className="bg-card text-primary">ORDERED (Active)</option>
                      <option value="received" className="bg-card text-emerald-500">RECEIVED (Terminal)</option>
                      <option value="cancelled" className="bg-card text-rose-500">TERMINATED (Aborted)</option>
                    </select>
                    <CaretDown weight="bold" className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                  Clinical Directives / Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-6 py-4 bg-secondary/30 border border-border rounded-[24px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all resize-none font-medium leading-relaxed italic"
                  placeholder="Additional acquisition telemetry and procurement context..."
                />
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
                  Abort Cycle
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !formData.supplier_id || formData.total_amount <= 0}
                  className="w-full sm:flex-[2] py-7 rounded-[20px] font-black uppercase tracking-widest text-[10px] shadow-premium gap-3"
                >
                  {loading ? (
                    <>
                      <SpinnerGap className="w-4 h-4 animate-spin" />
                      Synchronizing...
                    </>
                  ) : (
                    <>
                      <CheckCircle weight="bold" className="w-4 h-4" />
                      {purchaseOrder ? 'Commit Updates' : 'Authorize Order'}
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