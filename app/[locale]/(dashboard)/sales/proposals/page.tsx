'use client';

import { motion } from 'framer-motion';
import { 
  FileText, 
  Plus, 
  Search, 
  Eye, 
  Download, 
  DollarSign,
  Clock,
  Activity,
  MoreVertical,
  Loader2,
  Send,
  User
} from 'lucide-react';
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
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white uppercase tracking-tight">Digital Proposals</h1>
          <p className="text-muted-foreground font-light text-sm italic">Create and track AI-enhanced aesthetic treatment offers.</p>
        </div>
        <Link href="/sales/proposals/create">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold shadow-premium hover:brightness-110 transition-all active:scale-95 text-sm uppercase tracking-widest">
            <Plus className="w-4 h-4" />
            <span>New Proposal</span>
          </button>
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Value', value: '฿1.2M', icon: DollarSign, color: 'text-emerald-400' },
          { label: 'Sent Today', value: '12', icon: Send, color: 'text-primary' },
          { label: 'Conversion Rate', value: '24%', icon: Activity, color: 'text-purple-400' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 rounded-3xl border border-white/10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
              <stat.icon className={cn("w-6 h-6", stat.color)} />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search & List */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input 
            type="text" 
            placeholder="Search by title or customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-inner"
          />
        </div>

        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-muted-foreground animate-pulse text-xs uppercase tracking-widest">Loading Proposals...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredProposals.length > 0 ? (
              filteredProposals.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card p-6 rounded-[32px] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      <FileText className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{p.title}</h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {p.lead?.name}</span>
                        <div className="w-1 h-1 rounded-full bg-white/10" />
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {new Date(p.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-right space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Total Value</p>
                      <p className="text-lg font-bold text-white">฿{Number(p.total_value).toLocaleString()}</p>
                    </div>

                    <div className={cn(
                      "px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-widest",
                      p.status === 'accepted' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                      p.status === 'sent' ? "bg-primary/10 border-primary/20 text-primary" :
                      "bg-white/5 border-white/10 text-muted-foreground"
                    )}>
                      {p.status}
                    </div>

                    <div className="flex gap-2">
                      <button className="p-2.5 bg-white/5 rounded-xl text-white/50 hover:bg-white/10 hover:text-white transition-all">
                        <Eye className="w-5 h-5" />
                      </button>
                      <button className="p-2.5 bg-white/5 rounded-xl text-white/50 hover:bg-white/10 hover:text-white transition-all">
                        <Download className="w-5 h-5" />
                      </button>
                      <button className="p-2.5 bg-white/5 rounded-xl text-white/50 hover:bg-white/10 hover:text-white transition-all">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="glass-card p-20 rounded-[40px] border border-white/5 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                <FileText className="w-16 h-16 text-white/20" />
                <div>
                  <p className="text-lg font-bold text-white">No Proposals Found</p>
                  <p className="text-sm font-light">Create your first AI-driven proposal to start conversion.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
