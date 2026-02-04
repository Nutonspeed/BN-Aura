'use client';

import { motion } from 'framer-motion';
import { CurrencyDollar } from '@phosphor-icons/react';

interface RevenueChartProps {
  data: { plan: string; amount: number; count: number }[];
  formatCurrency: (amount: number) => string;
}

export default function RevenueChart({ data, formatCurrency }: RevenueChartProps) {
  const maxAmount = Math.max(...data.map(item => item.amount));
  
  const getPlanColor = (index: number) => {
    const colors = ['bg-emerald-400', 'bg-blue-400', 'bg-purple-400', 'bg-amber-400'];
    return colors[index % colors.length];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="glass-card p-8 rounded-3xl border border-white/10"
    >
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
        <DollarSign className="w-5 h-5 text-primary" />
        Revenue by Plan
      </h2>
      
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={item.plan} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${getPlanColor(index)}`} />
                <span className="text-white capitalize">{item.plan}</span>
                <span className="text-white/60 text-sm">({item.count} clinics)</span>
              </div>
              <span className="font-bold text-white">{formatCurrency(item.amount)}</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-white/10 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(item.amount / maxAmount) * 100}%` }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                className={`h-2 rounded-full ${getPlanColor(index)}`}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-white/80">Total Revenue</span>
          <span className="font-bold text-white text-lg">
            {formatCurrency(data.reduce((sum, item) => sum + item.amount, 0))}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
