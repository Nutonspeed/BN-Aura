'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { CountUp, FadeIn, ProgressBar } from '@/components/ui/Animations';
import { Sparkline, ScoreRing } from '@/components/charts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Camera,
  Calendar,
  DollarSign,
  Activity,
  Clock,
  Target,
  Zap,
} from 'lucide-react';

// Stat Card Widget
interface StatCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  color?: string;
  sparklineData?: number[];
  className?: string;
}

export function StatCard({
  title,
  value,
  prefix = '',
  suffix = '',
  change,
  changeLabel = 'vs last period',
  icon,
  color = '#8B5CF6',
  sparklineData,
  className,
}: StatCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <FadeIn>
      <Card className={cn('relative overflow-hidden', className)}>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm text-muted-foreground">{title}</span>
            {icon && (
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${color}20` }}
              >
                {icon}
              </div>
            )}
          </div>
          
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold">
                <CountUp end={value} prefix={prefix} suffix={suffix} />
              </p>
              {change !== undefined && (
                <p className={cn(
                  'text-xs flex items-center gap-1 mt-1',
                  isPositive && 'text-green-500',
                  isNegative && 'text-red-500',
                  !isPositive && !isNegative && 'text-muted-foreground'
                )}>
                  {isPositive && <TrendingUp size={12} />}
                  {isNegative && <TrendingDown size={12} />}
                  {isPositive && '+'}{change}% {changeLabel}
                </p>
              )}
            </div>
            
            {sparklineData && sparklineData.length > 0 && (
              <Sparkline data={sparklineData} color={color} width={60} height={30} />
            )}
          </div>
        </CardContent>
      </Card>
    </FadeIn>
  );
}

// Quick Actions Widget
interface QuickAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: string;
}

interface QuickActionsProps {
  actions: QuickAction[];
  className?: string;
}

export function QuickActions({ actions, className }: QuickActionsProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <h3 className="font-semibold mb-3">Quick Actions</h3>
        <div className="grid grid-cols-4 gap-2">
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={action.onClick}
              className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${action.color || '#8B5CF6'}20` }}
              >
                {action.icon}
              </div>
              <span className="text-xs text-center">{action.label}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Today's Summary Widget
interface TodaySummaryProps {
  scans: number;
  bookings: number;
  revenue: number;
  customers: number;
  className?: string;
}

export function TodaySummary({ scans, bookings, revenue, customers, className }: TodaySummaryProps) {
  return (
    <Card className={cn('bg-gradient-to-br from-purple-500/10 to-pink-500/10', className)}>
      <CardContent className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Activity size={18} />
          Today's Summary
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Camera size={20} className="text-purple-500" />
            <div>
              <p className="text-xl font-bold"><CountUp end={scans} /></p>
              <p className="text-xs text-muted-foreground">Scans</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar size={20} className="text-blue-500" />
            <div>
              <p className="text-xl font-bold"><CountUp end={bookings} /></p>
              <p className="text-xs text-muted-foreground">Bookings</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DollarSign size={20} className="text-green-500" />
            <div>
              <p className="text-xl font-bold">฿<CountUp end={revenue} /></p>
              <p className="text-xs text-muted-foreground">Revenue</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Users size={20} className="text-amber-500" />
            <div>
              <p className="text-xl font-bold"><CountUp end={customers} /></p>
              <p className="text-xs text-muted-foreground">Customers</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Goal Progress Widget
interface GoalProgressProps {
  goals: {
    name: string;
    current: number;
    target: number;
    color?: string;
  }[];
  className?: string;
}

export function GoalProgress({ goals, className }: GoalProgressProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Target size={18} />
          Monthly Goals
        </h3>
        <div className="space-y-4">
          {goals.map((goal, i) => {
            const percentage = Math.round((goal.current / goal.target) * 100);
            return (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{goal.name}</span>
                  <span className="font-medium">
                    {goal.current}/{goal.target} ({percentage}%)
                  </span>
                </div>
                <ProgressBar 
                  value={goal.current} 
                  max={goal.target} 
                  color={goal.color || '#8B5CF6'} 
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Recent Activity Widget
interface ActivityItem {
  type: 'scan' | 'booking' | 'payment' | 'customer';
  title: string;
  time: string;
  meta?: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
  className?: string;
}

export function RecentActivity({ activities, className }: RecentActivityProps) {
  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'scan': return <Camera size={14} className="text-purple-500" />;
      case 'booking': return <Calendar size={14} className="text-blue-500" />;
      case 'payment': return <DollarSign size={14} className="text-green-500" />;
      case 'customer': return <Users size={14} className="text-amber-500" />;
    }
  };

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Clock size={18} />
          Recent Activity
        </h3>
        <div className="space-y-3">
          {activities.slice(0, 5).map((activity, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="p-1.5 rounded-full bg-muted mt-0.5">
                {getIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{activity.title}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
              {activity.meta && (
                <span className="text-xs text-muted-foreground">{activity.meta}</span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Performance Score Widget
interface PerformanceScoreProps {
  score: number;
  label?: string;
  breakdown?: { name: string; value: number }[];
  className?: string;
}

export function PerformanceScore({ score, label = 'Performance Score', breakdown, className }: PerformanceScoreProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold mb-1">{label}</h3>
            {breakdown && (
              <div className="space-y-1">
                {breakdown.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">{item.name}:</span>
                    <span className="font-medium">{item.value}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <ScoreRing value={score} size={80} />
        </div>
      </CardContent>
    </Card>
  );
}

// Alerts Widget
interface Alert {
  type: 'warning' | 'info' | 'success' | 'error';
  message: string;
  action?: { label: string; onClick: () => void };
}

interface AlertsWidgetProps {
  alerts: Alert[];
  className?: string;
}

export function AlertsWidget({ alerts, className }: AlertsWidgetProps) {
  const getColor = (type: Alert['type']) => {
    switch (type) {
      case 'warning': return 'bg-amber-500/10 border-amber-500/30 text-amber-600';
      case 'info': return 'bg-blue-500/10 border-blue-500/30 text-blue-600';
      case 'success': return 'bg-green-500/10 border-green-500/30 text-green-600';
      case 'error': return 'bg-red-500/10 border-red-500/30 text-red-600';
    }
  };

  if (alerts.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      {alerts.map((alert, i) => (
        <div key={i} className={cn('p-3 rounded-lg border', getColor(alert.type))}>
          <div className="flex items-center justify-between">
            <span className="text-sm">{alert.message}</span>
            {alert.action && (
              <button 
                onClick={alert.action.onClick}
                className="text-xs font-medium underline"
              >
                {alert.action.label}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default {
  StatCard,
  QuickActions,
  TodaySummary,
  GoalProgress,
  RecentActivity,
  PerformanceScore,
  AlertsWidget,
};
