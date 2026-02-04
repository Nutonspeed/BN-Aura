'use client';

import { motion } from 'framer-motion';
import { Ticket, Clock, CheckCircle, Warning } from '@phosphor-icons/react';
import { useSupportContext } from '../context';

export default function SupportStats() {
  const { stats } = useSupportContext();

  if (!stats) return null;

  const statsCards = [
    {
      title: 'Total Tickets',
      value: stats.total,
      icon: Ticket,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20'
    },
    {
      title: 'Open Tickets',
      value: stats.open,
      icon: Clock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20'
    },
    {
      title: 'In Progress',
      value: stats.in_progress,
      icon: AlertTriangle,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20'
    },
    {
      title: 'Resolved',
      value: stats.resolved,
      icon: CheckCircle,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsCards.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="glass-card p-6 rounded-2xl border border-white/10"
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 ${stat.bgColor} rounded-xl`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-white/60 text-sm">{stat.title}</p>
            </div>
          </div>

          {/* Progress indicator for resolved tickets */}
          {stat.title === 'Resolved' && stats.total > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-white/60 mb-2">
                <span>Resolution Rate</span>
                <span>{Math.round((stats.resolved / stats.total) * 100)}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(stats.resolved / stats.total) * 100}%` }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                  className="h-2 bg-emerald-400 rounded-full"
                />
              </div>
            </div>
          )}

          {/* Priority indicator for high priority tickets */}
          {stat.title === 'Total Tickets' && stats.high_priority > 0 && (
            <div className="mt-4 flex items-center gap-2">
              <Warning className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400">
                {stats.high_priority} high priority
              </span>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
