'use client';

import { motion } from 'framer-motion';
import { 
  Ticket,
  Clock,
  CheckCircle,
  Warning,
  Pulse,
  ChartBar,
  Icon
} from '@phosphor-icons/react';
import { useSupportContext } from '../context';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export default function SupportStats() {
  const { stats } = useSupportContext();

  if (!stats) return null;

  const statsCards = [
    {
      title: 'Total Registry',
      value: stats.total,
      icon: Ticket as any,
      color: 'text-blue-500'
    },
    {
      title: 'Active Flux',
      value: stats.open,
      icon: Clock as any,
      color: 'text-amber-500'
    },
    {
      title: 'Processing Nodes',
      value: stats.in_progress,
      icon: Warning as any,
      color: 'text-orange-500'
    },
    {
      title: 'Settled Tickets',
      value: stats.resolved,
      icon: CheckCircle as any,
      color: 'text-emerald-500'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {statsCards.map((stat, index) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            iconColor={stat.color}
            className="p-4"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Resolution Matrix Node */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-8 rounded-[40px] border border-border/50 bg-secondary/30 shadow-inner group overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <ChartBar weight="fill" className="w-32 h-32 text-primary" />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Pulse weight="duotone" className="w-5 h-5 text-emerald-500" />
                <h4 className="text-[10px] font-black text-foreground uppercase tracking-[0.3em]">Resolution Efficiency</h4>
              </div>
              <span className="text-2xl font-black text-emerald-500 tabular-nums">
                {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 100}%
              </span>
            </div>
            <div className="w-full bg-card border border-border/50 rounded-full h-2 overflow-hidden p-0.5 shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 100}%` }}
                transition={{ delay: 0.6, duration: 1, ease: "circOut" }}
                className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.4)]"
              />
            </div>
            <p className="text-[10px] text-muted-foreground font-medium italic opacity-60">
              Measuring the velocity of protocol resolution across global support nodes.
            </p>
          </div>
        </motion.div>

        {/* Priority Oversight Node */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-8 rounded-[40px] border border-border/50 bg-secondary/30 shadow-inner group overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <Warning weight="fill" className="w-32 h-32 text-rose-500" />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Warning weight="duotone" className="w-5 h-5 text-rose-500" />
                <h4 className="text-[10px] font-black text-foreground uppercase tracking-[0.3em]">Critical Oversight</h4>
              </div>
              <Badge variant="destructive" size="sm" className="font-black text-[10px] tracking-widest px-3 py-1">
                {stats.high_priority} EXCEPTIONS
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground font-medium italic leading-relaxed opacity-80">
              Currently monitoring {stats.high_priority} high-priority clinical tickets requiring immediate administrative synchronization.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}