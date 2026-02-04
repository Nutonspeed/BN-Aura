'use client';

import { motion } from 'framer-motion';
import { Users, XCircle, Shield, DeviceMobile, TrendUp, CheckCircle, Warning } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';

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
      trendColor: 'text-emerald-400',
      icon: Users,
      iconColor: 'text-blue-400',
      delay: 0.1
    },
    {
      title: t('failed_logins'),
      value: metrics.failedLogins,
      trend: '+5% from yesterday',
      trendColor: 'text-red-400',
      icon: XCircle,
      iconColor: 'text-red-400',
      delay: 0.2
    },
    {
      title: t('security_alerts_count'),
      value: metrics.securityAlerts,
      trend: '2 require attention',
      trendColor: 'text-yellow-400',
      icon: Shield,
      iconColor: 'text-yellow-400',
      delay: 0.3
    },
    {
      title: t('two_factor_enabled'),
      value: metrics.twoFactorEnabled,
      trend: '42% of users',
      trendColor: 'text-emerald-400',
      icon: DeviceMobile,
      iconColor: 'text-emerald-400',
      delay: 0.4
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metricCards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: card.delay }}
          className="bg-slate-800 p-6 rounded-xl border-2 border-slate-600 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm font-semibold">{card.title}</p>
              <p className="text-4xl font-bold text-white">{card.value}</p>
              <p className={`text-sm font-medium flex items-center gap-1 mt-2 ${card.trendColor}`}>
                {card.title === 'Active Sessions' && <TrendUp className="w-4 h-4" />}
                {card.title === 'Failed Logins' && <TrendUp className="w-4 h-4" />}
                {card.title === 'Security Alerts' && <Warning className="w-4 h-4" />}
                {card.title === '2FA Enabled' && <CheckCircle className="w-4 h-4" />}
                {card.trend}
              </p>
            </div>
            <card.icon className={`w-10 h-10 ${card.iconColor}`} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
