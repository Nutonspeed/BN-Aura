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
  SquaresFour,
  ArrowsCounterClockwise,
  IdentificationCard,
  Briefcase,
  TrendUp
} from '@phosphor-icons/react';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import Breadcrumb from '@/components/ui/Breadcrumb';
import CustomerModal from '@/components/CustomerModal';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useRouter, useParams } from 'next/navigation';
import { Link } from '@/i18n/routing';

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
  const { goBack } = useBackNavigation();
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
        <button onClick={() => goBack('/clinic/customers')} className="text-primary font-bold uppercase text-xs tracking-widest hover:underline">Return to Cluster</button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-20 font-sans"
    >
      <Breadcrumb 
        customLabels={{ 
          [customerId]: customer?.full_name || 'Patient Detail'
        }} 
      />

      <CustomerModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchCustomerData}
        customer={customer}
      />

      {/* Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Button 
            variant="outline"
            onClick={() => goBack('/clinic/customers')}
            className="p-4 h-14 w-14 border-border rounded-2xl text-muted-foreground hover:text-foreground transition-all"
          >
            <CaretLeft weight="bold" className="w-5 h-5" />
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]">
              <User weight="duotone" className="w-4 h-4" />
              Patient Identity Node
            </div>
            <h1 className="text-4xl font-bold text-foreground tracking-tight uppercase">
              {customer.full_name} 
              <span className="text-primary/40 font-light italic ml-3">({customer.nickname || 'NODE'})</span>
            </h1>
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 px-6 py-6 rounded-2xl text-xs font-black uppercase tracking-widest"
          >
            <PencilSimple weight="bold" className="w-4 h-4" />
            Modify Protocol
          </Button>
          <Button className="flex items-center gap-2 px-8 py-6 rounded-2xl text-xs font-black uppercase tracking-widest shadow-premium">
            <ChatCircle weight="bold" className="w-4 h-4" />
            Establish Direct Link
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Left Column: ID Card */}
        <div className="xl:col-span-1 space-y-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="p-8 rounded-[40px] border-border shadow-premium relative overflow-hidden group">
              <div className="absolute -top-12 -left-12 w-48 h-48 bg-primary/10 blur-[60px] rounded-full group-hover:bg-primary/20 transition-all duration-700" />
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                <IdentificationCard className="w-32 h-32 text-primary" />
              </div>
              
              <div className="relative z-10 space-y-10">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 flex items-center justify-center mx-auto text-4xl font-black text-primary shadow-premium group-hover:scale-105 transition-transform duration-500">
                  {customer.full_name.charAt(0)}
                </div>

                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Temporal Node</p>
                    <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-2xl border border-border/50">
                      <CalendarDots weight="duotone" className="w-4 h-4 text-primary/60" />
                      <span className="text-sm font-bold text-foreground">{customer.date_of_birth ? new Date(customer.date_of_birth).toLocaleDateString() : 'UNDEFINED'}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Neural Address</p>
                    <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-2xl border border-border/50">
                      <EnvelopeSimple weight="duotone" className="w-4 h-4 text-primary/60" />
                      <span className="text-sm font-bold text-foreground truncate">{customer.email || 'NONE'}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Comm Channel</p>
                    <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-2xl border border-border/50">
                      <Phone weight="duotone" className="w-4 h-4 text-primary/60" />
                      <span className="text-sm font-bold text-foreground">{customer.phone || 'NONE'}</span>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border/50 space-y-4">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Security Tier</span>
                      <Badge variant="ghost" size="sm" className="bg-primary/5 border-none text-primary font-black uppercase text-[9px] px-3">
                        {customer.customer_type}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Node Status</span>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{customer.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Clinical Alerts / Notes */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-8 rounded-[40px] border-rose-500/10 bg-rose-500/[0.02] space-y-4 group">
              <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-[0.3em] flex items-center gap-3">
                <ShieldCheck weight="duotone" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Critical Telemetry
              </h4>
              <p className="text-xs text-muted-foreground italic font-medium leading-relaxed">
                {customer.notes || 'No critical contraindications detected in current registry node.'}
              </p>
            </Card>
          </motion.div>
        </div>

        {/* Right Column: Tabbed Content */}
        <div className="xl:col-span-3 space-y-8">
          {/* Section Navigation */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide bg-secondary/30 p-1.5 rounded-[24px] border border-border/50">
            {[
              { id: 'overview', label: 'Clinical Overview', icon: SquaresFour },
              { id: 'journey', label: 'Treatment Cycles', icon: ClockCounterClockwise },
              { id: 'analysis', label: 'Neural Diagnostics', icon: Sparkle },
              { id: 'transactions', label: 'Fiscal Node', icon: CreditCard },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={cn(
                  "flex items-center gap-3 px-6 py-3.5 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest border whitespace-nowrap",
                  activeTab === tab.id 
                    ? "bg-primary text-primary-foreground border-primary shadow-premium" 
                    : "bg-transparent text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground"
                )}
              >
                <tab.icon weight={activeTab === tab.id ? "fill" : "bold"} className="w-4 h-4" />
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <StatCard
                    title="Latest Aura Score"
                    value="84%"
                    icon={Sparkle}
                    trend="up"
                    change={4.2}
                    className="p-4"
                  />
                  <StatCard
                    title="Protocol Density"
                    value={customer.sales_commissions.length.toString()}
                    icon={ClockCounterClockwise}
                    className="p-4"
                  />
                  <StatCard
                    title="Lifetime Valuation"
                    value={`฿${customer.sales_commissions.reduce((acc, c) => acc + Number(c.base_amount), 0).toLocaleString()}`}
                    icon={CreditCard}
                    trend="up"
                    change={12.5}
                    className="p-4"
                  />
                </div>

                {/* Recent Activity */}
                <Card className="rounded-[40px] border-border/50 overflow-hidden">
                  <CardHeader className="p-8 border-b border-border/50 flex flex-row items-center justify-between">
                    <CardTitle className="text-xl font-black uppercase tracking-tight">Recent Activity Stream</CardTitle>
                    <Badge variant="ghost" className="font-black text-[10px] tracking-widest uppercase bg-primary/5 text-primary border-none">Live Sync</Badge>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="space-y-8">
                      {customer.sales_commissions.slice(0, 5).map((txn, i) => (
                        <div key={i} className="flex gap-8 group">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-secondary border border-border flex items-center justify-center text-primary group-hover:bg-primary/10 transition-all duration-500 shadow-inner shrink-0">
                              <Clock weight="duotone" className="w-6 h-6" />
                            </div>
                            {i !== (Math.min(customer.sales_commissions.length, 5) - 1) && <div className="w-0.5 h-full bg-border/50 group-hover:bg-primary/30 transition-colors" />}
                          </div>
                          <div className="flex-1 pb-8 group-last:pb-0">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="text-base font-bold text-foreground uppercase tracking-tight group-hover:text-primary transition-colors">{txn.transaction_type}</h4>
                              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{new Date(txn.transaction_date).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs text-muted-foreground font-medium mb-4 italic opacity-80">Execution confirmed at clinical terminal alpha-node.</p>
                            <span className="text-2xl font-black text-foreground tabular-nums tracking-tight">฿{Number(txn.base_amount).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                      {customer.sales_commissions.length === 0 && (
                        <div className="py-20 text-center opacity-20 flex flex-col items-center gap-6">
                          <div className="w-20 h-20 rounded-[40px] bg-secondary flex items-center justify-center text-muted-foreground">
                            <ClockCounterClockwise weight="duotone" className="w-10 h-10" />
                          </div>
                          <p className="text-sm font-black uppercase tracking-[0.3em]">No activity records detected in current sector.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
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
                    <h3 className="text-xl font-black text-foreground uppercase tracking-[0.2em] px-4 flex items-center gap-4">
                      <ArrowsCounterClockwise weight="bold" className="w-6 h-6 text-primary" />
                      Evolution Deltas
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {customer.comparisons.map((comp, i) => (
                        <Card key={i} className="p-6 rounded-[32px] border-emerald-500/20 bg-emerald-500/[0.02] flex items-center justify-between hover:border-emerald-500/40 transition-all group/comp">
                          <div className="flex items-center gap-6">
                            <div className="flex -space-x-6">
                              <div className="w-16 h-16 rounded-2xl border-4 border-card overflow-hidden relative z-10 shadow-premium group-hover/comp:-translate-x-2 transition-transform duration-500">
                                <img src={comp.before.image_url} className="w-full h-full object-cover grayscale opacity-60" alt="Before" />
                              </div>
                              <div className="w-16 h-16 rounded-2xl border-4 border-card overflow-hidden relative z-20 shadow-premium group-hover/comp:translate-x-2 transition-transform duration-500">
                                <img src={comp.after.image_url} className="w-full h-full object-cover" alt="After" />
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-black text-foreground uppercase tracking-widest">Aesthetic Delta</p>
                              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-1">TS-{new Date(comp.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Improvement</p>
                            <div className="flex items-center gap-2 justify-end">
                              <TrendUp weight="bold" className="w-4 h-4 text-emerald-500" />
                              <p className="text-2xl font-black text-emerald-500">+{comp.overall_improvement}%</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Individual Analyses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {customer.skin_analyses.map((scan, i) => (
                    <Card key={i} className="p-8 rounded-[40px] border-border/50 space-y-8 group hover:border-primary/30 transition-all">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-secondary border border-border flex items-center justify-center text-primary group-hover:bg-primary/10 transition-all duration-500 shadow-inner">
                            <Sparkle weight="duotone" className="w-7 h-7" />
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-foreground uppercase tracking-tight">Diagnostic Node</h4>
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">{new Date(scan.analyzed_at).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Aura Score</p>
                          <p className="text-3xl font-black text-primary tracking-tighter">{scan.overall_score}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border/50">
                        {[
                          { label: 'Pores', value: scan.pores_score },
                          { label: 'Wrinkles', value: scan.wrinkles_score },
                          { label: 'Texture', value: scan.texture_score }
                        ].map((metric) => (
                          <div key={metric.label} className="text-center p-4 bg-secondary/30 rounded-2xl border border-border/50">
                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">{metric.label}</p>
                            <p className="text-lg font-black text-foreground">{metric.value}</p>
                          </div>
                        ))}
                      </div>

                      <Button variant="outline" className="w-full py-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] gap-3 border-border/50 hover:bg-secondary">
                        Access Full Diagnostic Payload
                        <ArrowRight weight="bold" className="w-4 h-4" />
                      </Button>
                    </Card>
                  ))}
                </div>
                {customer.skin_analyses.length === 0 && (
                  <Card variant="ghost" className="py-32 border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-6 opacity-40">
                    <div className="w-20 h-20 rounded-[40px] bg-secondary flex items-center justify-center text-muted-foreground">
                      <Sparkle weight="duotone" className="w-10 h-10" />
                    </div>
                    <p className="text-sm font-black uppercase tracking-[0.3em]">Zero diagnostic data detected in sector.</p>
                  </Card>
                )}
              </motion.div>
            )}

            {activeTab === 'journey' && (
              <motion.div
                key="journey"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {customer.customer_treatment_journeys?.map((journey, i) => (
                  <Card key={i} className="p-8 rounded-[40px] border-border/50 space-y-8 group">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-inner group-hover:scale-105 transition-transform duration-500">
                          <ClockCounterClockwise weight="duotone" className="w-7 h-7" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-foreground uppercase tracking-tight">
                            {(journey.treatment_plan as any)?.treatment_name || 'Protocol Execution Node'}
                          </h4>
                          <div className="flex items-center gap-3 mt-1">
                            <Badge variant="success" size="sm" className="bg-emerald-500/5 text-emerald-500 border-none font-black text-[8px] tracking-widest uppercase">
                              {journey.journey_status.replace('_', ' ')}
                            </Badge>
                            <div className="w-1 h-1 rounded-full bg-border" />
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Active Cycle</p>
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2">{new Date(journey.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="p-6 bg-secondary/30 rounded-3xl border border-border/50 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
                        <FileText weight="duotone" className="w-12 h-12 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground font-medium leading-relaxed italic relative z-10">
                        {journey.progress_notes || 'No operational notes recorded for this cycle execution node.'}
                      </p>
                    </div>
                  </Card>
                ))}
                {(!customer.customer_treatment_journeys || customer.customer_treatment_journeys.length === 0) && (
                  <Card variant="ghost" className="py-32 border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-6 opacity-40">
                    <div className="w-20 h-20 rounded-[40px] bg-secondary flex items-center justify-center text-muted-foreground">
                      <ClockCounterClockwise weight="duotone" className="w-10 h-10" />
                    </div>
                    <p className="text-sm font-black uppercase tracking-[0.3em]">Zero cycle history detected in neural registry.</p>
                  </Card>
                )}
              </motion.div>
            )}

            {activeTab === 'transactions' && (
              <motion.div
                key="transactions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="rounded-[40px] border-border/50 overflow-hidden shadow-premium">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-secondary/50 border-b border-border/50">
                          <th className="px-10 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">TXN Identity</th>
                          <th className="px-10 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Protocol Node</th>
                          <th className="px-10 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Fiscal Valuation</th>
                          <th className="px-10 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Verification</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {customer.sales_commissions.map((txn, i) => (
                          <tr key={i} className="group hover:bg-primary/[0.02] transition-colors">
                            <td className="px-10 py-6">
                              <span className="text-xs font-mono font-black text-primary/40 group-hover:text-primary transition-colors">TXN-{txn.id.slice(0, 8).toUpperCase()}</span>
                            </td>
                            <td className="px-10 py-6">
                              <p className="text-sm font-bold text-foreground uppercase tracking-tight">{txn.transaction_type}</p>
                              <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-1">Processed Node Alpha</p>
                            </td>
                            <td className="px-10 py-6">
                              <span className="text-lg font-black text-foreground tabular-nums tracking-tight">฿{Number(txn.base_amount).toLocaleString()}</span>
                            </td>
                            <td className="px-10 py-6">
                              <Badge 
                                variant={txn.payment_status === 'paid' ? 'success' : 'warning'}
                                className="font-black uppercase text-[8px] tracking-[0.2em] px-3 py-1"
                              >
                                {txn.payment_status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {customer.sales_commissions.length === 0 && (
                    <div className="py-32 text-center opacity-20 flex flex-col items-center gap-6">
                      <div className="w-20 h-20 rounded-[40px] bg-secondary flex items-center justify-center text-muted-foreground">
                        <CreditCard weight="duotone" className="w-10 h-10" />
                      </div>
                      <p className="text-sm font-black uppercase tracking-[0.3em]">Zero fiscal telemetry detected.</p>
                    </div>
                  )}
                </Card>
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

