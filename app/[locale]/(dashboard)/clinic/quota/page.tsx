'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Zap, 
  CreditCard, 
  ArrowUpRight,
  Package,
  Sparkles,
  Target,
  Clock,
  CheckCircle2,
  Loader2,
  Activity,
  X,
  Brain
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { QUOTA_PLANS, type QuotaConfig } from '@/lib/quota/quotaManager';

interface UsageStats {
  totalScans: number;
  successfulScans: number;
  failedScans: number;
  totalCost: number;
  averageCostPerScan: number;
  mostUsedScanType: string;
  peakUsageDay: string;
  utilizationRate: number;
}

interface Recommendations {
  currentPlan: string;
  recommendedPlan?: string;
  reasoning: string;
  potentialSavings?: number;
}

export default function QuotaManagement() {
  const [quotaData, setQuotaData] = useState<QuotaConfig | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [loading, setLoading] = useState(true);
  const [daysUntilReset, setDaysUntilReset] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState<'current' | 'last30' | 'last90'>('current');

  const { getClinicId } = useAuth();

  const fetchQuotaData = useCallback(async () => {
    setLoading(true);
    try {
      const clinicId = getClinicId();
      if (!clinicId) {
        setLoading(false);
        return;
      }
      
      const response = await fetch(`/api/quota/usage?clinicId=${clinicId}&period=${selectedPeriod}`);
      
      if (response.ok) {
        const data = await response.json();
        setQuotaData(data.quota);
        setUsageStats(data.stats);
        setRecommendations(data.recommendations);
        setDaysUntilReset(data.daysUntilReset);
      } else {
        // Fallback to mock data
        setQuotaData({
          clinicId,
          plan: 'professional',
          monthlyQuota: 200,
          currentUsage: 78,
          resetDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          overage: 0,
          overageRate: 60,
          features: {
            advancedAnalysis: true,
            proposalGeneration: true,
            leadScoring: true,
            realtimeSupport: false
          }
        });
        
        setUsageStats({
          totalScans: 78,
          successfulScans: 73,
          failedScans: 5,
          totalCost: 0,
          averageCostPerScan: 0,
          mostUsedScanType: 'detailed',
          peakUsageDay: 'Tuesday',
          utilizationRate: 39 // 78/200 * 100
        });
        
        setRecommendations({
          currentPlan: 'professional',
          reasoning: 'แผนปัจจุบันเหมาะสมกับการใช้งาน'
        });
        
        setDaysUntilReset(15);
      }
    } catch (error) {
      console.error('Error fetching quota data:', error);
    } finally {
      setLoading(false);
    }
  }, [getClinicId, selectedPeriod]);

  useEffect(() => {
    fetchQuotaData();
  }, [fetchQuotaData]);

  const currentPlan = useMemo(() => {
    return QUOTA_PLANS.find(plan => plan.id === quotaData?.plan);
  }, [quotaData?.plan]);

  const utilizationPercentage = quotaData 
    ? Math.round((quotaData.currentUsage / quotaData.monthlyQuota) * 100) 
    : 0;

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-400 bg-red-500/10 border-red-500/20';
    if (percentage >= 70) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  };

  const getUtilizationBarColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-400';
    if (percentage >= 70) return 'bg-yellow-400';
    return 'bg-emerald-400';
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse text-xs uppercase tracking-widest">Loading Quota Data...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10 pb-20 font-sans"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-[0.3em]"
          >
            <Zap className="w-4 h-4" />
            Computational Resource Node
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-white uppercase tracking-tight"
          >
            Quota <span className="text-primary text-glow">Intelligence</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            Monitoring AI orchestration, unit consumption, and predictive scaling.
          </motion.p>
        </div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-4"
        >
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as 'current' | 'last30' | 'last90')}
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest text-white focus:outline-none focus:border-primary/50 transition-all backdrop-blur-md shadow-sm"
          >
            <option value="current">Active Cycle</option>
            <option value="last30">Standard 30D</option>
            <option value="last90">Quarterly 90D</option>
          </select>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 px-8 py-3 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-[0.1em] shadow-premium hover:brightness-110 transition-all active:scale-95 text-xs"
          >
            <Package className="w-4 h-4 stroke-[3px]" />
            <span>Scale Capacity</span>
          </motion.button>
        </motion.div>
      </div>

      {/* Current Plan Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-premium p-10 rounded-[48px] border border-white/10 space-y-10 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity duration-700">
              <BarChart3 className="w-48 h-48 text-primary" />
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20 shadow-premium">
                  <Activity className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">System <span className="text-primary">Utilization</span></h2>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Real-time Consumption Metrics</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-5 py-3 bg-white/5 border border-white/10 rounded-[20px] backdrop-blur-md">
                <Clock className="w-4 h-4 text-primary/60" />
                <span className="text-[11px] font-black text-white uppercase tracking-widest">{daysUntilReset} Cycles to Reset</span>
              </div>
            </div>

            {/* Usage Progress */}
            <div className="space-y-6 relative z-10">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Neural Bandwidth</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-white tracking-tighter tabular-nums">{quotaData?.currentUsage || 0}</span>
                    <span className="text-lg font-bold text-muted-foreground uppercase tracking-widest">/ {quotaData?.monthlyQuota || 0} Scans</span>
                  </div>
                </div>
                <div className={cn(
                  "px-4 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-all duration-500",
                  getUtilizationColor(utilizationPercentage)
                )}>
                  <Target className="w-4 h-4" />
                  {utilizationPercentage}% Node Load
                </div>
              </div>
              
              <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                  className={cn(
                    "h-full rounded-full shadow-[0_0_15px_rgba(255,255,255,0.2)]",
                    getUtilizationBarColor(utilizationPercentage)
                  )}
                />
              </div>
            </div>

            {/* Usage Statistics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
              {[
                { label: 'Validated', value: usageStats?.successfulScans || 0, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                { label: 'Exceptions', value: usageStats?.failedScans || 0, color: 'text-rose-400', bg: 'bg-rose-500/10' },
                { label: 'Economics', value: '฿' + (usageStats?.totalCost || 0).toLocaleString(), color: 'text-primary', bg: 'bg-primary/10' },
                { label: 'Peak Cycle', value: usageStats?.peakUsageDay || 'N/A', color: 'text-purple-400', bg: 'bg-purple-500/10' }
              ].map((stat, i) => (
                <motion.div 
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="p-5 bg-white/5 border border-white/5 rounded-[32px] hover:border-white/10 transition-all text-center group/stat"
                >
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2 opacity-60 group-hover/stat:opacity-100 transition-opacity">{stat.label}</p>
                  <p className={cn("text-xl font-black tracking-tight", stat.color)}>{stat.value}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Available Plans - Interactive Grid */}
          <div className="space-y-8">
            <div className="flex items-center justify-between px-4">
              <h3 className="text-xl font-black text-white uppercase tracking-[0.2em]">Deployment <span className="text-primary">Tiers</span></h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Optimized for Clinical Scale</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {QUOTA_PLANS.map((plan, i) => {
                const isCurrentPlan = plan.id === quotaData?.plan;
                
                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                    whileHover={{ y: -8 }}
                    className={cn(
                      "p-8 rounded-[40px] border transition-all duration-500 relative overflow-hidden group/plan",
                      isCurrentPlan 
                        ? "border-primary/50 bg-primary/10 shadow-[0_0_30px_rgba(var(--primary),0.1)]" 
                        : "border-white/10 bg-white/5 hover:border-primary/30",
                      plan.recommended && "ring-1 ring-primary/20"
                    )}
                  >
                    {plan.recommended && (
                      <div className="absolute top-6 right-6">
                        <span className="px-3 py-1 bg-primary/20 border border-primary/30 text-primary text-[9px] font-black uppercase tracking-widest rounded-full shadow-[0_0_15px_rgba(var(--primary),0.2)]">
                          Elite Choice
                        </span>
                      </div>
                    )}

                    {isCurrentPlan && (
                      <div className="absolute top-6 right-6">
                        <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-full shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                          Active Node
                        </span>
                      </div>
                    )}

                    <div className="space-y-8 relative z-10">
                      <div>
                        <h3 className="text-2xl font-black text-white tracking-tight uppercase group-hover/plan:text-primary transition-colors">{plan.name}</h3>
                        <p className="text-[11px] text-muted-foreground font-light italic mt-1">{plan.description}</p>
                      </div>

                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-white tracking-tighter tabular-nums">฿{plan.monthlyPrice.toLocaleString()}</span>
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">/ Month Cycle</span>
                      </div>

                      <div className="space-y-4 pt-6 border-t border-white/5">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Neural Bandwidth</span>
                          <span className="text-xs font-black text-white">{plan.monthlyQuota} Operational Scans</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Overage Delta</span>
                          <span className="text-xs font-black text-primary">฿{plan.scanPrice} / Unit</span>
                        </div>
                      </div>

                      <div className="space-y-2.5 pt-4">
                        {Object.entries(plan.features).map(([key, enabled]) => (
                          <div key={key} className="flex items-center gap-3">
                            {enabled ? (
                              <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                              </div>
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-white/10 flex items-center justify-center">
                                <X className="w-2 h-2 text-white/10" />
                              </div>
                            )}
                            <span className={cn(
                              "text-[10px] font-bold uppercase tracking-widest",
                              enabled ? "text-white/80" : "text-white/20"
                            )}>
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                          </div>
                        ))}
                      </div>

                      <motion.button
                        disabled={isCurrentPlan}
                        whileHover={!isCurrentPlan ? { scale: 1.02 } : {}}
                        whileTap={!isCurrentPlan ? { scale: 0.98 } : {}}
                        className={cn(
                          "w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                          isCurrentPlan
                            ? "bg-white/5 text-white/20 border border-white/10 cursor-not-allowed"
                            : "bg-primary text-primary-foreground shadow-premium hover:brightness-110"
                        )}
                      >
                        {isCurrentPlan ? 'Current Intelligence Tier' : 'Synchronize Plan'}
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Intelligence & Details */}
        <div className="space-y-10">
          {/* Plan Intelligence Card */}
          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-premium p-8 rounded-[40px] border border-white/10 space-y-8 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
              <Sparkles className="w-24 h-24 text-primary" />
            </div>
            
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20 shadow-premium">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Active <span className="text-primary text-glow">Intelligence</span></h3>
            </div>

            <div className="space-y-6 relative z-10">
              <div className="p-6 bg-white/5 rounded-[32px] border border-white/10 space-y-4 hover:border-primary/30 transition-all duration-500">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{currentPlan?.name} Tier</span>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                </div>
                <p className="text-[11px] text-muted-foreground font-light leading-relaxed italic">{currentPlan?.description}</p>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Asset Privileges</p>
                <div className="space-y-2.5">
                  {quotaData && Object.entries(quotaData.features).map(([key, enabled]) => (
                    <div key={key} className="flex items-center justify-between p-3.5 bg-black/20 rounded-2xl border border-white/5 group hover:border-white/10 transition-all">
                      <span className="text-[10px] font-bold text-white uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      {enabled ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-white/10" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>

          {/* Smart Recommendations */}
          <AnimatePresence>
            {recommendations && (
              <motion.section 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="glass-premium p-8 rounded-[40px] border border-primary/30 bg-primary/5 space-y-8 relative overflow-hidden"
              >
                <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-primary/10 blur-[50px] rounded-full" />
                
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-lg">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">Growth <span className="text-emerald-400">Optimization</span></h3>
                </div>
                
                <div className="space-y-6 relative z-10">
                  <div className="p-5 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md">
                    <p className="text-xs text-white/80 font-light leading-relaxed italic">
                    &quot;{recommendations.reasoning}&quot;
                    </p>
                  </div>
                  
                  {recommendations.recommendedPlan && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Suggested Tier</span>
                        {recommendations.potentialSavings && (
                          <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-full">
                            Save ฿{recommendations.potentialSavings.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="p-5 bg-primary text-primary-foreground rounded-[28px] shadow-premium group cursor-pointer hover:brightness-110 transition-all">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Upgrade Path</p>
                            <p className="text-lg font-black uppercase tracking-tight">{QUOTA_PLANS.find(p => p.id === recommendations.recommendedPlan)?.name}</p>
                          </div>
                          <ArrowUpRight className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Billing Context */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="glass-card p-8 rounded-[40px] border border-white/10 space-y-6 relative overflow-hidden group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground border border-white/5">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Financial Node</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl hover:bg-white/[0.08] transition-all">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Next Billing Cycle</span>
                <span className="text-xs font-black text-white">{new Date(quotaData?.resetDate || '').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] text-white hover:bg-white/10 transition-all active:scale-95 shadow-sm">
                Access Billing Vault
              </button>
            </div>
          </motion.section>
        </div>
      </div>
    </motion.div>
  );
}
