'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  CheckCircle,
  XCircle,
  SpinnerGap,
  Key,
  User,
  Sparkle,
  ArrowLeft
} from '@phosphor-icons/react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import Link from 'next/link';

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [invitation, setInvitation] = useState<{
    email: string;
    role: string;
    clinic_name: string;
  } | null>(null);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    if (!token) {
      setError('No invitation token provided');
      setLoading(false);
      return;
    }

    // Validate token
    fetch(`/api/auth/accept-invitation?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setInvitation(data.data);
        } else {
          setError(data.error);
        }
      })
      .catch(() => setError('Failed to validate invitation'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/accept-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, full_name: fullName })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error);
      }
    } catch {
      setError('Failed to accept invitation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <SpinnerGap className="w-10 h-10 animate-spin text-primary" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em] animate-pulse">Validating Invitation Node...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-card border border-border rounded-[32px] shadow-premium p-10 max-w-md w-full text-center relative z-10"
        >
          <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle weight="fill" className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">Welcome Aboard!</h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Your clinical identity has been verified and registered. You may now access the neural network.
          </p>
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center px-8 py-4 bg-primary text-white rounded-2xl font-bold uppercase tracking-widest shadow-premium hover:brightness-110 transition-all active:scale-95"
          >
            Access Dashboard
          </Link>
        </motion.div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-card border border-border rounded-[32px] shadow-premium p-10 max-w-md w-full text-center relative z-10"
        >
          <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <XCircle weight="fill" className="w-10 h-10 text-rose-500" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">Invalid Link</h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            The invitation node you are trying to access is either expired or invalid.
          </p>
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center px-8 py-4 bg-secondary text-foreground border border-border rounded-2xl font-bold uppercase tracking-widest hover:bg-accent transition-all active:scale-95"
          >
            Back to Login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex bg-background relative overflow-hidden">
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Left Side - Visual Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent" />
        <div className="relative z-10 flex flex-col justify-center px-20">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-premium">
                <Sparkle weight="fill" className="w-8 h-8 text-white" />
              </div>
              <span className="text-3xl font-bold text-white tracking-tight">BN-Aura</span>
            </div>
            <h1 className="text-5xl font-bold text-white leading-tight mb-6">
              Establish Your<br />
              <span className="text-primary-foreground/80">Professional Identity</span>
            </h1>
            <p className="text-xl text-white/60 max-w-md leading-relaxed">
              Join the elite aesthetic network. Complete your registration to begin managing your clinical workflow.
            </p>
          </motion.div>
        </div>
        
        {/* Decor */}
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/4 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-premium">
              <Sparkle weight="fill" className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-foreground">BN-Aura</span>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground tracking-tight">Accept Invitation</h2>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                You've been invited to join <span className="text-primary font-bold">{invitation?.clinic_name}</span> as a <span className="text-foreground font-bold capitalize">{invitation?.role?.replace('_', ' ')}</span>.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Assigned Email</label>
                  <input
                    type="email"
                    value={invitation?.email || ''}
                    disabled
                    className="w-full px-5 py-4 border border-border rounded-2xl bg-secondary/50 text-muted-foreground font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-2xl" />
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full pl-12 pr-5 py-4 border border-border rounded-2xl bg-secondary/30 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-foreground font-medium relative z-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Create Password</label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-2xl" />
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="w-full pl-12 pr-5 py-4 border border-border rounded-2xl bg-secondary/30 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-foreground font-medium relative z-10"
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Confirm Password</label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-2xl" />
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your password"
                      className="w-full pl-12 pr-5 py-4 border border-border rounded-2xl bg-secondary/30 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-foreground font-medium relative z-10"
                      required
                      minLength={8}
                    />
                  </div>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3"
                >
                  <XCircle weight="fill" className="w-5 h-5 text-rose-500" />
                  <p className="text-sm text-rose-500 font-bold">{error}</p>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4.5 bg-primary text-white rounded-2xl font-bold uppercase tracking-[0.2em] shadow-premium hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-xs"
              >
                {submitting ? (
                  <>
                    <SpinnerGap className="w-5 h-5 animate-spin" />
                    <span>Synchronizing...</span>
                  </>
                ) : (
                  <>
                    <span>Initialize Account</span>
                  </>
                )}
              </button>
            </form>

            <div className="text-center">
              <Link href="/login" className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest flex items-center justify-center gap-2">
                <ArrowLeft className="w-3.5 h-3.5" /> Return to access point
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
      <AcceptInvitationContent />
    </Suspense>
  );
}
