'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, EnvelopeSimple, UserPlus, Shield, SpinnerGap } from '@phosphor-icons/react';
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-background border border-white/10 rounded-3xl p-6 shadow-premium"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/20 border border-primary/20 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Invite New Staff</h3>
                  <p className="text-sm text-muted-foreground">Add a team member to your clinic</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/5 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="Enter staff member's full name"
                  disabled={loading}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="staff@example.com"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  Role & Permissions
                </label>
                <div className="space-y-2">
                  {(Object.keys(roleLabels) as StaffRole[]).map((roleKey) => (
                    <label
                      key={roleKey}
                      className={`block p-4 border rounded-xl cursor-pointer transition-all ${
                        role === roleKey
                          ? 'border-primary/50 bg-primary/5'
                          : 'border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="role"
                          value={roleKey}
                          checked={role === roleKey}
                          onChange={(e) => setRole(e.target.value as StaffRole)}
                          className="mt-1 w-4 h-4 text-primary"
                          disabled={loading}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-primary/60" />
                            <span className="font-medium text-white">
                              {roleLabels[roleKey]}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {roleDescriptions[roleKey]}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-medium hover:bg-white/10 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !email || !fullName}
                  className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Send Invitation
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
