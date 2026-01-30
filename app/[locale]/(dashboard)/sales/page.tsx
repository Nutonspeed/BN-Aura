'use client';

import { motion } from 'framer-motion';
import { 
  Users, 
  Target, 
  TrendingUp, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  UserPlus,
  Zap,
  BarChart3,
  Sparkles,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/routing';
import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Stat {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ComponentType<{ className?: string }>;
}

interface RecentLead {
  id: string;
  name: string;
  status: string;
  score: number;
  time: string;
}

export default function SalesDashboard() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function fetchSalesData() {
      setLoading(true);
      try {
        const { data: leads, error: leadsError } = await supabase
          .from('sales_leads')
          .select('*')
          .order('created_at', { ascending: false });

        const { data: proposals, error: propsError } = await supabase
          .from('sales_proposals')
          .select('*');

        if (leadsError || propsError) throw new Error('Failed to fetch stats');

        const newLeadsCount = leads?.filter(l => l.status === 'new').length || 0;
        const totalLeads = leads?.length || 0;
        const wonLeads = leads?.filter(l => l.status === 'won').length || 0;
        const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;
        const avgDealSize = proposals?.length ? proposals.reduce((acc, p) => acc + Number(p.total_value), 0) / proposals.length : 0;

        setStats([
          { label: 'New Leads', value: newLeadsCount.toString(), change: '+15%', trend: 'up', icon: UserPlus },
          { label: 'Conversion Rate', value: `${conversionRate.toFixed(1)}%`, change: '+4.2%', trend: 'up', icon: Target },
          { label: 'Avg. Deal Size', value: `฿${Math.round(avgDealSize).toLocaleString()}`, change: '-2.1%', trend: 'down', icon: TrendingUp },
          { label: 'AI Proposals Sent', value: (proposals?.length || 0).toString(), change: '+28%', trend: 'up', icon: Zap },
        ]);

        setRecentLeads(leads?.slice(0, 3).map(l => ({
          id: l.id,
          name: l.name,
          status: l.status,
          score: l.score || 0,
          time: new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })) || []);

      } catch (err) {
        console.error('Sales Dashboard Error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSalesData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse text-xs uppercase tracking-widest text-center">Loading Sales Intel...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white uppercase tracking-tight">Sales Intelligence</h1>
          <p className="text-muted-foreground font-light text-sm italic">Empowering aesthetic advisors with AI-driven insights.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/analysis">
            <button className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold text-white hover:bg-white/10 transition-all active:scale-95 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Quick AI Scan
            </button>
          </Link>
          <Link href="/sales/leads">
            <button className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold shadow-premium hover:brightness-110 transition-all active:scale-95">
              Manage Kanban
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 rounded-2xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <stat.icon className="w-12 h-12 text-primary" />
            </div>
            
            <div className="space-y-2 relative z-10">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{stat.value}</span>
                <span className={cn(
                  "text-[10px] font-bold flex items-center",
                  stat.trend === 'up' ? "text-emerald-400" : "text-rose-400"
                )}>
                  {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.change}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart Placeholder */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 glass-card p-8 rounded-[40px] border border-white/10 min-h-[400px] flex flex-col justify-center items-center text-center space-y-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
            <BarChart3 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">Sales Funnel Analytics</h3>
          <p className="text-muted-foreground max-w-xs font-light">
            AI-powered performance metrics will be displayed here in the next phase.
          </p>
        </motion.div>

        {/* Recent Hot Leads */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-8 rounded-[40px] border border-white/10 space-y-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Hot Leads (AI Scored)</h3>
            <Users className="w-5 h-5 text-primary opacity-60" />
          </div>

          <div className="space-y-4">
            {recentLeads.map((lead) => (
              <div key={lead.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-primary/20 transition-all cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">{lead.name}</span>
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-tighter">
                    Score: {lead.score}%
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground font-light">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {lead.time}
                  </div>
                  <span className="italic">{lead.status}</span>
                </div>
              </div>
            ))}
          </div>

          <Link href="/sales/leads">
            <button className="w-full mt-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-all">
              View All Leads
            </button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
