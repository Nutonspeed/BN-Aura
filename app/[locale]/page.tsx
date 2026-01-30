'use client';

import {useTranslations} from 'next-intl';
import {motion} from 'framer-motion';
import {Sparkles, ShieldCheck, Zap} from 'lucide-react';

export default function Home() {
  const t = useTranslations('common');
  const authT = useTranslations('auth');

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-glow-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] animate-glow-pulse delay-700" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="z-10 text-center space-y-8 max-w-4xl"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-primary text-sm font-medium backdrop-blur-md">
          <Sparkles className="w-4 h-4" />
          <span>Next-gen Aesthetic Intelligence</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight text-white leading-tight">
          {t('title')}
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-sans font-light">
          {t('description')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold shadow-premium transition-all hover:brightness-110"
          >
            {authT('login')}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full sm:w-auto px-8 py-4 bg-white/5 text-white rounded-xl font-semibold border border-white/10 backdrop-blur-xl transition-all hover:bg-white/10"
          >
            {authT('register')}
          </motion.button>
        </div>
      </motion.div>

      {/* Feature Preview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 z-10 w-full max-w-5xl">
        {[
          { icon: Sparkles, title: "AI Skin Analysis", desc: "468-point facial mapping via Gemini 1.5" },
          { icon: Zap, title: "AR Simulator", desc: "Real-time Botox & Filler visualization" },
          { icon: ShieldCheck, title: "Enterprise CRM", desc: "Strict Multi-tenant RLS Security" }
        ].map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + (i * 0.1) }}
            className="glass-card p-6 rounded-2xl space-y-4 text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <feature.icon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
            <p className="text-muted-foreground text-sm font-light leading-relaxed">
              {feature.desc}
            </p>
          </motion.div>
        ))}
      </div>

      <footer className="absolute bottom-8 text-white/20 text-xs font-light tracking-widest uppercase">
        &copy; 2026 BN-AURA AI SUITE. ALL RIGHTS RESERVED.
      </footer>
    </main>
  );
}
