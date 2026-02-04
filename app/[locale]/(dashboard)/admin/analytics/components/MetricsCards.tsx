'use client';

import { motion } from 'framer-motion';
import { CurrencyDollar, Buildings, Users, Lightning, TrendUp, ArrowUpRight, ArrowDownRight } from '@phosphor-icons/react';

interface MetricsData {
  revenue: {
    monthly: number;
    growth: number;
  };
  clinics: {
    active: number;
    growth: number;
  };
  users: {
    total: number;
    growth: number;
  };
  aiUsage: {
    monthlyScans: number;
    growth: number;
  };
}

interface MetricsCardsProps {
  data: MetricsData;
  formatCurrency: (amount: number) => string;
  formatNumber: (num: number) => string;
  formatPercentage: (num: number) => string;
}

export default function MetricsCards({ data, formatCurrency, formatNumber, formatPercentage }: MetricsCardsProps) {
  const metrics = [
    {
      title: 'Monthly Revenue',
      value: formatCurrency(data.revenue.monthly),
      growth: data.revenue.growth,
      icon: DollarSign,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/20'
    },
    {
      title: 'Active Clinics',
      value: formatNumber(data.clinics.active),
      growth: data.clinics.growth,
      icon: Building2,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20'
    },
    {
      title: 'Total Users',
      value: formatNumber(data.users.total),
      growth: data.users.growth,
      icon: Users,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20'
    },
    {
      title: 'Monthly AI Scans',
      value: formatNumber(data.aiUsage.monthlyScans),
      growth: data.aiUsage.growth,
      icon: Zap,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="glass-card p-6 rounded-2xl border border-white/10"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 ${metric.bgColor} rounded-xl`}>
              <metric.icon className={`w-6 h-6 ${metric.color}`} />
            </div>
            <div className={`flex items-center gap-1 text-sm font-bold ${
              metric.growth >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {metric.growth >= 0 ? 
                <ArrowUpRight className="w-4 h-4" /> : 
                <ArrowDownRight className="w-4 h-4" />
              }
              {formatPercentage(metric.growth)}
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">{metric.value}</p>
            <p className="text-white/60 text-sm">{metric.title}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
