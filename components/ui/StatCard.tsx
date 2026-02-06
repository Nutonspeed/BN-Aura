'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { ArrowUp, ArrowDown } from '@phosphor-icons/react';
import { ComponentType } from 'react';

interface StatCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  change?: number;
  changeLabel?: string;
  icon?: ComponentType<any>;
  iconColor?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
  decimals?: number;
}

export function StatCard({
  title,
  value,
  prefix = '',
  suffix = '',
  change,
  changeLabel,
  icon: Icon,
  iconColor = 'text-primary',
  trend = 'neutral',
  className,
  decimals = 0,
}: StatCardProps) {
  const trendColor = trend === 'up' 
    ? 'text-success bg-success/10' 
    : trend === 'down' 
      ? 'text-destructive bg-destructive/10' 
      : 'text-muted-foreground bg-muted';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "bg-card rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all duration-200",
        "border border-border/50",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-foreground">
              {prefix}
              <CountUp
                end={value}
                duration={2}
                separator=","
                decimals={decimals}
              />
              {suffix}
            </span>
          </div>
          {change !== undefined && (
            <div className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", trendColor)}>
              {trend === 'up' ? (
                <ArrowUp weight="bold" className="w-3 h-3" />
              ) : trend === 'down' ? (
                <ArrowDown weight="bold" className="w-3 h-3" />
              ) : null}
              <span>{change > 0 ? '+' : ''}{change}%</span>
              {changeLabel && <span className="text-muted-foreground ml-1">{changeLabel}</span>}
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn("p-3 rounded-xl bg-primary/10", iconColor)}>
            <Icon className="w-6 h-6" weight="duotone" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-card rounded-xl p-6 shadow-card border border-border/50 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-8 w-32 bg-muted rounded" />
          <div className="h-5 w-20 bg-muted rounded-full" />
        </div>
        <div className="w-12 h-12 bg-muted rounded-xl" />
      </div>
    </div>
  );
}