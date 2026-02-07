'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User,
  Phone,
  EnvelopeSimple,
  ChatCircle,
  SealCheck,
  ShieldCheck
} from '@phosphor-icons/react';
interface SalesRep {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export default function MySalesRep({ customerId }: { customerId: string }) {
  const [salesRep, setSalesRep] = useState<SalesRep | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSalesRep() {
      try {
        const res = await fetch(`/api/sales-customers?customerId=${customerId}`);
        const data = await res.json();
        if (data.success && data.data.salesRep) {
          setSalesRep(data.data.salesRep);
        }
      } catch (error) {
        console.error('Error fetching sales rep:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchSalesRep();
  }, [customerId]);

  if (loading) {
    return (
      <div className="glass-card p-6 rounded-[32px] border border-white/10 animate-pulse">
        <div className="h-4 w-32 bg-white/10 rounded mb-4"></div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/10"></div>
          <div className="space-y-2">
            <div className="h-4 w-40 bg-white/10 rounded"></div>
            <div className="h-3 w-24 bg-white/10 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!salesRep) {
    return (
      <div className="glass-card p-6 rounded-[32px] border border-white/10 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-white/5 mx-auto flex items-center justify-center text-muted-foreground">
          <User className="w-6 h-6" />
        </div>
        <p className="text-sm text-muted-foreground italic font-light">No advisor assigned yet.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 rounded-[32px] border border-white/10 space-y-6 relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
        <ShieldCheck className="w-12 h-12 text-primary" />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white uppercase tracking-tight">Your Personal Advisor</h3>
          <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
            <SealCheck className="w-3 h-3" />
            Verified Professional
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20 relative">
          <User className="w-8 h-8" />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#121212]" />
        </div>
        <div>
          <h4 className="text-xl font-bold text-white">{salesRep.name}</h4>
          <p className="text-xs text-muted-foreground font-light">Senior Aesthetic Consultant</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <a 
          href={`tel:${salesRep.phone}`}
          className="flex items-center justify-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white hover:bg-white/10 transition-all active:scale-95"
        >
          <Phone className="w-4 h-4 text-primary" />
          Call
        </a>
        <button className="flex items-center justify-center gap-2 p-3 bg-primary text-primary-foreground rounded-xl text-xs font-bold shadow-premium hover:brightness-110 transition-all active:scale-95">
          <ChatCircle className="w-4 h-4" />
          Message
        </button>
      </div>

      <div className="pt-4 border-t border-white/5 flex items-center justify-center gap-4 text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <EnvelopeSimple className="w-3.5 h-3.5" />
          <span className="text-[10px] font-light">{salesRep.email}</span>
        </div>
      </div>
    </motion.div>
  );
}