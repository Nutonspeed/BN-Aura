'use client';

import { motion } from 'framer-motion';
import { 
  Users,
  XCircle,
  Shield,
  DeviceMobile,
  TrendUp,
  CheckCircle,
  Warning,
  Icon,
  Pulse,
  ShieldCheck
} from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { StatCard } from '@/components/ui/StatCard';

interface SecurityMetrics {
  activeSessions: number;
  failedLogins: number;
  securityAlerts: number;
  twoFactorEnabled: number;
}

interface SecurityMetricsProps {
  metrics: SecurityMetrics;
  timeRange?: '24h' | '7d' | '30d';
}

export default function SecurityMetrics({ metrics, timeRange = '24h' }: SecurityMetricsProps) {
  const t = useTranslations('admin.security');
  
  const metricCards = [
    {
      title: t('active_sessions'),
      value: metrics.activeSessions,
      trend: '+12% from yesterday',
      trendType: 'up' as const,
      icon: Users,
      iconColor: 'text-blue-500'
    },
    {
      title: t('failed_logins'),
      value: metrics.failedLogins,
      trend: '+5% from yesterday',
      trendType: 'down' as const, // For security, more failed logins is bad
      icon: XCircle,
      iconColor: 'text-rose-500'
    },
    {
      title: t('security_alerts_count'),
      value: metrics.securityAlerts,
      trend: '2 require attention',
      trendType: 'down' as const,
      icon: Shield,
      iconColor: 'text-amber-500'
    },
    {
      title: t('two_factor_enabled'),
      value: metrics.twoFactorEnabled,
      trend: '42% of users',
      trendType: 'up' as const,
      icon: DeviceMobile,
      iconColor: 'text-emerald-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {metricCards.map((card, index) => (
        <StatCard
          key={card.title}
          title={card.title}
          value={card.value}
          icon={card.icon as any}
          iconColor={card.iconColor}
          trend={card.trendType}
          className="p-4"
        />
      ))}
    </div>
  );
}
