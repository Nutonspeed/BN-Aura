'use client';

import { motion } from 'framer-motion';
import { 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  ArrowRight,
  Loader2,
  Zap,
  Calendar
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

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
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse font-display uppercase tracking-widest text-xs">Preparing your personal aura plan...</p>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-20 h-20 rounded-3xl bg-rose-500/10 flex items-center justify-center text-rose-500 mb-4">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-white">Proposal Not Found</h1>
        <p className="text-muted-foreground max-w-xs font-light text-sm">The proposal you are looking for does not exist or has expired. Please contact your clinic.</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#020617] text-foreground overflow-x-hidden relative pb-20 font-sans">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-60 pointer-events-none" />

      {/* Hero Header */}
      <header className="relative z-10 px-6 pt-12 pb-24 text-center space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary shadow-2xl backdrop-blur-xl"
        >
          <Sparkles className="w-8 h-8" />
        </motion.div>
        
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white tracking-tight uppercase">
            {proposal.title}
          </h1>
          <p className="text-muted-foreground font-light tracking-wide uppercase text-xs flex items-center justify-center gap-2">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            Exclusively prepared for {proposal.lead?.name}
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 space-y-12 relative z-10">
        {/* Clinic Info Card */}
        <motion.section
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-8 rounded-[40px] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-8"
        >
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center text-primary-foreground shadow-premium">
              <span className="text-2xl font-bold font-heading uppercase">BN</span>
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">{clinic?.display_name?.en || 'Clinic Name'}</h2>
              <div className="flex flex-col text-sm text-muted-foreground font-light">
                <span className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> Bangkok, Thailand</span>
                <span className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {clinic?.phone || '02-123-4567'}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-8">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Valid Until</p>
            <p className="text-lg font-bold text-white">Feb 28, 2026</p>
          </div>
        </motion.section>

        {/* Treatment Recommendations */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 text-primary">
            <Zap className="w-5 h-5" />
            <h3 className="text-xl font-bold text-white uppercase tracking-tight font-heading">Recommended Treatments</h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {proposal.treatments?.map((item: ProposalItem, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + (i * 0.1) }}
                className="glass-card p-6 rounded-3xl border border-white/10 flex items-center justify-between group hover:bg-white/[0.03] transition-all"
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">{item.name}</h4>
                    <p className="text-sm text-muted-foreground font-light">{item.sessions} Session(s) Plan</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">฿{Number(item.price).toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Investment</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Total Summary */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="p-8 rounded-[40px] bg-primary text-primary-foreground shadow-[0_0_50px_rgba(59,130,246,0.3)] flex flex-col md:flex-row items-center justify-between gap-8"
        >
          <div className="space-y-1 text-center md:text-left">
            <p className="text-[10px] uppercase font-bold tracking-widest opacity-70">Estimated Total Investment</p>
            <h2 className="text-4xl font-heading font-bold">฿{Number(proposal.total_value).toLocaleString()}</h2>
          </div>
          <button className="w-full md:w-auto px-10 py-5 bg-[#020617] text-white rounded-2xl font-bold shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 group">
            <span className="uppercase tracking-widest text-sm">Confirm & Book Now</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.section>

        {/* Benefits Footer */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 border-t border-white/5">
          {[
            { icon: ShieldCheck, title: "Clinical Safety", desc: "Highest medical standards applied." },
            { icon: Sparkles, title: "AI Calibration", desc: "Results tailored to your skin scan." },
            { icon: Calendar, title: "Priority Booking", desc: "Access to premium slots instantly." }
          ].map((benefit, i) => (
            <div key={i} className="flex flex-col items-center text-center space-y-3 p-4">
              <benefit.icon className="w-6 h-6 text-primary/60" />
              <h4 className="text-sm font-bold text-white uppercase tracking-widest">{benefit.title}</h4>
              <p className="text-xs text-muted-foreground font-light leading-relaxed">{benefit.desc}</p>
            </div>
          ))}
        </section>
      </div>

      {/* Bottom Floating Bar (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 z-50 md:hidden">
        <div className="bg-[#020617]/80 backdrop-blur-2xl border border-white/10 p-2 rounded-2xl flex items-center justify-between shadow-2xl">
          <div className="pl-4">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Plan</p>
            <p className="text-lg font-bold text-white">฿{Number(proposal.total_value).toLocaleString()}</p>
          </div>
          <button className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow-premium uppercase tracking-widest">
            Accept Offer
          </button>
        </div>
      </div>

      <footer className="mt-20 py-8 text-center text-[10px] text-white/10 uppercase tracking-[0.3em] font-light">
        Powered by BN-Aura Aesthetic Intelligence
      </footer>
    </main>
  );
}
