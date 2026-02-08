'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X,
  FirstAidKit,
  Tag,
  CurrencyDollar,
  SpinnerGap,
  FloppyDisk,
  Sparkle,
  Translate,
  ListChecks,
  Plus,
  Trash,
  Clock,
  CaretDown,
  Pulse,
  CheckCircle,
  WarningCircle
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

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
            className="w-full max-w-2xl bg-card border border-border rounded-[32px] p-8 shadow-premium relative z-10 my-8 overflow-hidden group"
          >
            {/* Background Decor */}
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
              <FirstAidKit className="w-64 h-64 text-primary" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-10 relative z-10">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                  <FirstAidKit weight="duotone" className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground tracking-tight">
                    {treatment ? 'Modify Protocol' : 'Authorize Protocol'}
                  </h3>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                    {treatment ? 'Updating existing clinical mapping' : 'Registering new medical excellence node'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all"
              >
                <X weight="bold" className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Names (Thai & English) */}
                <div className="space-y-6 md:col-span-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                      <Translate weight="bold" className="w-3 h-3" /> Designated Name (Thai) *
                    </label>
                    <div className="relative group/input">
                      <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity rounded-2xl" />
                      <input
                        type="text"
                        required
                        value={formData.names.th}
                        onChange={(e) => handleNameChange('th', e.target.value)}
                        className="w-full px-6 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold tracking-tight relative z-10"
                        placeholder="e.g. การฉีดฟิลเลอร์ปรับรูปหน้า"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                      <Translate weight="bold" className="w-3 h-3" /> Designated Name (English)
                    </label>
                    <input
                      type="text"
                      value={formData.names.en}
                      onChange={(e) => handleNameChange('en', e.target.value)}
                      className="w-full px-6 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-medium italic"
                      placeholder="e.g. Facial Contouring Filler"
                    />
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Clinical Category *
                  </label>
                  <div className="relative group/input">
                    <Tag weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors" />
                    <input
                      type="text"
                      name="category"
                      required
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-medium"
                      placeholder="e.g. Laser, Injectable"
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Operational Status
                  </label>
                  <div className="relative group/input">
                    <select
                      name="is_active"
                      value={formData.is_active ? 'true' : 'false'}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.value === 'true' }))}
                      className={cn(
                        "w-full px-5 py-4 bg-secondary/30 border border-border rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all appearance-none font-bold uppercase tracking-widest text-[10px]",
                        formData.is_active ? "text-emerald-500" : "text-rose-500"
                      )}
                    >
                      <option value="true" className="bg-card text-emerald-500">OPERATIONAL (Active)</option>
                      <option value="false" className="bg-card text-rose-500">DEACTIVATED (Offline)</option>
                    </select>
                    <CaretDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
                  </div>
                </div>

                {/* Pricing */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Floor Price (Min) *
                  </label>
                  <div className="relative group/input">
                    <CurrencyDollar weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors" />
                    <input
                      type="number"
                      name="price_min"
                      required
                      value={formData.price_min}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold tabular-nums"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Ceiling Price (Max)
                  </label>
                  <div className="relative group/input">
                    <CurrencyDollar weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors" />
                    <input
                      type="number"
                      name="price_max"
                      value={formData.price_max}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold tabular-nums"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Protocol Section */}
              <div className="space-y-6 pt-6 border-t border-border/50">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <ListChecks weight="duotone" className="w-5 h-5" />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-foreground tracking-tight">Execution Protocols</label>
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Step-by-step clinical mapping</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addProtocolStep}
                    className="gap-2 text-[9px] font-black uppercase tracking-widest px-4 border-primary/20 text-primary hover:bg-primary/5"
                  >
                    <Plus weight="bold" className="w-3 h-3" /> Add Step Node
                  </Button>
                </div>

                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {formData.protocols.map((step, idx) => (
                    <motion.div 
                      key={idx} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-6 bg-secondary/30 border border-border/50 rounded-[24px] space-y-6 relative group/step hover:border-primary/20 transition-all"
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProtocolStep(idx)}
                        className="absolute top-4 right-4 h-8 w-8 p-0 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/5 opacity-0 group-hover/step:opacity-100 transition-all"
                      >
                        <Trash weight="bold" className="w-4 h-4" />
                      </Button>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Step {step.step}: Action Node</label>
                          <input
                            type="text"
                            value={step.action}
                            onChange={(e) => updateProtocolStep(idx, 'action', e.target.value)}
                            className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm font-bold text-foreground focus:outline-none focus:border-primary/50 transition-all shadow-sm"
                            placeholder="เช่น ประคบเย็นเฉพาะจุด"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Temporal Duration</label>
                          <div className="relative">
                            <Clock weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                            <input
                              type="text"
                              value={step.duration}
                              onChange={(e) => updateProtocolStep(idx, 'duration', e.target.value)}
                              className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-sm font-bold text-foreground focus:outline-none focus:border-primary/50 transition-all shadow-sm tabular-nums"
                              placeholder="เช่น 5 นาที"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Execution Directives</label>
                        <textarea
                          value={step.notes}
                          onChange={(e) => updateProtocolStep(idx, 'notes', e.target.value)}
                          rows={2}
                          className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm font-medium text-foreground/70 placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 transition-all resize-none italic leading-relaxed"
                          placeholder="คำแนะนำเฉพาะสำหรับขั้นตอนนี้..."
                        />
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <label className="flex items-center gap-3 cursor-pointer group/crit">
                          <div className="relative flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={step.isCritical}
                              onChange={(e) => updateProtocolStep(idx, 'isCritical', e.target.checked)}
                              className="peer sr-only"
                            />
                            <div className="w-5 h-5 bg-card border border-border rounded transition-all peer-checked:bg-rose-500 peer-checked:border-rose-500 shadow-sm" />
                            <CheckCircle weight="fill" className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                          </div>
                          <span className="text-[10px] font-black text-muted-foreground group-hover/crit:text-rose-500 transition-colors uppercase tracking-widest">Mark as Safety Critical</span>
                        </label>
                        {step.isCritical && (
                          <Badge variant="destructive" size="sm" className="animate-pulse px-3">CRITICAL NODE</Badge>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {formData.protocols.length === 0 && (
                    <div className="py-12 text-center bg-secondary/20 border-2 border-dashed border-border rounded-[32px] flex flex-col items-center gap-3">
                      <ListChecks weight="duotone" className="w-10 h-10 text-muted-foreground/30" />
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">ยังไม่มีขั้นตอนโปรโตคอล</p>
                    </div>
                  )}
                </div>
              </div>

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
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !formData.names.th || !formData.category || !formData.price_min}
                  className="w-full sm:flex-[2] py-6 rounded-[20px] font-black uppercase tracking-widest text-[10px] shadow-premium gap-3"
                >
                  {loading ? (
                    <>
                      <SpinnerGap className="w-5 h-5 animate-spin" />
                      กำลังประมวลผล...
                    </>
                  ) : (
                    <>
                      <CheckCircle weight="bold" className="w-5 h-5" />
                      {treatment ? 'Commit Protocol Updates' : 'Authorize Protocol Node'}
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