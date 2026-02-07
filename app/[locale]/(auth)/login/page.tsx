'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { motion } from 'framer-motion';
import { 
  Envelope,
  Lock,
  ArrowRight,
  SpinnerGap,
  WarningCircle,
  Sparkle
} from '@phosphor-icons/react';
import { Link } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function LoginPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'th';
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
        console.log('Login: Auth successful, routing...');
        setLoading(false);
        try {
          const [staffResult, userResult] = await Promise.all([
            supabase.from('clinic_staff').select('role, clinic_id').eq('user_id', data.user.id).eq('is_active', true).order('created_at', { ascending: true }).limit(1).maybeSingle(),
            supabase.from('users').select('role').eq('id', data.user.id).maybeSingle()
          ]);
          const staffData = staffResult.data;
          const userData = userResult.data;
          console.log('Login: Roles:', { staff: staffData?.role, user: userData?.role });
          let target = '/customer';
          if (userData?.role === 'super_admin') { target = '/admin'; }
          else if (staffData?.role === 'sales_staff') { target = '/sales'; }
          else if (staffData?.role === 'beautician') { target = '/beautician'; }
          else if (['clinic_owner', 'clinic_admin', 'clinic_staff'].includes(staffData?.role || '')) { target = '/clinic'; }
          console.log('Login: Redirecting to', '/' + locale + target);
          window.location.href = '/' + locale + target;
        } catch (routeError) {
          console.error('Login: Route error:', routeError);
          window.location.href = '/' + locale + '/customer';
        }
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex bg-background">
      {/* Theme Toggle - Top Right */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Left Side - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent" />
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                <Sparkle weight="fill" className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">BN-Aura</span>
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
              Premium Aesthetic<br />Intelligence Platform
            </h1>
            <p className="text-lg text-white/60 max-w-md">
              ระบบจัดการคลินิกความงามครบวงจร ด้วย AI วิเคราะห์ผิวและระบบบริหารลูกค้าระดับ Enterprise
            </p>
          </motion.div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Sparkle weight="fill" className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">BN-Aura</span>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">{t('welcome_back')}</h2>
              <p className="text-muted-foreground mt-1">{t('enter_details')}</p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3"
              >
                <WarningCircle weight="fill" className="w-5 h-5 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t('email')}</label>
                  <div className="relative">
                    <Envelope className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@clinic.com"
                      required
                      className="w-full bg-background border border-border rounded-xl py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-foreground">{t('password')}</label>
                    <button type="button" className="text-sm text-primary hover:underline">
                      {t('forgot_password')}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-background border border-border rounded-xl py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <SpinnerGap className="w-5 h-5 animate-spin" />
                    <span>กำลังเข้าสู่ระบบ...</span>
                  </>
                ) : (
                  <>
                    <span>{t('signin')}</span>
                    <ArrowRight weight="bold" className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </form>

            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                ยังไม่มีบัญชีใช่ไหม?{' '}
                <span className="text-foreground/70">ติดต่อผู้ดูแลเพื่อรับคำเชิญ</span>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
