'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Clock,
  Sparkles,
  Loader2
} from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Link } from '@/i18n/routing';

interface Lead {
  id: string;
  name: string;
  email: string;
  status: string;
  score: number;
  created_at: string;
  clinic_id: string;
}

const COLUMNS = [
  { id: 'new', title: 'New Leads' },
  { id: 'contacted', title: 'Contacted' },
  { id: 'qualified', title: 'Qualified' },
  { id: 'proposal_sent', title: 'Proposal Sent' },
];

export default function LeadsKanbanPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const supabase = createClient();

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads((data as unknown as Lead[]) || []);
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const getLeadsByStatus = (status: string) => {
    return leads.filter(l => 
      l.status === status && 
      (l.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
       l.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  return (
    <div className="space-y-8 h-[calc(100vh-160px)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white uppercase tracking-tight">Leads Management</h1>
          <p className="text-muted-foreground font-light text-sm italic">AI-driven sales pipeline for BN-Aura.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input 
              type="text" 
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all w-64"
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold shadow-premium hover:brightness-110 transition-all active:scale-95 text-sm">
            <Plus className="w-4 h-4" />
            <span>Add New Lead</span>
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-muted-foreground animate-pulse font-light uppercase tracking-widest text-xs">Synchronizing Pipeline...</p>
        </div>
      ) : (
        <div className="flex-1 flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
          {COLUMNS.map((column) => (
            <div key={column.id} className="flex-shrink-0 w-80 flex flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest opacity-60">{column.title}</h3>
                  <span className="bg-white/5 text-muted-foreground text-[10px] px-2 py-0.5 rounded-full border border-white/5">
                    {getLeadsByStatus(column.id).length}
                  </span>
                </div>
                <button className="text-muted-foreground hover:text-white transition-colors">
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              <div className="flex-1 space-y-4 bg-white/[0.01] border border-white/[0.03] rounded-[32px] p-4 min-h-[200px]">
                <AnimatePresence mode="popLayout">
                  {getLeadsByStatus(column.id).length > 0 ? (
                    getLeadsByStatus(column.id).map((lead) => (
                      <motion.div
                        key={lead.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="glass-card p-4 rounded-2xl border border-white/10 hover:border-primary/30 transition-all cursor-grab active:cursor-grabbing group relative"
                      >
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                        </div>
                        
                        <div className="flex items-start gap-3 mb-4">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                            {lead.name?.split(' ').map((n: string) => n[0]).join('') || 'L'}
                          </div>
                          <div className="space-y-0.5">
                            <h4 className="text-sm font-bold text-white truncate w-40">{lead.name}</h4>
                            <p className="text-[10px] text-muted-foreground truncate">{lead.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-light">
                            <Clock className="w-3 h-3" />
                            {new Date(lead.created_at).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-2">
                            <Link href={`/analysis?leadId=${lead.id}`}>
                              <button className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-sm">
                                <Sparkles className="w-3 h-3" />
                              </button>
                            </Link>
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 border border-white/5 text-white text-[10px] font-bold">
                              {lead.score || 0}%
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-10">
                      <div className="w-10 h-10 border-2 border-dashed border-white/20 rounded-xl mb-2" />
                      <p className="text-[10px] font-bold uppercase tracking-tighter">No Leads</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
