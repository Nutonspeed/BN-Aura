import { motion } from 'framer-motion';
import { DollarSign, Package, AlertTriangle, TrendingUp } from 'lucide-react';
import { BillingStats } from '../hooks/useBillingData';

interface BillingStatsCardsProps {
  stats: BillingStats;
  formatCurrency: (amount: number) => string;
}

export default function BillingStatsCards({ stats, formatCurrency }: BillingStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-800 p-6 rounded-2xl border-2 border-slate-700 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-emerald-500/20 rounded-xl">
            <DollarSign className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
        <div>
          <p className="text-3xl font-bold text-white">{formatCurrency(stats.mrr)}</p>
          <p className="text-gray-400 text-sm font-medium">Monthly Recurring Revenue</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-800 p-6 rounded-2xl border-2 border-slate-700 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-blue-500/20 rounded-xl">
            <Package className="w-6 h-6 text-blue-400" />
          </div>
        </div>
        <div>
          <p className="text-3xl font-bold text-white">{stats.activeSubscriptions}</p>
          <p className="text-gray-400 text-sm font-medium">Active Subscriptions</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-slate-800 p-6 rounded-2xl border-2 border-slate-700 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-amber-500/20 rounded-xl">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          </div>
        </div>
        <div>
          <p className="text-3xl font-bold text-white">{stats.pastDueCount}</p>
          <p className="text-gray-400 text-sm font-medium">Past Due Accounts</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-slate-800 p-6 rounded-2xl border-2 border-slate-700 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-red-500/20 rounded-xl">
            <TrendingUp className="w-6 h-6 text-red-400" />
          </div>
        </div>
        <div>
          <p className="text-3xl font-bold text-white">{stats.churnRate.toFixed(1)}%</p>
          <p className="text-gray-400 text-sm font-medium">Churn Rate</p>
        </div>
      </motion.div>
    </div>
  );
}
