'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FirstAidKit, Tag, CurrencyDollar, SpinnerGap, FloppyDisk, Sparkle, Translate, ListChecks, Plus, Trash } from '@phosphor-icons/react';

interface ProtocolStep {
  step: number;
  action: string;
  duration: string;
  notes: string;
  isCritical: boolean;
}

interface TreatmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  treatment?: any; // If provided, we're in edit mode
}

export default function TreatmentModal({ isOpen, onClose, onSuccess, treatment }: TreatmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    names: { th: '', en: '' },
    category: '',
    price_min: 0,
    price_max: 0,
    is_active: true,
    image_url: '',
    protocols: [] as ProtocolStep[]
  });

  useEffect(() => {
    if (treatment) {
      setFormData({
        names: typeof treatment.names === 'object' ? { ...treatment.names } : { th: treatment.names, en: '' },
        category: treatment.category || '',
        price_min: treatment.price_min || 0,
        price_max: treatment.price_max || 0,
        is_active: treatment.is_active !== undefined ? treatment.is_active : true,
        image_url: treatment.image_url || '',
        protocols: Array.isArray(treatment.protocols) ? [...treatment.protocols] : []
      });
    } else {
      setFormData({
        names: { th: '', en: '' },
        category: '',
        price_min: 0,
        price_max: 0,
        is_active: true,
        image_url: '',
        protocols: []
      });
    }
  }, [treatment, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = treatment ? `/api/treatments/${treatment.id}` : '/api/treatments';
      const method = treatment ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error?.message || 'Failed to save treatment');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error saving treatment:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (lang: 'th' | 'en', value: string) => {
    setFormData(prev => ({
      ...prev,
      names: { ...prev.names, [lang]: value }
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === 'number' ? parseFloat(value) : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const addProtocolStep = () => {
    setFormData(prev => ({
      ...prev,
      protocols: [
        ...prev.protocols,
        { step: prev.protocols.length + 1, action: '', duration: '', notes: '', isCritical: false }
      ]
    }));
  };

  const updateProtocolStep = (index: number, field: keyof ProtocolStep, value: any) => {
    setFormData(prev => {
      const newProtocols = [...prev.protocols];
      newProtocols[index] = { ...newProtocols[index], [field]: value };
      return { ...prev, protocols: newProtocols };
    });
  };

  const removeProtocolStep = (index: number) => {
    setFormData(prev => {
      const newProtocols = prev.protocols.filter((_, i) => i !== index)
        .map((p, i) => ({ ...p, step: i + 1 }));
      return { ...prev, protocols: newProtocols };
    });
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
                <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/20 flex items-center justify-center">
                  <FirstAidKit className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">
                    {treatment ? 'Edit Treatment Protocol' : 'Authorize New Protocol'}
                  </h3>
                  <p className="text-sm text-muted-foreground italic font-light">
                    {treatment ? 'Updating existing clinical mapping' : 'Registering new medical excellence node'}
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

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Names (Thai & English) */}
                <div className="space-y-4 md:col-span-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                      <Languages className="w-3 h-3" /> Designated Name (Thai) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.names.th}
                      onChange={(e) => handleNameChange('th', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all"
                      placeholder="ชื่อทรีตเมนต์ (ภาษาไทย)"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                      <Languages className="w-3 h-3" /> Designated Name (English)
                    </label>
                    <input
                      type="text"
                      value={formData.names.en}
                      onChange={(e) => handleNameChange('en', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all"
                      placeholder="Treatment Designation (English)"
                    />
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Clinical Category *
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input
                      type="text"
                      name="category"
                      required
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-primary/50 transition-all"
                      placeholder="e.g. Skin, Laser, Injectable"
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

                {/* Pricing */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Floor Price (Min) *
                  </label>
                  <div className="relative">
                    <CurrencyDollar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input
                      type="number"
                      name="price_min"
                      required
                      value={formData.price_min}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-primary/50 transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Ceiling Price (Max)
                  </label>
                  <div className="relative">
                    <CurrencyDollar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input
                      type="number"
                      name="price_max"
                      value={formData.price_max}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-primary/50 transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Protocol Section */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1 flex items-center gap-2">
                    <ListTodo className="w-3 h-3" /> Execution Protocols
                  </label>
                  <button
                    type="button"
                    onClick={addProtocolStep}
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-primary/20 transition-all"
                  >
                    <Plus className="w-3 h-3" /> Add Step
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.protocols.map((step, idx) => (
                    <div key={idx} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4 relative group">
                      <button
                        type="button"
                        onClick={() => removeProtocolStep(idx)}
                        className="absolute top-4 right-4 text-rose-500/40 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-[8px] font-black text-white/40 uppercase tracking-widest ml-1">Step {step.step}: Action</label>
                          <input
                            type="text"
                            value={step.action}
                            onChange={(e) => updateProtocolStep(idx, 'action', e.target.value)}
                            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-primary/50"
                            placeholder="e.g. Apply localized cooling"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[8px] font-black text-white/40 uppercase tracking-widest ml-1">Duration</label>
                          <input
                            type="text"
                            value={step.duration}
                            onChange={(e) => updateProtocolStep(idx, 'duration', e.target.value)}
                            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-primary/50"
                            placeholder="e.g. 5 mins"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-white/40 uppercase tracking-widest ml-1">Operator Notes</label>
                        <textarea
                          value={step.notes}
                          onChange={(e) => updateProtocolStep(idx, 'notes', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-primary/50 resize-none"
                          placeholder="Specific instructions for this step..."
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id={`critical-${idx}`}
                          checked={step.isCritical}
                          onChange={(e) => updateProtocolStep(idx, 'isCritical', e.target.checked)}
                          className="w-3.5 h-3.5 rounded border-white/10 bg-white/5 text-primary focus:ring-primary/50"
                        />
                        <label htmlFor={`critical-${idx}`} className="text-[9px] font-black text-rose-400 uppercase tracking-widest cursor-pointer select-none">
                          Mark as Safety Critical
                        </label>
                      </div>
                    </div>
                  ))}
                  {formData.protocols.length === 0 && (
                    <div className="py-8 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-2xl">
                      <p className="text-[10px] text-muted-foreground italic font-light">No clinical protocol steps defined.</p>
                    </div>
                  )}
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
                  disabled={loading || !formData.names.th || !formData.category || !formData.price_min}
                  className="flex-1 px-6 py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-xs shadow-premium"
                >
                  {loading ? (
                    <>
                      <SpinnerGap className="w-4 h-4 animate-spin" />
                      Mapping...
                    </>
                  ) : (
                    <>
                      <FloppyDisk className="w-4 h-4" />
                      {treatment ? 'Commit Protocol' : 'Authorize Protocol'}
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

