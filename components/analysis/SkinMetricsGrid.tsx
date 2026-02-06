'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface SkinMetric {
  id: string;
  name: string;
  nameThai: string;
  score: number;
  severity: string;
  affectedArea?: number;
  detectedCount?: number;
}

interface SkinMetricsGridProps {
  metrics: SkinMetric[];
  onMetricClick?: (metric: SkinMetric) => void;
}

const getSeverityColor = (score: number): string => {
  if (score >= 80) return 'from-green-500 to-emerald-600';
  if (score >= 60) return 'from-lime-500 to-green-600';
  if (score >= 40) return 'from-yellow-500 to-orange-500';
  if (score >= 20) return 'from-orange-500 to-red-500';
  return 'from-red-500 to-red-700';
};

const getSeverityBg = (score: number): string => {
  if (score >= 80) return 'bg-green-500/10 border-green-500/30';
  if (score >= 60) return 'bg-lime-500/10 border-lime-500/30';
  if (score >= 40) return 'bg-yellow-500/10 border-yellow-500/30';
  if (score >= 20) return 'bg-orange-500/10 border-orange-500/30';
  return 'bg-red-500/10 border-red-500/30';
};

const getMetricIcon = (id: string): string => {
  const icons: Record<string, string> = {
    spots: '⚫',
    wrinkles: '〰️',
    texture: '🔲',
    pores: '⭕',
    uvSpots: '☀️',
    brownSpots: '🟤',
    redAreas: '🔴',
    porphyrins: '🟣',
  };
  return icons[id] || '📊';
};

export default function SkinMetricsGrid({ metrics, onMetricClick }: SkinMetricsGridProps) {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  const handleClick = (metric: SkinMetric) => {
    setSelectedMetric(metric.id);
    onMetricClick?.(metric);
  };

  return (
    <div className="w-full">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span className="text-2xl">📊</span>
        8 Skin Metrics Analysis
        <span className="text-sm font-normal text-muted-foreground ml-2">VISIA-Equivalent</span>
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metrics.map((metric) => (
          <Card
            key={metric.id}
            className={cn(
              'cursor-pointer transition-all duration-300 hover:scale-105 border-2',
              getSeverityBg(metric.score),
              selectedMetric === metric.id && 'ring-2 ring-primary'
            )}
            onClick={() => handleClick(metric)}
          >
            <CardContent className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{getMetricIcon(metric.id)}</span>
                <span className={cn(
                  'text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent',
                  getSeverityColor(metric.score)
                )}>
                  {metric.score}%
                </span>
              </div>
              
              {/* Name */}
              <div className="mb-2">
                <p className="font-semibold text-sm">{metric.name}</p>
                <p className="text-xs text-muted-foreground">{metric.nameThai}</p>
              </div>
              
              {/* Progress Bar */}
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full bg-gradient-to-r transition-all duration-500',
                    getSeverityColor(metric.score)
                  )}
                  style={{ width: `${metric.score}%` }}
                />
              </div>
              
              {/* Stats */}
              {(metric.detectedCount !== undefined || metric.affectedArea !== undefined) && (
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  {metric.detectedCount !== undefined && (
                    <span>พบ {metric.detectedCount} จุด</span>
                  )}
                  {metric.affectedArea !== undefined && (
                    <span>{metric.affectedArea}% ของใบหน้า</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-600" />
          <span>ดีเยี่ยม (80-100)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-lime-500 to-green-600" />
          <span>ดี (60-79)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500" />
          <span>ปานกลาง (40-59)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500" />
          <span>ควรปรับปรุง (20-39)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-red-700" />
          <span>ต้องดูแล (0-19)</span>
        </div>
      </div>
    </div>
  );
}
