'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SpinnerGap, WarningCircle, ChartBar, CurrencyDollar, Lightning, Buildings } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export default function AnalyticsPage() {
  const t = useTranslations('admin.analytics');
  const tCommon = useTranslations('common');
  
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'ai' | 'clinics'>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const tabs = [
    { id: 'overview', label: t('overview'), icon: BarChart3 },
    { id: 'revenue', label: t('revenue'), icon: DollarSign },
    { id: 'ai', label: t('ai_usage'), icon: Zap },
    { id: 'clinics', label: t('clinics'), icon: Building2 }
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simple refresh simulation
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleExport = () => {
    // Simple export simulation
    console.log('Export functionality not implemented yet');
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
        <SpinnerGap className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Simple Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <ChartBar className="w-8 h-8 text-primary" />
            {t('title') || 'Analytics & Reports'}
          </h1>
          <p className="text-white/60 mt-1">{t('description') || 'System analytics and reporting'}</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all flex items-center gap-2"
          >
            {refreshing ? <SpinnerGap className="w-4 h-4 animate-spin" /> : <Lightning className="w-4 h-4" />}
            {tCommon('refresh') || 'Refresh'}
          </button>
        </div>
      </div>

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
          <WarningCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Simple Content */}
      <div className="glass-card p-8 rounded-[32px] border border-white/10">
        <h3 className="text-xl font-bold text-white mb-6">
          {activeTab === 'overview' && 'Overview'}
          {activeTab === 'revenue' && 'Revenue Analytics'}
          {activeTab === 'ai' && 'AI Usage Metrics'}
          {activeTab === 'clinics' && 'Clinic Statistics'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
            <p className="text-sm text-white/60 uppercase font-black tracking-widest">Total Revenue</p>
            <p className="text-3xl font-bold text-white mt-2">{formatCurrency(1250000)}</p>
            <p className="text-sm text-emerald-400 font-medium mt-1">+12.5% from last month</p>
          </div>
          <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
            <p className="text-sm text-white/60 uppercase font-black tracking-widest">Active Clinics</p>
            <p className="text-3xl font-bold text-white mt-2">20</p>
            <p className="text-sm text-white/40 mt-1">Across all regions</p>
          </div>
          <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
            <p className="text-sm text-white/60 uppercase font-black tracking-widest">AI Scans</p>
            <p className="text-3xl font-bold text-white mt-2">8,432</p>
            <p className="text-sm text-emerald-400 font-medium mt-1">+8.2% from last month</p>
          </div>
        </div>
        <div className="mt-8 p-6 bg-white/5 rounded-2xl border border-white/5">
          <p className="text-white/60 text-center">
            {t('coming_soon') || 'Detailed analytics features coming soon...'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
