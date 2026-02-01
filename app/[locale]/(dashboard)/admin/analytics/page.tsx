'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, BarChart3, DollarSign, Zap, Building2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import AnalyticsHeader from './components/AnalyticsHeader';
import MetricsCards from './components/MetricsCards';
import RevenueChart from './components/RevenueChart';
import TopClinicsChart from './components/TopClinicsChart';
import { useAnalyticsData } from './hooks/useAnalyticsData';
import { exportToCSV } from './utils/exportUtils';
import { cn } from '@/lib/utils';

export default function AnalyticsPage() {
  const t = useTranslations('admin.analytics');
  const tCommon = useTranslations('common');
  
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'ai' | 'clinics'>('overview');
  const { analytics, loading, error, refreshData } = useAnalyticsData(selectedPeriod);
  const [refreshing, setRefreshing] = useState(false);

  const tabs = [
    { id: 'overview', label: t('overview'), icon: BarChart3 },
    { id: 'revenue', label: t('revenue'), icon: DollarSign },
    { id: 'ai', label: t('ai_usage'), icon: Zap },
    { id: 'clinics', label: t('clinics'), icon: Building2 }
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleExport = () => {
    if (analytics) {
      const timestamp = new Date().toISOString().split('T')[0];
      exportToCSV(analytics, `analytics-report-${timestamp}`);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('th-TH').format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <AnalyticsHeader
        selectedPeriod={selectedPeriod}
        setSelectedPeriod={setSelectedPeriod}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onExport={handleExport}
      />

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-premium"
                : "text-white/60 hover:text-white hover:bg-white/5"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {analytics && (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {activeTab === 'overview' && (
              <>
                <MetricsCards
                  data={analytics}
                  formatCurrency={formatCurrency}
                  formatNumber={formatNumber}
                  formatPercentage={formatPercentage}
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <RevenueChart
                    data={analytics.revenue.byPlan}
                    formatCurrency={formatCurrency}
                  />

                  <TopClinicsChart
                    data={analytics.aiUsage.topClinics}
                    formatNumber={formatNumber}
                  />
                </div>
              </>
            )}

            {activeTab === 'revenue' && (
              <div className="grid grid-cols-1 gap-8">
                <div className="glass-card p-8 rounded-[32px] border border-white/10">
                  <h3 className="text-xl font-bold text-white mb-6">Revenue Breakdown by Plan</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {analytics.revenue.byPlan.map((plan: any) => (
                      <div key={plan.plan} className="p-6 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-sm text-white/60 uppercase font-black tracking-widest">{plan.plan}</p>
                        <p className="text-2xl font-bold text-white mt-2">{formatCurrency(plan.amount)}</p>
                        <p className="text-sm text-primary font-medium mt-1">{plan.count} clinics</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <RevenueChart
                  data={analytics.revenue.byPlan}
                  formatCurrency={formatCurrency}
                />
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="grid grid-cols-1 gap-8">
                <div className="glass-card p-8 rounded-[32px] border border-white/10">
                  <h3 className="text-xl font-bold text-white mb-6">AI Usage Metrics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-sm text-white/60 uppercase font-black tracking-widest">Monthly Scans</p>
                      <p className="text-3xl font-bold text-white mt-2">{formatNumber(analytics.aiUsage.monthlyScans)}</p>
                      <p className="text-sm text-emerald-400 font-medium mt-1">{formatPercentage(analytics.aiUsage.growth)} from last period</p>
                    </div>
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-sm text-white/60 uppercase font-black tracking-widest">Avg Per Clinic</p>
                      <p className="text-3xl font-bold text-white mt-2">{formatNumber(analytics.aiUsage.avgPerClinic)}</p>
                      <p className="text-sm text-white/40 mt-1">Scans per active clinic</p>
                    </div>
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-sm text-white/60 uppercase font-black tracking-widest">Total Scans (All Time)</p>
                      <p className="text-3xl font-bold text-white mt-2">{formatNumber(analytics.aiUsage.totalScans)}</p>
                    </div>
                  </div>
                </div>

                <TopClinicsChart
                  data={analytics.aiUsage.topClinics}
                  formatNumber={formatNumber}
                />
              </div>
            )}

            {activeTab === 'clinics' && (
              <div className="grid grid-cols-1 gap-8">
                <div className="glass-card p-8 rounded-[32px] border border-white/10">
                  <h3 className="text-xl font-bold text-white mb-6">Clinic Growth Statistics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-sm text-white/60 uppercase font-black tracking-widest">Total Clinics</p>
                      <p className="text-3xl font-bold text-white mt-2">{formatNumber(analytics.clinics.total)}</p>
                    </div>
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-sm text-white/60 uppercase font-black tracking-widest">Active Clinics</p>
                      <p className="text-3xl font-bold text-white mt-2">{formatNumber(analytics.clinics.active)}</p>
                    </div>
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-sm text-white/60 uppercase font-black tracking-widest">New (Period)</p>
                      <p className="text-3xl font-bold text-white mt-2">{formatNumber(analytics.clinics.newThisMonth)}</p>
                      <p className="text-sm text-emerald-400 font-medium mt-1">{formatPercentage(analytics.clinics.growth)} growth</p>
                    </div>
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-sm text-white/60 uppercase font-black tracking-widest">Churn Rate</p>
                      <p className="text-3xl font-bold text-white mt-2">{analytics.clinics.churnRate?.toFixed(1) || '0.0'}%</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  );
}
