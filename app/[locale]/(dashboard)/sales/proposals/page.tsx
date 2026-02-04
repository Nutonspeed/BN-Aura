'use client';

import { motion } from 'framer-motion';
import { 
  FileText, 
  Plus, 
  MagnifyingGlass, 
  Eye, 
  DownloadSimple, 
  CurrencyDollar,
  Clock,
  Pulse,
  DotsThreeVertical,
  PaperPlaneTilt,
  User
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Link } from '@/i18n/routing';

interface Proposal {
  id: string;
  title: string;
  total_value: number;
  status: string;
  created_at: string;
  lead: {
    name: string;
    email: string;
  };
}

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const supabase = createClient();

  const fetchProposals = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales_proposals')
        .select(`
          *,
          lead:lead_id (name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProposals((data as unknown as Proposal[]) || []);
    } catch (err) {
      console.error('Error fetching proposals:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const filteredProposals = proposals.filter(p => 
    p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.lead?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10 font-sans pb-20"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-[0.3em]"
          >
            <FileText className="w-4 h-4" />
            Commercial Assets
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-white uppercase tracking-tight"
          >
            Digital <span className="text-primary text-glow">Proposals</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            Orchestrating high-value aesthetic transformations.
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Link href="/sales/proposals/create">
            <button className="flex items-center gap-3 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-[0.1em] shadow-premium hover:brightness-110 transition-all active:scale-95 text-xs">
              <Plus className="w-4 h-4 stroke-[3px]" />
              <span>Generate Proposal</span>
            </button>
          </Link>
        </motion.div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Pipeline Value', value: '฿1.2M', icon: DollarSign, color: 'text-emerald-400' },
          { label: 'Dispatched Today', value: '12', icon: Send, color: 'text-primary' },
          { label: 'Conversion Intel', value: '24%', icon: Activity, color: 'text-purple-400' },
        ].map((stat, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            whileHover={{ y: -5 }}
            className="glass-card p-6 rounded-3xl border border-white/5 flex items-center gap-5 group overflow-hidden relative"
          >
            <div className="absolute -top-2 -right-2 opacity-5 group-hover:opacity-10 transition-opacity">
              <stat.icon className="w-16 h-16 text-white" />
            </div>
            <div className={cn("w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform", stat.color)}>
              <stat.icon className="w-7 h-7" />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-white">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search & List */}
      <div className="space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-primary/10 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-3xl" />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search by title or customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-3xl py-4 pl-14 pr-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all shadow-inner backdrop-blur-md relative z-10"
          />
        </motion.div>

        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <FileText className="absolute inset-0 m-auto w-6 h-6 text-primary animate-pulse" />
            </div>
            <p className="text-muted-foreground animate-pulse font-bold uppercase tracking-[0.3em] text-[10px]">Accessing Secure Vault...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {filteredProposals.length > 0 ? (
              filteredProposals.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + i * 0.05 }}
                  whileHover={{ x: 5 }}
                  className="glass-card p-6 rounded-[32px] border border-white/5 flex flex-col xl:flex-row xl:items-center justify-between gap-6 hover:border-primary/30 transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary/0 group-hover:bg-primary transition-all" />
                  
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-transparent flex items-center justify-center text-primary border border-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-premium">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-xl font-black text-white group-hover:text-primary transition-colors tracking-tight">{p.title}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground font-medium uppercase tracking-widest">
                        <span className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-primary/60" /> {p.lead?.name}</span>
                        <div className="w-1 h-1 rounded-full bg-white/10" />
                        <span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-primary/60" /> {new Date(p.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 xl:gap-12">
                    <div className="space-y-1 min-w-[120px]">
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em]">Asset Value</p>
                      <p className="text-xl font-black text-white tabular-nums">฿{Number(p.total_value).toLocaleString()}</p>
                    </div>

                    <div className={cn(
                      "px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-[0.2em] shadow-sm",
                      p.status === 'accepted' ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" :
                      p.status === 'sent' ? "bg-primary/20 border-primary/30 text-primary" :
                      "bg-white/5 border-white/10 text-muted-foreground"
                    )}>
                      {p.status}
                    </div>

                    <div className="flex items-center gap-3">
                      <button className="p-3 bg-white/5 border border-white/5 rounded-2xl text-white/40 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all shadow-sm group/btn">
                        <Eye className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                      </button>
                      <button className="p-3 bg-white/5 border border-white/5 rounded-2xl text-white/40 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all shadow-sm group/btn">
                        <Download className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                      </button>
                      <button className="p-3 bg-white/5 border border-white/5 rounded-2xl text-white/40 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all shadow-sm group/btn">
                        <MoreVertical className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card p-24 rounded-[48px] border border-white/5 flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                <div className="w-24 h-24 rounded-[32px] bg-white/5 border border-white/5 flex items-center justify-center text-white/10 animate-float relative z-10">
                  <FileText className="w-12 h-12" />
                </div>
                <div className="space-y-2 relative z-10">
                  <p className="text-xl font-black text-white uppercase tracking-widest">Vault Empty</p>
                  <p className="text-sm text-muted-foreground font-light max-w-sm mx-auto italic">Initialize your first AI-enhanced clinical proposal to begin the transformation cycle.</p>
                </div>
                <Link href="/sales/proposals/create" className="relative z-10">
                  <button className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-[0.2em] shadow-premium hover:brightness-110 transition-all active:scale-95 text-xs">
                    Begin Proposal Node
                  </button>
                </Link>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
