'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Sparkles, Mail, Lock, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/routing';

export default function LoginPage() {
  const t = useTranslations('auth');

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

          <form className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70 ml-1">{t('email')}</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="email"
                    placeholder="name@clinic.com"
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
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold shadow-premium transition-all hover:brightness-110 flex items-center justify-center gap-2"
            >
              <span>{t('signin')}</span>
              <ArrowRight className="w-4 h-4" />
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
