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
  Sparkles,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/routing';
import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import MyCustomersSection from '@/components/sales/MyCustomersSection';
import CommissionTracker from '@/components/sales/CommissionTracker';
import ChatCenter from '@/components/sales/ChatCenter';
import AICoachPanel from '@/components/sales/AICoachPanel';
import HotLeadsAlert from '@/components/sales/HotLeadsAlert';
import SmartSuggestions from '@/components/sales/SmartSuggestions';
import { CustomerContext } from '@/lib/ai/salesCoach';

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
  category: 'hot' | 'warm' | 'cold';
  confidence: number;
  time: string;
  estimatedValue: number;
  priority: 'immediate' | 'follow_up' | 'nurture';
}

interface SalesTarget {
  target: { target_amount: number };
  actualSales: number;
  progress: number;
}

export default function SalesDashboard() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [targetStats, setTargetStats] = useState<SalesTarget | null>(null);
  
  // AI Sales Coach State
  const [currentCustomer, setCurrentCustomer] = useState<CustomerContext | null>(null);
  const [currentConversation, setCurrentConversation] = useState<string>('');

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function fetchSalesData() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setUserId(user.id);

        const [leadsRes, reportsRes, targetRes] = await Promise.all([
          supabase.from('sales_leads').select('*').order('created_at', { ascending: false }).limit(5),
          fetch('/api/reports?type=sales_overview').then(res => res.json()),
          fetch('/api/sales/targets').then(res => res.json())
        ]);

        const { data: leads, error: leadsError } = leadsRes;
        
        if (leadsError) throw leadsError;

        if (reportsRes.success) {
          const d = reportsRes.data;
          setStats([
            { label: 'New Leads', value: d.newLeads.toString(), change: '+15%', trend: 'up', icon: UserPlus },
            { label: 'Conversion Rate', value: `${d.conversionRate.toFixed(1)}%`, change: '+4.2%', trend: 'up', icon: Target },
            { label: 'Monthly Sales', value: targetRes.success ? `฿${targetRes.data.actualSales.toLocaleString()}` : '฿0', change: '+12%', trend: 'up', icon: TrendingUp },
            { label: 'AI Proposals Sent', value: d.proposalsSent.toString(), change: '+28%', trend: 'up', icon: Zap },
          ]);
        }

        if (targetRes.success) {
          setTargetStats(targetRes.data);
        }

        // Fetch and process real leads
        const processedLeads: RecentLead[] = (leads || []).map(l => ({
          id: l.id,
          name: l.metadata?.customerProfile?.name || 'Unknown Customer',
          status: l.status === 'new' ? 'ใหม่' : l.status === 'won' ? 'ปิดการขาย' : 'กำลังติดตาม',
          score: l.score || 0,
          category: l.category as 'hot' | 'warm' | 'cold',
          confidence: l.confidence || 0,
          time: new Date(l.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.',
          estimatedValue: l.metadata?.scoring?.estimatedValue || 0,
          priority: (l.metadata?.scoring?.priority || 'nurture') as 'immediate' | 'follow_up' | 'nurture'
        }));

        setRecentLeads(processedLeads);

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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10 pb-20 relative"
    >
      {/* Hot Leads Alert - Fixed Position */}
      <HotLeadsAlert />
      
      {/* AI Sales Coach Panel - Conditionally show when customer is selected */}
      {currentCustomer && (
        <AICoachPanel 
          customerContext={currentCustomer}
          currentConversation={currentConversation}
          onSuggestionApply={(suggestion) => {
            setCurrentConversation(prev => prev + '\n[AI แนะนำ]: ' + suggestion);
          }}
        />
      )}
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-[0.3em]"
          >
            <Zap className="w-4 h-4" />
            Active Intelligence
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-white uppercase tracking-tight"
          >
            Sales <span className="text-primary text-glow">Intelligence</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            Empowering aesthetic advisors with real-time cognitive insights.
          </motion.p>
        </div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex gap-3"
        >
          <Link href="/analysis">
            <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white hover:bg-white/10 transition-all active:scale-95 flex items-center gap-2 group">
              <Sparkles className="w-4 h-4 text-primary group-hover:animate-pulse" />
              Quick AI Scan
            </button>
          </Link>
          <button 
            onClick={() => {
              // Demo AI Coach with sample customer
              const demoCustomer: CustomerContext = {
                name: 'ลูกค้าทดลอง',
                skinAnalysis: {
                  skinType: 'oily',
                  concerns: ['acne', 'large_pores', 'oily_t_zone'],
                  ageEstimate: 25,
                  urgencyScore: 75
                },
                previousTreatments: [],
                budget: '฿15,000-25,000',
                objections: []
              };
              setCurrentCustomer(demoCustomer);
              setCurrentConversation('ลูกค้าสนใจ treatment สำหรับปัญหาสิว และรูขุมขนกว้าง งบประมาณ 15-25k');
            }}
            className="px-6 py-3 bg-primary/20 border border-primary/30 rounded-2xl text-sm font-bold text-primary hover:bg-primary/30 transition-all active:scale-95 flex items-center gap-2 group"
          >
            <Sparkles className="w-4 h-4 group-hover:animate-spin" />
            AI Coach Demo
          </button>
          <Link href="/sales/leads">
            <button className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-bold shadow-premium hover:brightness-110 transition-all active:scale-95">
              Manage Kanban
            </button>
          </Link>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="glass-card p-6 rounded-3xl relative overflow-hidden group"
          >
            <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-125 transition-all duration-500">
              <stat.icon className="w-16 h-16 text-primary" />
            </div>
            
            <div className="space-y-2 relative z-10">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white tracking-tighter">{stat.value}</span>
                <span className={cn(
                  "text-[10px] font-bold flex items-center px-1.5 py-0.5 rounded-full bg-white/5",
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

      {/* Target Progress Section (NEW) */}
      {targetStats && targetStats.target.target_amount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-premium p-8 rounded-[40px] border border-primary/20 bg-primary/[0.02] relative overflow-hidden"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20 shadow-premium">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Performance <span className="text-primary">Target</span></h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Monthly Revenue Goal</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Cycle Progress</p>
              <p className="text-2xl font-black text-white">{Math.round(targetStats.progress)}%</p>
            </div>
          </div>

          <div className="mt-8 space-y-4 relative z-10">
            <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-widest">
              <span className="text-white/40">Current: ฿{targetStats.actualSales.toLocaleString()}</span>
              <span className="text-primary">Target: ฿{targetStats.target.target_amount.toLocaleString()}</span>
            </div>
            <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(targetStats.progress, 100)}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-primary shadow-glow-sm rounded-full"
              />
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Intelligence Components */}
        <div className="lg:col-span-2 space-y-8">
          {/* AI Smart Suggestions - NEW */}
          {currentCustomer && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <SmartSuggestions 
                customerContext={currentCustomer}
                currentTreatments={currentCustomer.previousTreatments || []}
              />
            </motion.div>
          )}

          {/* Earning Intelligence */}
          {userId && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <CommissionTracker salesId={userId!} />
            </motion.div>
          )}
          
          {/* Chat Intelligence */}
          {userId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <ChatCenter salesId={userId!} />
            </motion.div>
          )}
        </div>

        {/* Right Column: CRM Components */}
        <div className="space-y-8">
          {/* Recent Hot Leads */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="glass-card p-8 rounded-[40px] border border-white/10 space-y-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Users className="w-32 h-32 text-primary" />
            </div>

            <div className="flex items-center justify-between relative z-10">
              <h3 className="text-xl font-bold text-white uppercase tracking-tight">Hot Leads <span className="text-primary">Intel</span></h3>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Target className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-4 relative z-10">
              {recentLeads.map((lead, idx) => (
                <motion.div 
                  key={lead.id} 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + idx * 0.1 }}
                  className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-primary/20 transition-all cursor-pointer group hover:bg-white/[0.08]"
                  onClick={() => {
                    // Convert lead to CustomerContext for AI Coach
                    const customerContext: CustomerContext = {
                      name: lead.name,
                      skinAnalysis: {
                        skinType: 'combination', // Default value
                        concerns: ['aging', 'acne'], // Default values  
                        ageEstimate: 30, // Default value
                        urgencyScore: lead.score
                      },
                      previousTreatments: [],
                      budget: `฿${lead.estimatedValue.toLocaleString()}`,
                      objections: []
                    };
                    setCurrentCustomer(customerContext);
                    setCurrentConversation(`เริ่มสนทนากับ ${lead.name} - Lead Score: ${lead.score}%`);
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">{lead.name}</span>
                    <span className="text-[9px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-tighter border border-primary/20 shadow-[0_0_10px_rgba(var(--primary),0.2)]">
                      AI Score: {lead.score}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground font-light">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-primary/60" />
                      {lead.time}
                    </div>
                    <span className="italic font-medium text-white/40">{lead.status}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            <Link href="/sales/leads" className="block relative z-10">
              <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/10 transition-all active:scale-95">
                Review All Prospects
              </button>
            </Link>
          </motion.div>

          {/* Managed Customers */}
          {userId && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
            >
              <MyCustomersSection salesId={userId!} />
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
