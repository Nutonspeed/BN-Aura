'use client';

import { 
  X,
  User,
  EnvelopeSimple,
  Phone,
  CalendarDots,
  MapPin,
  Tag,
  SpinnerGap,
  FloppyDisk,
  IdentificationCard,
  GenderIntersex,
  Megaphone,
  CheckCircle,
  CaretDown
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customer?: any; // If provided, we're in edit mode
}

export default function CustomerModal({ isOpen, onClose, onSuccess, customer }: CustomerModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    nickname: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: 'other',
    address: {},
    customer_type: 'regular',
    source: 'walk_in',
    notes: ''
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        full_name: customer.full_name || '',
        nickname: customer.nickname || '',
        email: customer.email || '',
        phone: customer.phone || '',
        date_of_birth: customer.date_of_birth || '',
        gender: customer.gender || 'other',
        address: customer.address || {},
        customer_type: customer.customer_type || 'regular',
        source: customer.source || 'walk_in',
        notes: customer.notes || ''
      });
    } else {
      setFormData({
        full_name: '',
        nickname: '',
        email: '',
        phone: '',
        date_of_birth: '',
        gender: 'other',
        address: {},
        customer_type: 'regular',
        source: 'walk_in',
        notes: ''
      });
    }
  }, [customer, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = customer ? `/api/sales/customers/${customer.id}` : '/api/sales/customers';
      const method = customer ? 'PATCH' : 'POST';

      // Clean form data - remove empty date
      const submitData = { ...formData };
      if (!submitData.date_of_birth) {
        const { date_of_birth, ...cleanData } = submitData;
        Object.assign(submitData, cleanData);
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error?.message || 'Failed to save customer');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error saving customer:', err);
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
            className="w-full max-w-2xl bg-card border border-border rounded-[40px] p-10 shadow-premium relative z-10 my-8 overflow-hidden group"
          >
            {/* Background Decor */}
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
              <IdentificationCard className="w-64 h-64 text-primary" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-10 relative z-10">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                  <User weight="duotone" className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground tracking-tight uppercase">
                    {customer ? 'Modify Patient' : 'Initialize Patient'}
                  </h3>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                    {customer ? 'Updating existing cutaneous identity' : 'Initializing new clinical record node'}
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
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Full Identity Designation *
                  </label>
                  <div className="relative group/input">
                    <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity rounded-2xl" />
                    <User weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors relative z-10" />
                    <input
                      type="text"
                      name="full_name"
                      required
                      value={formData.full_name}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold tracking-tight relative z-10 shadow-inner"
                      placeholder="Neural ID Name"
                    />
                  </div>
                </div>

                {/* Nickname */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Alias / Protocol Name
                  </label>
                  <input
                    type="text"
                    name="nickname"
                    value={formData.nickname}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold uppercase text-xs tracking-widest"
                    placeholder="Short Identifier"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Digital Mail Node
                  </label>
                  <div className="relative group/input">
                    <EnvelopeSimple weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-medium italic"
                      placeholder="address@network.com"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Comm Node (Phone)
                  </label>
                  <div className="relative group/input">
                    <Phone weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold tabular-nums"
                      placeholder="+66 00-000-0000"
                    />
                  </div>
                </div>

                {/* Date of Birth */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Temporal Origin (DOB)
                  </label>
                  <div className="relative group/input">
                    <CalendarDots weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors" />
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold tabular-nums"
                    />
                  </div>
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Biological Profile
                  </label>
                  <div className="relative group/input">
                    <GenderIntersex weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors" />
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all appearance-none font-bold uppercase text-xs tracking-widest"
                    >
                      <option value="male" className="bg-card">MALE</option>
                      <option value="female" className="bg-card">FEMALE</option>
                      <option value="other" className="bg-card">OTHER / UNKNOWN</option>
                    </select>
                    <CaretDown weight="bold" className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
                  </div>
                </div>

                {/* Customer Type */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Operational Tier
                  </label>
                  <div className="relative group/input">
                    <Tag weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors" />
                    <select
                      name="customer_type"
                      value={formData.customer_type}
                      onChange={handleInputChange}
                      className={cn(
                        "w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all appearance-none font-bold uppercase tracking-widest text-[10px]",
                        formData.customer_type === 'vip' ? "text-amber-500" : 
                        formData.customer_type === 'premium' ? "text-primary" : "text-foreground"
                      )}
                    >
                      <option value="regular" className="bg-card">REGULAR NODE</option>
                      <option value="premium" className="bg-card">PREMIUM NODE</option>
                      <option value="vip" className="bg-card">VIP ARCHIVE</option>
                    </select>
                    <CaretDown weight="bold" className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
                  </div>
                </div>

                {/* Source */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Acquisition Vector
                  </label>
                  <div className="relative group/input">
                    <Megaphone weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors" />
                    <select
                      name="source"
                      value={formData.source}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all appearance-none font-bold uppercase text-[10px] tracking-widest"
                    >
                      <option value="walk_in" className="bg-card">WALK-IN NODE</option>
                      <option value="social_media" className="bg-card">SOCIAL MATRIX</option>
                      <option value="referral" className="bg-card">IDENTITY LINK</option>
                      <option value="advertisement" className="bg-card">CAMPAIGN SIGNAL</option>
                    </select>
                    <CaretDown weight="bold" className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
                  </div>
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
                  className="w-full px-6 py-4 bg-secondary/30 border border-border rounded-[24px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all resize-none font-medium leading-relaxed italic shadow-inner"
                  placeholder="Additional patient telemetry and clinical context..."
                />
              </div>

              {/* Error Protocol */}
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

              {/* Action Selection */}
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
                  disabled={loading || !formData.full_name}
                  className="w-full sm:flex-[2] py-7 rounded-[20px] font-black uppercase tracking-widest text-[10px] shadow-premium gap-3"
                >
                  {loading ? (
                    <>
                      <SpinnerGap className="w-4 h-4 animate-spin" />
                      Synchronizing...
                    </>
                  ) : (
                    <>
                      <CheckCircle weight="bold" className="w-5 h-5" />
                      {customer ? 'Commit Updates' : 'Initialize Identity'}
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