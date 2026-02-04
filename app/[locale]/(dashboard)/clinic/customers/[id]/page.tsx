'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  EnvelopeSimple, 
  Phone, 
  CalendarDots, 
  ClockCounterClockwise, 
  Sparkle, 
  CreditCard, 
  ShieldCheck, 
  CaretLeft,
  SpinnerGap,
  PencilSimple,
  ChatCircle,
  Tag,
  Clock,
  ArrowRight,
  SquaresFour
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useRouter, useParams } from 'next/navigation';
import { Link } from '@/i18n/routing';
import CustomerModal from '@/components/CustomerModal';

interface CustomerDetails {
  id: string;
  full_name: string;
  nickname?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  customer_type: string;
  status: string;
  notes?: string;
  created_at: string;
  skin_analyses: any[];
  sales_commissions: any[];
  customer_treatment_journeys?: any[];
  comparisons?: any[];
}

function CustomerDetailPageContent() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [activeTab, setActiveSection] = useState('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchCustomerData = useCallback(async () => {
    setLoading(true);
    try {
      const [detailsRes, compareRes] = await Promise.all([
        fetch(`/api/customers/${customerId}`),
        fetch(`/api/analysis/compare?userId=${customerId}`) // Actually we need the user_id linked to this customer
      ]);
      
      const result = await detailsRes.json();
      if (result.success) {
        const customerData = result.data;
        // The comparison API needs user_id, let's fetch it if we don't have it
        if (customerData.user_id) {
          const compRes = await fetch(`/api/analysis/compare?userId=${customerData.user_id}`);
          const compResult = await compRes.json();
          if (compResult.success) {
            customerData.comparisons = compResult.data;
          }
        }
        setCustomer(customerData);
      }
    } catch (err) {
      console.error('Error fetching customer details:', err);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchCustomerData();
  }, [fetchCustomerData]);

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-6">
        <SpinnerGap className="w-12 h-12 text-primary animate-spin" />
        <p className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Syncing Patient Identity Node...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-6">
        <ShieldCheck className="w-12 h-12 text-rose-500" />
        <p className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground">Patient Node Not Detected</p>
        <button onClick={() => router.back()} className="text-primary font-bold uppercase text-xs tracking-widest hover:underline">Return to Cluster</button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10 pb-20 font-sans"
    >
      <CustomerModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchCustomerData}
        customer={customer}
      />

      {/* Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.back()}
            className="p-4 bg-white/5 border border-white/10 rounded-2xl text-muted-foreground hover:text-white transition-all"
          >
            <CaretLeft className="w-5 h-5" />
          </button>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]">
              <User className="w-4 h-4" />
              Patient Identity Node
            </div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tight">{customer.full_name} <span className="text-primary/40 font-light italic">({customer.nickname || 'Node'})</span></h1>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all"
          >
            <PencilSimple className="w-4 h-4" />
            Modify Protocol
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl text-xs font-black uppercase tracking-widest shadow-premium hover:brightness-110 transition-all">
            <ChatCircle className="w-4 h-4" />
            Direct Link
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
        {/* Left Column: ID Card */}
        <div className="xl:col-span-1 space-y-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-premium p-8 rounded-[40px] border border-white/10 relative overflow-hidden"
          >
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-primary/10 blur-[60px] rounded-full" />
            
            <div className="relative z-10 space-y-8">
              <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 flex items-center justify-center mx-auto text-3xl font-black text-primary shadow-premium">
                {customer.full_name.charAt(0)}
              </div>

              <div className="space-y-6">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em]">Temporal Node</p>
                  <div className="flex items-center gap-3 text-white font-bold">
                    <CalendarDots className="w-4 h-4 text-primary/60" />
                    <span>{customer.date_of_birth ? new Date(customer.date_of_birth).toLocaleDateString() : 'Undefined'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em]">Neural Address</p>
                  <div className="flex items-center gap-3 text-white font-bold">
                    <EnvelopeSimple className="w-4 h-4 text-primary/60" />
                    <span className="truncate">{customer.email || 'None'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em]">Comm Channel</p>
                  <div className="flex items-center gap-3 text-white font-bold">
                    <Phone className="w-4 h-4 text-primary/60" />
                    <span>{customer.phone || 'None'}</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-muted-foreground uppercase">Security Tier</span>
                    <span className="px-2 py-1 rounded-md bg-primary/10 border border-primary/20 text-[9px] font-black text-primary uppercase">{customer.customer_type}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-muted-foreground uppercase">Node Status</span>
                    <span className="flex items-center gap-1.5 text-[9px] font-black text-emerald-400 uppercase">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {customer.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Clinical Alerts / Notes */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-8 rounded-[40px] border border-rose-500/10 bg-rose-500/[0.02] space-y-4"
          >
            <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-[0.3em] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Critical Telemetry
            </h4>
            <p className="text-xs text-muted-foreground italic font-light leading-relaxed">
              {customer.notes || 'No critical contraindications detected in current registry node.'}
            </p>
          </motion.div>
        </div>

        {/* Right Column: Tabbed Content */}
        <div className="xl:col-span-3 space-y-8">
          {/* Section Navigation */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { id: 'overview', label: 'Clinical Overview', icon: LayoutGrid },
              { id: 'journey', label: 'Treatment Cycles', icon: History },
              { id: 'analysis', label: 'Neural Diagnostics', icon: Sparkles },
              { id: 'transactions', label: 'Fiscal Node', icon: CreditCard },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={cn(
                  "flex items-center gap-3 px-6 py-3 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest border whitespace-nowrap",
                  activeTab === tab.id 
                    ? "bg-primary text-primary-foreground border-primary shadow-glow-sm" 
                    : "bg-white/5 text-muted-foreground border-white/5 hover:bg-white/10 hover:text-white"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: 'Latest Score', value: '84/100', icon: Sparkles, color: 'text-primary' },
                    { label: 'Total Nodes', value: customer.sales_commissions.length.toString(), icon: History, color: 'text-blue-400' },
                    { label: 'Fiscal Value', value: `฿${customer.sales_commissions.reduce((acc, c) => acc + Number(c.base_amount), 0).toLocaleString()}`, icon: CreditCard, color: 'text-emerald-400' },
                  ].map((stat, i) => (
                    <div key={i} className="glass-card p-6 rounded-3xl border border-white/5 flex items-center gap-5">
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10", stat.color)}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                        <p className="text-xl font-black text-white">{stat.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recent Activity */}
                <div className="glass-premium p-10 rounded-[48px] border border-white/5 space-y-8">
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Recent Activity Stream</h3>
                  <div className="space-y-6">
                    {customer.sales_commissions.slice(0, 5).map((txn, i) => (
                      <div key={i} className="flex gap-6 group">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-primary">
                            <Clock className="w-5 h-5" />
                          </div>
                          {i !== 4 && <div className="w-0.5 h-full bg-white/5" />}
                        </div>
                        <div className="flex-1 pb-8 border-b border-white/5">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="text-sm font-bold text-white uppercase tracking-wider">{txn.transaction_type}</h4>
                            <span className="text-[10px] font-medium text-muted-foreground">{new Date(txn.transaction_date).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-muted-foreground font-light mb-3 italic">Processed at clinical node via terminal execution.</p>
                          <span className="text-lg font-black text-primary tabular-nums">฿{Number(txn.base_amount).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                    {customer.sales_commissions.length === 0 && (
                      <div className="py-10 text-center opacity-20">
                        <History className="w-12 h-12 mx-auto mb-4 stroke-[1px]" />
                        <p className="text-xs font-black uppercase tracking-widest">No Activity Records</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'analysis' && (
              <motion.div
                key="analysis"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-10"
              >
                {/* Comparison History */}
                {customer.comparisons && customer.comparisons.length > 0 && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-black text-white uppercase tracking-[0.2em] px-4 flex items-center gap-3">
                      <History className="w-5 h-5 text-primary" />
                      Evolution Deltas
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {customer.comparisons.map((comp, i) => (
                        <div key={i} className="glass-premium p-6 rounded-[32px] border border-emerald-500/20 bg-emerald-500/[0.02] flex items-center justify-between">
                          <div className="flex items-center gap-6">
                            <div className="flex -space-x-4">
                              <div className="w-12 h-12 rounded-xl border border-background overflow-hidden relative z-10">
                                <img src={comp.before.image_url} className="w-full h-full object-cover opacity-60" />
                              </div>
                              <div className="w-12 h-12 rounded-xl border border-background overflow-hidden relative z-20">
                                <img src={comp.after.image_url} className="w-full h-full object-cover" />
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-white uppercase tracking-widest">Aesthetic Delta</p>
                              <p className="text-[9px] text-muted-foreground">{new Date(comp.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Improvement</p>
                            <p className="text-xl font-black text-emerald-400">+{comp.overall_improvement}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Individual Analyses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {customer.skin_analyses.map((scan, i) => (
                    <div key={i} className="glass-premium p-8 rounded-[40px] border border-white/5 space-y-6 group hover:border-primary/30 transition-all">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <Sparkle className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white uppercase tracking-widest">Diagnostic Node</h4>
                            <p className="text-[10px] text-muted-foreground font-medium italic">{new Date(scan.analyzed_at).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Aura Score</p>
                          <p className="text-2xl font-black text-primary">{scan.overall_score}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                        <div className="text-center p-3 bg-white/5 rounded-2xl">
                          <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Pores</p>
                          <p className="text-sm font-black text-white">{scan.pores_score}</p>
                        </div>
                        <div className="text-center p-3 bg-white/5 rounded-2xl">
                          <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Wrinkles</p>
                          <p className="text-sm font-black text-white">{scan.wrinkles_score}</p>
                        </div>
                        <div className="text-center p-3 bg-white/5 rounded-2xl">
                          <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Texture</p>
                          <p className="text-sm font-black text-white">{scan.texture_score}</p>
                        </div>
                      </div>

                      <button className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                        Full Diagnostic Payload <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                {customer.skin_analyses.length === 0 && (
                  <div className="col-span-full py-20 text-center glass-card rounded-[40px] border border-white/5 opacity-20">
                    <Sparkle className="w-16 h-16 mx-auto mb-4 stroke-[1px]" />
                    <p className="text-sm font-black uppercase tracking-[0.2em]">Zero Diagnostic Data Detected</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'journey' && (
              <motion.div
                key="journey"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {customer.customer_treatment_journeys?.map((journey, i) => (
                  <div key={i} className="glass-premium p-8 rounded-[40px] border border-white/5 space-y-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                          <History className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white uppercase tracking-widest">
                            {(journey.treatment_plan as any)?.treatment_name || 'Protocol Execution'}
                          </h4>
                          <p className="text-[10px] text-muted-foreground font-medium italic">Status: {journey.journey_status.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{new Date(journey.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-xs text-muted-foreground font-light leading-relaxed italic">
                        {journey.progress_notes || 'No operational notes recorded for this cycle.'}
                      </p>
                    </div>
                  </div>
                ))}
                {(!customer.customer_treatment_journeys || customer.customer_treatment_journeys.length === 0) && (
                  <div className="py-20 text-center glass-card rounded-[40px] border border-white/5 opacity-20">
                    <History className="w-16 h-16 mx-auto mb-4 stroke-[1px]" />
                    <p className="text-sm font-black uppercase tracking-[0.2em]">Zero Cycle History Detected</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'transactions' && (
              <motion.div
                key="transactions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass-premium rounded-[40px] border border-white/5 overflow-hidden"
              >
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/[0.03] border-b border-white/5">
                      <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">TXN Code</th>
                      <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Protocol Type</th>
                      <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Fiscal Value</th>
                      <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {customer.sales_commissions.map((txn, i) => (
                      <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="px-8 py-5 text-xs font-mono text-white/40">TXN-{txn.id.slice(0, 8)}</td>
                        <td className="px-8 py-5 text-sm font-bold text-white uppercase tracking-tight">{txn.transaction_type}</td>
                        <td className="px-8 py-5 text-sm font-black text-primary tabular-nums">฿{Number(txn.base_amount).toLocaleString()}</td>
                        <td className="px-8 py-5">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                            txn.payment_status === 'paid' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                          )}>
                            {txn.payment_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {customer.sales_commissions.length === 0 && (
                  <div className="py-20 text-center opacity-20">
                    <CreditCard className="w-16 h-16 mx-auto mb-4 stroke-[1px]" />
                    <p className="text-sm font-black uppercase tracking-[0.2em]">Zero Fiscal Telemetry</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export default function CustomerDetailPage() {
  return (
    <Suspense fallback={
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-6">
        <SpinnerGap className="w-12 h-12 text-primary animate-spin" />
        <p className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Initializing Interface node...</p>
      </div>
    }>
      <CustomerDetailPageContent />
    </Suspense>
  );
}

