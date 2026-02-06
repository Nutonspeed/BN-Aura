import { motion } from 'framer-motion';
import { CurrencyDollar, Package, Warning, TrendUp, Coin, Receipt, Clock, Graph, Icon } from '@phosphor-icons/react';
import { BillingStats } from '../hooks/useBillingData';
import { StatCard } from '@/components/ui/StatCard';
import { cn } from '@/lib/utils';

interface BillingStatsCardsProps {
  stats: BillingStats;
  formatCurrency: (amount: number) => string;
}

export default function BillingStatsCards({ stats, formatCurrency }: BillingStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      <StatCard
        title="Monthly Revenue (MRR)"
        value={stats.mrr}
        prefix="฿"
        icon={Coin as Icon}
        trend="up"
        change={12.4}
        className="p-4"
      />
      <StatCard
        title="Active Nodes"
        value={stats.activeSubscriptions}
        icon={Package as Icon}
        className="p-4"
      />
      <StatCard
        title="Past Due Exceptions"
        value={stats.pastDueCount}
        icon={Warning as Icon}
        iconColor={stats.pastDueCount > 0 ? "text-rose-500" : "text-emerald-500"}
        className="p-4"
      />
      <StatCard
        title="Network Churn Rate"
        value={stats.churnRate}
        suffix="%"
        decimals={1}
        icon={Graph as Icon}
        iconColor="text-primary"
        className="p-4"
      />
    </div>
  );
}
