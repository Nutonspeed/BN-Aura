'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, Check, Fingerprint } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

export default function PDPAModal() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [agreed, setAgreed] = useState({ terms: false, privacy: false, marketing: false });

  const isAuthPage = pathname?.includes('/login') || pathname?.includes('/auth');

  useEffect(() => {
    if (isAuthPage) return;
    const hasAgreed = localStorage.getItem('pdpa_agreed');
    if (!hasAgreed) setIsOpen(true);
  }, [isAuthPage]);

  const saveConsent = useCallback(async (consents: Record<string, boolean>) => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        await fetch('/api/consent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
          body: JSON.stringify({ action: 'record', consents })
        });
      }
    } catch (e) { console.warn('Failed to save consent to DB:', e); }
    finally { setSaving(false); }
    localStorage.setItem('pdpa_agreed', 'true');
    localStorage.setItem('pdpa_timestamp', new Date().toISOString());
    localStorage.setItem('pdpa_consents', JSON.stringify(consents));
    setIsOpen(false);
  }, []);

  const handleAgreeAll = () => {
    const all = { terms: true, privacy: true, marketing: true };
    setAgreed(all);
    saveConsent(all);
  };

  const handleSaveSelected = () => saveConsent(agreed);

  const consentItems = [
    { id: 'terms', label: 'Terms of Service', desc: 'I agree to the clinical service terms and data processing protocols', required: true },
    { id: 'privacy', label: 'Privacy Policy', desc: 'I accept the data storage, encryption, and clinical identity architecture', required: true },
    { id: 'marketing', label: 'Marketing Communications', desc: 'Allow personalized beauty insights and protocol updates via digital channels', required: false },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-md" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl bg-card border border-border rounded-[40px] overflow-hidden shadow-premium group">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
              <ShieldCheck className="w-64 h-64 text-primary" />
            </div>
            <div className="p-10 md:p-14 space-y-10 relative z-10">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                  <ShieldCheck weight="duotone" className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-3xl font-heading font-bold text-foreground tracking-tight">Privacy Architecture</h2>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-black mt-1">PDPA COMPLIANCE PROTOCOL</p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="p-6 bg-secondary/30 rounded-[32px] border border-border/50 relative overflow-hidden">
                  <div className="flex items-start gap-5">
                    <div className="mt-1 p-2.5 bg-primary/10 rounded-xl border border-primary/20">
                      <Lock weight="bold" className="w-5 h-5 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Data Integrity Commitment</h3>
                      <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                        BN-Aura processes your data in compliance with Thailand Personal Data Protection Act (PDPA). Your clinical data is encrypted and stored securely. You can withdraw consent or request data deletion at any time.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {consentItems.map((item) => (
                    <button key={item.id} onClick={() => setAgreed(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof agreed] }))} className={cn(
                      'w-full p-5 rounded-[24px] border transition-all duration-300 flex items-center justify-between group/item',
                      agreed[item.id as keyof typeof agreed] ? 'bg-primary/5 border-primary/30 shadow-sm' : 'bg-secondary/30 border-border/50 hover:bg-secondary/50'
                    )}>
                      <div className="flex flex-col text-left space-y-0.5">
                        <span className={cn('text-xs font-bold uppercase tracking-widest transition-colors', agreed[item.id as keyof typeof agreed] ? 'text-primary' : 'text-foreground/80')}>
                          {item.label}{item.required && <span className="text-red-400 ml-1">*</span>}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium italic opacity-60">{item.desc}</span>
                      </div>
                      <div className={cn('w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-500', agreed[item.id as keyof typeof agreed] ? 'bg-primary border-primary shadow-glow-sm scale-110' : 'border-border bg-card group-hover/item:border-primary/30')}>
                        {agreed[item.id as keyof typeof agreed] && <Check weight="bold" className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 pt-6">
                <Button onClick={handleAgreeAll} disabled={saving} className="flex-1 py-7 rounded-[24px] shadow-premium group/btn overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                  <span className="relative z-10 text-[11px] font-black uppercase tracking-[0.2em]">{saving ? 'Saving...' : 'Accept All & Continue'}</span>
                </Button>
                <Button variant="outline" onClick={handleSaveSelected} disabled={!agreed.terms || !agreed.privacy || saving} className="px-10 py-7 rounded-[24px] text-[11px] font-black uppercase tracking-widest border-border/50 hover:bg-secondary transition-all disabled:opacity-20">
                  Save Selection
                </Button>
              </div>

              <div className="flex items-center justify-center gap-4 pt-4 border-t border-border/50">
                <Badge variant="ghost" size="sm" className="font-mono text-[8px] tracking-[0.2em] opacity-40">ISO 27001 SECURE</Badge>
                <div className="w-1 h-1 rounded-full bg-border" />
                <Badge variant="ghost" size="sm" className="font-mono text-[8px] tracking-[0.2em] opacity-40">PDPA 2025 COMPLIANT</Badge>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
