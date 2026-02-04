'use client';

import { ReactNode } from 'react';
import CountUp from 'react-countup';
import { cn } from '@/lib/utils';
import { TrendUp, TrendDown } from '@phosphor-icons/react';

interface StatCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  trend?: number;
  trendLabel?: string;
  icon?: ReactNode;
  iconBg?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  trend,
  trendLabel = 'vs last period',
  icon,
  iconBg = 'bg-primary/10',
  className,
}: StatCardProps) {
  const isPositiveTrend = trend && trend > 0;
  const isNegativeTrend = trend && trend < 0;

  return (
    <div
      className={cn(
        "relative p-6 rounded-xl bg-card border border-border",
        "shadow-card hover:shadow-card-hover transition-all duration-300",
        "group hover:-translate-y-0.5",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {title}
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-foreground">
              {prefix}
              <CountUp
                end={value}
                decimals={decimals}
                duration={2}
                separator=","
                preserveValue
              />
              {suffix}
            </span>
          </div>
          
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded",
                  isPositiveTrend && "text-success bg-success/10",
                  isNegativeTrend && "text-destructive bg-destructive/10",
                  !isPositiveTrend && !isNegativeTrend && "text-muted-foreground bg-muted"
                )}
              >
                {isPositiveTrend && <TrendUp weight="bold" className="w-3 h-3" />}
                {isNegativeTrend && <TrendDown weight="bold" className="w-3 h-3" />}
                {trend > 0 ? '+' : ''}{trend}%
              </span>
              <span className="text-xs text-muted-foreground">{trendLabel}</span>
            </div>
          )}
        </div>

        {icon && (
          <div
            className={cn(
              "flex items-center justify-center w-12 h-12 rounded-xl",
              "transition-transform duration-300 group-hover:scale-110",
              iconBg
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

interface StatCardGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatCardGrid({ children, columns = 4, className }: StatCardGridProps) {
  return (
    <div
      className={cn(
        "grid gap-4",
        columns === 2 && "grid-cols-1 sm:grid-cols-2",
        columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        columns === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
        className
      )}
    >
      {children}
    </div>
  );
}
