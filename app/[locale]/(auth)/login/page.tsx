'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { motion } from 'framer-motion';
import { Sparkles, Mail, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Get user role from users table
        const { data: userData } = await supabase
          .from('users')
          .select('role, clinic_id')
          .eq('id', data.user.id)
          .single();

        // Check if super_admin
        if (userData?.role === 'super_admin') {
          router.push('/admin');
        } else {
          // For staff, check clinic_staff table for actual role - get first record when multiple exist
          const { data: staffData, error: staffError } = await supabase
            .from('clinic_staff')
            .select('role, clinic_id')
            .eq('user_id', data.user.id)
            .eq('is_active', true)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();

          console.log('Login: Staff data check', { staffData, staffError });

          if (staffData?.role === 'sales_staff') {
            router.push('/th/sales');
          } else if (['clinic_owner', 'clinic_admin', 'clinic_staff'].includes(staffData?.role || '')) {
            router.push('/th/clinic');
          } else {
            // Customer or free user - redirect to customer dashboard
            console.log('Login: No staff role found, redirecting to customer');
            router.push('/th/customer');
          }
        }
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6 overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <div className="glass-card p-8 rounded-3xl space-y-8 border border-white/10 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-display font-bold text-white">{t('welcome_back')}</h1>
            <p className="text-muted-foreground font-light text-sm">{t('enter_details')}</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-sm text-red-400">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70 ml-1">{t('email')}</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@clinic.com"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-sm font-medium text-white/70">{t('password')}</label>
                  <button type="button" className="text-xs text-primary hover:underline font-light">
                    {t('forgot_password')}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.99 }}
              className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold shadow-premium transition-all hover:brightness-110 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังเข้าสู่ระบบ...</span>
                </>
              ) : (
                <>
                  <span>{t('signin')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          <div className="text-center">
            <p className="text-sm text-muted-foreground font-light">
              {t('no_account')}{' '}
              <Link href="/register" className="text-primary font-medium hover:underline">
                {t('signup_now')}
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
