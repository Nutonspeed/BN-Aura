'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendUp, 
  TrendDown, 
  Users, 
  CurrencyDollar, 
  Target,
  WarningCircle,
  CheckCircle,
  Clock,
  Sparkle
} from '@phosphor-icons/react';

interface BusinessMetric {
  label: string;
  current: number;
  previous: number;
  growth: number;
  formatted: string;
  icon: string;
  trend: 'up' | 'down' | 'stable';
}

interface InsightCardsProps {
  className?: string;
}

export default function InsightCards({ className }: InsightCardsProps) {
  const [metrics, setMetrics] = useState<BusinessMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBusinessMetrics();
  }, []);

  const fetchBusinessMetrics = async () => {
    try {
      const response = await fetch('/api/ai/business-advisor?type=dashboard_summary');
      const result = await response.json();

      if (result.success && result.summary) {
        const { revenue, customers } = result.summary;
        
        const metricsData: BusinessMetric[] = [
          {
            label: 'รายได้ประจำเดือน',
            current: revenue.current,
            previous: revenue.previous,
            growth: revenue.growth,
            formatted: revenue.formatted,
            icon: 'revenue',
            trend: revenue.growth > 0 ? 'up' : revenue.growth < 0 ? 'down' : 'stable'
          },
          {
            label: 'ลูกค้าใหม่',
            current: customers.current,
            previous: customers.previous,
            growth: customers.growth,
            formatted: customers.formatted,
            icon: 'customers',
            trend: customers.growth > 0 ? 'up' : customers.growth < 0 ? 'down' : 'stable'
          }
        ];

        setMetrics(metricsData);
      }
    } catch (error) {
      console.error('Failed to fetch business metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'revenue':
        return <DollarSign className="w-6 h-6" />;
      case 'customers':
        return <Users className="w-6 h-6" />;
      case 'target':
        return <Target className="w-6 h-6" />;
      default:
        return <Sparkles className="w-6 h-6" />;
    }
  };

  const getTrendIcon = (trend: string, growth: number) => {
    if (trend === 'up') {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (trend === 'down') {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
    return <Clock className="w-4 h-4 text-muted-foreground" />;
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'down':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      default:
        return 'text-muted-foreground bg-muted/20 border-border';
    }
  };

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-muted rounded-xl" />
              <div className="w-16 h-6 bg-muted rounded-lg" />
            </div>
            <div className="space-y-2">
              <div className="w-24 h-4 bg-muted rounded" />
              <div className="w-32 h-8 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ y: -5 }}
          className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all duration-300 relative overflow-hidden group"
        >
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Header */}
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className={`p-3 rounded-xl ${
              metric.trend === 'up' ? 'bg-green-500/10 text-green-500' :
              metric.trend === 'down' ? 'bg-red-500/10 text-red-500' :
              'bg-primary/10 text-primary'
            }`}>
              {getIcon(metric.icon)}
            </div>
            
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium ${getTrendColor(metric.trend)}`}>
              {getTrendIcon(metric.trend, metric.growth)}
              <span>
                {metric.growth > 0 ? '+' : ''}{metric.growth.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2 relative z-10">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {metric.label}
            </p>
            <p className="text-3xl font-bold text-foreground">
              {metric.formatted}
            </p>
            
            {/* Comparison */}
            <p className="text-xs text-muted-foreground">
              เปรียบเทียบเดือนที่แล้ว: {
                metric.previous > 0 ? (
                  metric.icon === 'revenue' ? `฿${metric.previous.toLocaleString()}` : `${metric.previous} คน`
                ) : 'ไม่มีข้อมูล'
              }
            </p>
          </div>

          {/* Status Indicator */}
          <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-30 transition-opacity">
            {metric.trend === 'up' ? (
              <CheckCircle className="w-8 h-8 text-green-500" />
            ) : metric.trend === 'down' ? (
              <AlertCircle className="w-8 h-8 text-red-500" />
            ) : (
              <Clock className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
        </motion.div>
      ))}

      {/* Add more metrics button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: metrics.length * 0.1 }}
        className="bg-card border-2 border-dashed border-border rounded-2xl p-6 flex items-center justify-center hover:border-primary/50 transition-colors cursor-pointer group"
        onClick={() => {
          // TODO: Add more metrics or customize dashboard
        }}
      >
        <div className="text-center text-muted-foreground group-hover:text-primary transition-colors">
          <Sparkles className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm font-medium">เพิ่มข้อมูลเพิ่มเติม</p>
          <p className="text-xs opacity-60">คลิกเพื่อปรับแต่ง</p>
        </div>
      </motion.div>
    </div>
  );
}
