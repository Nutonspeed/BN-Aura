'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Buildings, MapPin, SpinnerGap, FloppyDisk, MapTrifold, Phone, CheckCircle } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface BranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  branch?: any;
}

export default function BranchModal({ isOpen, onClose, onSuccess, branch }: BranchModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    branch_name: '',
    branch_code: '',
    address: '',
    city: '',
    province: '',
    phone: '',
    is_active: true
  });

  useEffect(() => {
    if (branch) {
      setFormData({
        branch_name: branch.branch_name || '',
        branch_code: branch.branch_code || '',
        address: branch.address || '',
        city: branch.city || '',
        province: branch.province || '',
        phone: branch.phone || '',
        is_active: branch.is_active !== undefined ? branch.is_active : true
      });
    } else {
      setFormData({
        branch_name: '',
        branch_code: '',
        address: '',
        city: '',
        province: '',
        phone: '',
        is_active: true
      });
    }
  }, [branch, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = branch ? `/api/branches/${branch.id}` : '/api/branches';
      const method = branch ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error?.message || 'Failed to save branch');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error saving branch:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
            className="w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-[32px] p-8 shadow-2xl my-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/20 flex items-center justify-center text-primary">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">
                    {branch ? 'Modify Branch Node' : 'Initialize New Branch'}
                  </h3>
                  <p className="text-sm text-muted-foreground italic font-light">
                    {branch ? 'Updating clinical expansion telemetry' : 'Establishing new geographic operational node'}
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
                {/* Branch Name */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Branch Designation *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input
                      type="text"
                      name="branch_name"
                      required
                      value={formData.branch_name}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all"
                      placeholder="e.g. Sukhumvit Main Terminal"
                    />
                  </div>
                </div>

                {/* Branch Code */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Node ID / Branch Code
                  </label>
                  <input
                    type="text"
                    name="branch_code"
                    value={formData.branch_code}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all"
                    placeholder="Auto-generated if blank"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Communication Node
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all"
                      placeholder="+66 00-000-0000"
                    />
                  </div>
                </div>

                {/* City */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    City Node *
                  </label>
                  <div className="relative">
                    <Map className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all"
                      placeholder="e.g. Bangkok"
                    />
                  </div>
                </div>

                {/* Province */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Province Cluster *
                  </label>
                  <input
                    type="text"
                    name="province"
                    required
                    value={formData.province}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all"
                    placeholder="e.g. Bangkok"
                  />
                </div>

                {/* Address */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Geographic Coordinates (Address) *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-3 w-4 h-4 text-white/20" />
                    <textarea
                      name="address"
                      required
                      rows={3}
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all resize-none"
                      placeholder="Full physical address..."
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Operational Status
                  </label>
                  <select
                    name="is_active"
                    value={formData.is_active ? 'true' : 'false'}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.value === 'true' }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-primary/50 transition-all appearance-none"
                  >
                    <option value="true" className="bg-[#0A0A0A]">OPERATIONAL (Active)</option>
                    <option value="false" className="bg-[#0A0A0A]">DEACTIVATED (Inactive)</option>
                  </select>
                </div>
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
                  disabled={loading || !formData.branch_name || !formData.city || !formData.province}
                  className="flex-1 px-6 py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-xs shadow-premium"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {branch ? 'Commit Changes' : 'Initialize Node'}
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
