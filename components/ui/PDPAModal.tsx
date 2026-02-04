'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, Check } from '@phosphor-icons/react';

export default function PDPAModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [agreed, setAgreed] = useState({
    terms: false,
    privacy: false,
    marketing: false
  });

  useEffect(() => {
    const hasAgreed = localStorage.getItem('pdpa_agreed');
    if (!hasAgreed) {
      setIsOpen(true);
    }
  }, []);

  const handleAgreeAll = () => {
    setAgreed({ terms: true, privacy: true, marketing: true });
    saveAgreement();
  };

  const saveAgreement = () => {
    localStorage.setItem('pdpa_agreed', 'true');
    localStorage.setItem('pdpa_timestamp', new Date().toISOString());
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl glass-premium rounded-[40px] overflow-hidden"
          >
            <div className="p-8 md:p-12 space-y-8">
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">Data Privacy & Protection</h2>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">PDPA Compliance Protocol</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 p-2 bg-primary/10 rounded-lg">
                      <Lock className="w-4 h-4 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Our Commitment to Your Privacy</h3>
                      <p className="text-xs text-muted-foreground font-light leading-relaxed">
                        BN-Aura uses advanced AI encryption to secure your clinical data. By continuing, you agree to our processing of your aesthetic data for personalized treatment recommendations.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { id: 'terms', label: 'Terms of Service', desc: 'I agree to the BN-Aura terms of usage and AI processing.' },
                    { id: 'privacy', label: 'Privacy Policy', desc: 'I accept how my personal and clinical data is stored.' },
                    { id: 'marketing', label: 'Marketing Communications', desc: 'Send me personalized aesthetic offers and skin tips.' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setAgreed(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof agreed] }))}
                      className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between group hover:bg-white/10 transition-all"
                    >
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-white uppercase tracking-widest">{item.label}</span>
                        <span className="text-[10px] text-muted-foreground font-light">{item.desc}</span>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        agreed[item.id as keyof typeof agreed] 
                          ? 'bg-primary border-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]' 
                          : 'border-white/20'
                      }`}>
                        {agreed[item.id as keyof typeof agreed] && <Check className="w-3 h-3 text-primary-foreground stroke-[4px]" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 pt-4">
                <button
                  onClick={handleAgreeAll}
                  className="flex-1 py-4 bg-primary text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-premium hover:brightness-110 active:scale-95 transition-all"
                >
                  Accept & Initialize Suite
                </button>
                <button
                  onClick={saveAgreement}
                  disabled={!agreed.terms || !agreed.privacy}
                  className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] text-white hover:bg-white/10 active:scale-95 transition-all disabled:opacity-30 disabled:active:scale-100"
                >
                  Save Selection
                </button>
              </div>

              <p className="text-[9px] text-center text-muted-foreground uppercase tracking-widest font-medium">
                ISO 27001 Certified Infrastructure & PDPA 2025 Standard
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
