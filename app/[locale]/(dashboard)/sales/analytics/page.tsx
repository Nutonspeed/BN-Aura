'use client';

import { motion } from 'framer-motion';
import { 
  ChartBar, 
  TrendUp, 
  Users, 
  Funnel
} from '@phosphor-icons/react';
import SalesFunnelChart from '@/components/analytics/SalesFunnelChart';
import CohortAnalysis from '@/components/analytics/CohortAnalysis';
import PredictiveDashboard from '@/components/analytics/PredictiveDashboard';

export default function SalesAnalyticsPage() {
  // Mock Data for Sales Funnel
  const funnelData = [
    { name: 'Lead', value: 1200, percentage: 100 },
    { name: 'Contacted', value: 850, percentage: 70.8 },
    { name: 'Qualified', value: 500, percentage: 58.8 },
    { name: 'Proposal', value: 300, percentage: 60.0 },
    { name: 'Won', value: 180, percentage: 60.0 }
  ];

  // Mock Data for Cohort Analysis
  const cohortData = [
    {
      cohort: 'Oct 2025',
      size: 150,
      retention: { month1: 85, month2: 78, month3: 75, month6: 65, month12: 50 },
      revenue: { total: 4500000, perCustomer: 30000 }
    },
    {
      cohort: 'Nov 2025',
      size: 180,
      retention: { month1: 88, month2: 82, month3: 79, month6: 0, month12: 0 },
      revenue: { total: 5400000, perCustomer: 30000 }
    },
    {
      cohort: 'Dec 2025',
      size: 210,
      retention: { month1: 90, month2: 85, month3: 0, month6: 0, month12: 0 },
      revenue: { total: 7350000, perCustomer: 35000 }
    },
    {
      cohort: 'Jan 2026',
      size: 250,
      retention: { month1: 92, month2: 0, month3: 0, month6: 0, month12: 0 },
      revenue: { total: 10000000, perCustomer: 40000 }
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-12 pb-20"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-[0.3em]"
          >
            <ChartBar className="w-4 h-4" />
            Performance Analytics
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-white uppercase tracking-tight"
          >
            Sales <span className="text-primary text-glow">Insights</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            Deep dive into conversion metrics and customer retention.
          </motion.p>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-3"
        >
          <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white hover:bg-white/10 transition-all active:scale-95 flex items-center gap-2">
            <Funnel className="w-4 h-4 text-muted-foreground" />
            Filter Period
          </button>
          <button className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-bold shadow-premium hover:brightness-110 transition-all active:scale-95">
            Export Report
          </button>
        </motion.div>
      </div>

      {/* AI Predictive Intelligence Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
            <TrendUp className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">AI Predictive Forecast</h2>
            <p className="text-sm text-muted-foreground">Machine learning driven insights for future performance.</p>
          </div>
        </div>
        <PredictiveDashboard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Funnel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <SalesFunnelChart data={funnelData} />
        </motion.div>

        {/* Cohort Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <CohortAnalysis data={cohortData} />
        </motion.div>
      </div>

      {/* Additional Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-6 rounded-2xl border border-white/10"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <TrendUp className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase">Conversion Rate</p>
              <h4 className="text-2xl font-black text-white">15.0%</h4>
            </div>
          </div>
          <p className="text-sm text-emerald-400 font-medium">+2.5% from last month</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-card p-6 rounded-2xl border border-white/10"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase">Retention Rate</p>
              <h4 className="text-2xl font-black text-white">68.0%</h4>
            </div>
          </div>
          <p className="text-sm text-blue-400 font-medium">Top tier performance</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="glass-card p-6 rounded-2xl border border-white/10"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-500/10 rounded-xl">
              <ChartBar className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase">Avg Cycle Time</p>
              <h4 className="text-2xl font-black text-white">14 Days</h4>
            </div>
          </div>
          <p className="text-sm text-purple-400 font-medium">-3 days faster than avg</p>
        </motion.div>
      </div>
    </motion.div>
  );
}
