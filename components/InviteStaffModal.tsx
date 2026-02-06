'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, EnvelopeSimple, UserPlus, Shield, SpinnerGap, User, CaretDown, CheckCircle, IdentificationBadge, IdentificationCard, Pulse, Briefcase } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface InviteStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type StaffRole = 'clinic_admin' | 'clinic_staff' | 'sales_staff';

export default function InviteStaffModal({ isOpen, onClose, onSuccess }: InviteStaffModalProps) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<StaffRole>('sales_staff');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  const roleLabels: Record<StaffRole, string> = {
    clinic_admin: 'Clinic Administrator',
    clinic_staff: 'Clinic Staff',
    sales_staff: 'Sales Staff'
  };

  const roleDescriptions: Record<StaffRole, string> = {
    clinic_admin: 'Full access to clinic management and settings',
    clinic_staff: 'Access to patient records and treatments',
    sales_staff: 'Access to sales tools and customer analysis'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !fullName) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get current user info to determine clinic_id
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Not authenticated');
      }

      // Get user's profile to get clinic_id
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('clinic_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.clinic_id) {
        throw new Error('Unable to determine clinic association');
      }

      // Create invitation
      const { error: inviteError } = await supabase
        .from('invitations')
        .insert({
          email: email.toLowerCase().trim(),
          role,
          clinic_id: profile.clinic_id,
          invited_by: user.id,
          metadata: {
            full_name: fullName.trim(),
            invited_at: new Date().toISOString()
          }
        });

      if (inviteError) {
        throw inviteError;
      }

      // TODO: Send invitation email (integrate with email service)
      console.log('Invitation created successfully, email would be sent to:', email);

      onSuccess();
      resetForm();
      onClose();
    } catch (error: unknown) {
      console.error('Error creating invitation:', error);
      setError(error instanceof Error ? error.message : 'Failed to send invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setFullName('');
    setRole('sales_staff');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
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
            onClick={handleClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-card border border-border rounded-[40px] p-10 shadow-premium relative z-10 my-8 overflow-hidden group"
          >
            {/* Background Decor */}
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
              <IdentificationBadge className="w-64 h-64 text-primary" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-10 relative z-10">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                  <UserPlus weight="duotone" className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground tracking-tight uppercase">Invite Staff</h2>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Initiate personnel linkage node</p>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={handleClose}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all"
              >
                <X weight="bold" className="w-6 h-6" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
              <div className="space-y-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Personnel Full Name *
                  </label>
                  <div className="relative group/input">
                    <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity rounded-2xl" />
                    <User weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors relative z-10" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold tracking-tight relative z-10 shadow-inner"
                      placeholder="e.g. Sarah Wilson"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Email Designation *
                  </label>
                  <div className="relative group/input">
                    <EnvelopeSimple weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-medium italic"
                      placeholder="identity@node.com"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Role */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Operational Role & Permissions *
                  </label>
                  <div className="space-y-3">
                    {(Object.keys(roleLabels) as StaffRole[]).map((roleKey) => (
                      <label
                        key={roleKey}
                        className={cn(
                          "block p-5 rounded-[24px] border cursor-pointer transition-all duration-500 relative group/role overflow-hidden",
                          role === roleKey
                            ? 'border-primary/50 bg-primary/5 shadow-premium'
                            : 'border-border/50 hover:border-primary/20 bg-secondary/20'
                        )}
                      >
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/role:opacity-100 transition-opacity" />
                        <div className="flex items-start gap-5 relative z-10">
                          <div className="relative flex items-center justify-center mt-1">
                            <input
                              type="radio"
                              name="role"
                              value={roleKey}
                              checked={role === roleKey}
                              onChange={(e) => setRole(e.target.value as StaffRole)}
                              className="peer sr-only"
                              disabled={loading}
                            />
                            <div className="w-6 h-6 bg-card border-2 border-border rounded-full transition-all peer-checked:border-primary peer-checked:bg-primary shadow-inner" />
                            <div className="absolute w-2.5 h-2.5 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Shield weight={role === roleKey ? "fill" : "duotone"} className={cn("w-4 h-4 transition-colors", role === roleKey ? "text-primary" : "text-muted-foreground/60")} />
                              <span className={cn("text-sm font-bold uppercase tracking-tight transition-colors", role === roleKey ? "text-primary" : "text-foreground")}>
                                {roleLabels[roleKey].toUpperCase()}
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1.5 font-medium leading-relaxed italic opacity-80">
                              {roleDescriptions[roleKey]}
                            </p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-[24px] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest text-emerald-500">Transmission Ready</span>
                    <p className="text-[9px] text-muted-foreground font-medium italic mt-0.5 uppercase tracking-widest opacity-60">Identity link pending deployment</p>
                  </div>
                </div>
                <Pulse weight="duotone" className="w-7 h-7 text-emerald-500/40" />
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
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-border/30">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                  className="w-full sm:flex-1 py-7 rounded-[24px] font-black uppercase tracking-widest text-[10px] border-border/50 hover:bg-secondary"
                >
                  Abort
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !email || !fullName}
                  className="w-full sm:flex-[2] py-7 rounded-[24px] font-black uppercase tracking-widest text-[10px] shadow-premium gap-3"
                >
                  {loading ? (
                    <>
                      <SpinnerGap className="w-4 h-4 animate-spin" />
                      Transmitting...
                    </>
                  ) : (
                    <>
                      <EnvelopeSimple weight="bold" className="w-5 h-5" />
                      Send Invitation Node
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