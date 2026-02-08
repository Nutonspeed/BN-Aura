'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkle, 
  ShieldCheck, 
  CheckCircle, 
  MapPin, 
  Phone, 
  ArrowRight,
  SpinnerGap,
  Lightning,
  CalendarDots
} from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface ProposalItem {
  name: string;
  price: number;
  sessions: number;
}

interface Clinic {
  id: string;
  display_name: {
    en: string;
    th: string;
  };
  address?: string;
  phone?: string;
}

interface Proposal {
  id: string;
  title: string;
  total_value: number;
  created_at: string;
  lead: {
    name: string;
    email: string;
    phone?: string;
  };
  treatments: ProposalItem[];
  clinic: Clinic;
}

export default function ProposalPreviewPage() {
  const params = useParams();
  const proposalId = params.id as string;

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function fetchProposalData() {
      if (!proposalId) return;

      try {
        const { data: propData, error: propError } = await supabase
          .from('sales_proposals')
          .select(`
            *,
            lead:lead_id (name, email, phone),
            clinic:clinic_id (*)
          `)
          .eq('id', proposalId)
          .single();

        if (propError) throw propError;
        setProposal(propData as unknown as Proposal);
        setClinic(propData.clinic);
      } catch (err) {
        console.error('Error fetching proposal:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProposalData();
  }, [proposalId, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <SpinnerGap className="w-12 h-12 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse font-display uppercase tracking-widest text-xs">กำลังเตรียมแผนความงามส่วนตัวของคุณ...</p>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-20 h-20 rounded-3xl bg-rose-500/10 flex items-center justify-center text-rose-500 mb-4">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-white">ไม่พบข้อเสนอ</h1>
        <p className="text-muted-foreground max-w-xs font-light text-sm">ข้อเสนอที่คุณกำลังค้นหาไม่มีอยู่หรือหมดอายุแล้ว กรุณาติดต่อคลินิกของคุณ</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-foreground overflow-x-hidden relative pb-32 font-sans">
      {/* Background Ambience */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_-20%,_rgba(var(--primary),0.15),transparent_70%)] pointer-events-none" />
      <div className="fixed inset-0 bg-grain opacity-[0.03] pointer-events-none" />

      {/* Hero Header */}
      <header className="relative z-10 px-8 pt-20 pb-32 text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="mx-auto w-20 h-20 rounded-3xl bg-primary/20 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_30px_rgba(var(--primary),0.2)] backdrop-blur-xl"
        >
          <Sparkle className="w-10 h-10 animate-glow-pulse" />
        </motion.div>
        
        <div className="space-y-4">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-7xl font-heading font-black text-white tracking-tighter uppercase italic"
          >
            {proposal.title}
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="px-5 py-2 bg-white/5 border border-white/10 rounded-full flex items-center gap-3 backdrop-blur-md shadow-lg">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.4)]" />
              <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">รับรองเฉพาะสำหรับ {proposal.lead?.name}</span>
            </div>
            <p className="text-[9px] text-muted-foreground uppercase tracking-[0.5em] font-bold">รอบการวินิจฉัยประสาท 2026.4</p>
          </motion.div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-8 space-y-16 relative z-10">
        {/* Clinic Info Card */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-premium p-10 rounded-[60px] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-10 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          
          <div className="flex items-center gap-8 relative z-10">
            <div className="w-24 h-24 rounded-[32px] bg-primary flex items-center justify-center text-primary-foreground shadow-premium relative group-hover:scale-105 transition-transform duration-500">
              <span className="text-3xl font-black font-heading uppercase italic">BN</span>
              <div className="absolute -inset-2 bg-primary/20 blur-xl rounded-full z-[-1] animate-glow-pulse" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">{clinic?.display_name?.en || 'Bangkok Premium'}</h2>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium uppercase tracking-widest">
                  <MapPin className="w-4 h-4 text-primary/60" /> 
                  Aesthetic Excellence Hub, Bangkok
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium uppercase tracking-widest">
                  <Phone className="w-4 h-4 text-primary/60" /> 
                  {clinic?.phone || '02-123-4567'}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-3 border-t md:border-t-0 md:border-l border-white/10 pt-8 md:pt-0 md:pl-12 relative z-10">
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.3em]">Valuation Period</p>
            <div className="text-right">
              <p className="text-2xl font-black text-white tracking-tighter tabular-nums">FEB 28, 2026</p>
              <p className="text-[9px] text-primary font-bold uppercase tracking-widest mt-1">Proposal Secure Locked</p>
            </div>
          </div>
        </motion.section>

        {/* Treatment Recommendations */}
        <section className="space-y-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-center gap-4 text-primary"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-premium">
              <Lightning className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white uppercase tracking-tight font-heading">Neural <span className="text-primary">Optimized</span> Protocols</h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Synchronized Treatment Architecture</p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 gap-6">
            {proposal.treatments?.map((item: ProposalItem, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + (i * 0.1) }}
                whileHover={{ x: 10, scale: 1.01 }}
                className="glass-premium p-8 rounded-[48px] border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-10 group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/0 group-hover:bg-primary transition-all duration-500" />
                
                <div className="flex items-center gap-8">
                  <div className="w-16 h-16 rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-lg">
                    <CheckCircle className="w-8 h-8 stroke-[2.5px]" />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-xl font-black text-white group-hover:text-primary transition-colors tracking-tight uppercase">{item.name}</h4>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{item.sessions} Cycle ครั้ง</span>
                      <div className="w-1 h-1 rounded-full bg-white/10" />
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest">Clinical Grade</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right space-y-1 min-w-[150px]">
                  <p className="text-3xl font-black text-white group-hover:text-emerald-400 transition-colors tracking-tighter tabular-nums">฿{Number(item.price).toLocaleString()}</p>
                  <p className="text-[9px] text-muted-foreground uppercase font-black tracking-[0.3em]">Projected การลงทุน</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Total Summary */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="p-12 rounded-[60px] bg-primary text-primary-foreground shadow-[0_0_60px_rgba(var(--primary),0.3)] flex flex-col lg:flex-row items-center justify-between gap-12 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out italic" />
          <div className="space-y-2 text-center lg:text-left relative z-10">
            <p className="text-[11px] uppercase font-black tracking-[0.4em] opacity-60">Consolidated Transformation Value</p>
            <h2 className="text-6xl font-heading font-black tracking-tighter tabular-nums">฿{Number(proposal.total_value).toLocaleString()}</h2>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full lg:w-auto px-12 py-6 bg-black text-white rounded-[28px] font-black uppercase tracking-[0.3em] text-xs shadow-2xl transition-all flex items-center justify-center gap-4 group/btn relative z-10"
          >
            Authorize Transformation
            <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform stroke-[3px]" />
          </motion.button>
        </motion.section>

        {/* Benefits Footer */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-10 pt-20 border-t border-white/5">
          {[
            { icon: ShieldCheck, title: "Clinical Security", desc: "Highest enterprise medical standards applied to all neural data nodes.", color: "text-primary" },
            { icon: Sparkle, title: "AI Calibration", desc: "Results synthesized via Gemini 2.5 Pro optimized for your unique profile.", color: "text-emerald-400" },
            { icon: CalendarDots, title: "Priority Protocol", desc: "Guaranteed access to premium treatment windows and clinical specialist.", color: "text-amber-400" }
          ].map((benefit, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 + (i * 0.1) }}
              className="flex flex-col items-center text-center space-y-5 p-6 group hover:bg-white/[0.02] rounded-[32px] transition-all"
            >
              <div className={cn("w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform shadow-lg", benefit.color)}>
                <benefit.icon className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-black text-white uppercase tracking-[0.3em]">{benefit.title}</h4>
                <p className="text-[11px] text-muted-foreground font-light leading-relaxed max-w-[200px] mx-auto italic">{benefit.desc}</p>
              </div>
            </motion.div>
          ))}
        </section>
      </div>

      {/* Bottom Floating Bar (Mobile) */}
      <AnimatePresence>
        <div className="fixed bottom-8 left-8 right-8 z-[100] md:hidden">
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-black/60 backdrop-blur-2xl border border-white/10 p-4 rounded-[32px] flex items-center justify-between shadow-[0_0_40px_rgba(0,0,0,0.5)]"
          >
            <div className="pl-4 space-y-0.5">
              <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">มูลค่ารวม</p>
              <p className="text-xl font-black text-white tracking-tighter">฿{Number(proposal.total_value).toLocaleString()}</p>
            </div>
            <button className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black text-[10px] shadow-premium uppercase tracking-[0.2em] hover:brightness-110 active:scale-95 transition-all">
              AUTHORIZE
            </button>
          </motion.div>
        </div>
      </AnimatePresence>

      <footer className="mt-32 py-12 text-center border-t border-white/5 bg-background/40 backdrop-blur-md relative z-10">
        <div className="flex items-center justify-center gap-4 text-muted-foreground mb-6 opacity-40">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[9px] uppercase font-black tracking-[0.4em]">Secure Dermal Infrastructure • BN-Aura © 2026</span>
        </div>
        <p className="text-[8px] text-white/10 font-bold text-center uppercase tracking-[0.5em] max-w-3xl mx-auto px-8 leading-relaxed">
          ALL CALCULATIONS ARE PERFORMED VIA NEURAL CLUSTERS. RESULTS MUST BE VALIDATED BY QUALIFIED CLINICAL PERSONNEL BEFORE EXECUTION.
        </p>
      </footer>
    </main>
  );
}
