'use client';

import { motion } from 'framer-motion';
import { CurrencyDollar, Buildings, Users, Pulse, TrendUp, ArrowUpRight, ArrowDownRight, Icon } from '@phosphor-icons/react';
import { StatCard } from '@/components/ui/StatCard';

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
      title: 'Global Revenue',
      value: data.revenue.monthly,
      growth: data.revenue.growth,
      icon: CurrencyDollar,
      prefix: '฿',
      trend: data.revenue.growth >= 0 ? 'up' as const : 'down' as const
    },
    {
      title: 'Operational Nodes',
      value: data.clinics.active,
      growth: data.clinics.growth,
      icon: Buildings,
      iconColor: 'text-emerald-500',
      trend: data.clinics.growth >= 0 ? 'up' as const : 'down' as const
    },
    {
      title: 'Neural Registry',
      value: data.users.total,
      growth: data.users.growth,
      icon: Users,
      iconColor: 'text-blue-500',
      trend: data.users.growth >= 0 ? 'up' as const : 'down' as const
    },
    {
      title: 'AI Diagnostic Flux',
      value: data.aiUsage.monthlyScans,
      growth: data.aiUsage.growth,
      icon: Pulse,
      iconColor: 'text-primary',
      trend: data.aiUsage.growth >= 0 ? 'up' as const : 'down' as const
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {metrics.map((metric, index) => (
        <StatCard
          key={metric.title}
          title={metric.title}
          value={metric.value}
          prefix={metric.prefix}
          change={metric.growth}
          trend={metric.trend}
          icon={metric.icon as any}
          iconColor={metric.iconColor}
          className="p-4"
        />
      ))}
    </div>
  );
}
