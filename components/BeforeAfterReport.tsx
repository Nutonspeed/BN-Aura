import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { type FaceMeasurement } from '@/hooks/useFaceMeasurement';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { ChartLineUp, Pulse, Sparkle, Target, Clock, ShieldCheck } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface BeforeAfterReportProps {
  before: FaceMeasurement;
  after: FaceMeasurement;
  treatmentType: string;
}

export default function BeforeAfterReport({ before, after, treatmentType }: BeforeAfterReportProps) {
  const comparisonData = useMemo(() => {
    const asymmetryImprovement = ((before.facialAsymmetry - after.facialAsymmetry) / before.facialAsymmetry * 100).toFixed(1);
    const volumeImprovement = before.volumeLoss.map((b, i) => 
      ((b - after.volumeLoss[i]) / b * 100).toFixed(1)
    );
    const wrinkleImprovement = ((before.wrinkleDepth - after.wrinkleDepth) / before.wrinkleDepth * 100).toFixed(1);

    return {
      asymmetryImprovement: parseFloat(asymmetryImprovement),
      volumeImprovement: volumeImprovement.map(v => parseFloat(v)),
      wrinkleImprovement: parseFloat(wrinkleImprovement),
    };
  }, [before, after]);

  const radarData = [
    {
      metric: 'Symmetry',
      before: 100 - before.facialAsymmetry,
      after: 100 - after.facialAsymmetry,
    },
    {
      metric: 'Volume',
      before: 100 - (before.volumeLoss.reduce((a, b) => a + b, 0) / 3),
      after: 100 - (after.volumeLoss.reduce((a, b) => a + b, 0) / 3),
    },
    {
      metric: 'Smoothness',
      before: 100 - before.wrinkleDepth,
      after: 100 - after.wrinkleDepth,
    },
    {
      metric: 'Texture',
      before: 100 - before.skinTexture,
      after: 100 - after.skinTexture,
    },
    {
      metric: 'Pore Size',
      before: 100 - before.poreSize,
      after: 100 - after.poreSize,
    },
  ];

  return (
    <div className="space-y-8 font-sans">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Facial Symmetry"
          value={comparisonData.asymmetryImprovement}
          suffix="%"
          decimals={1}
          icon={Target}
          trend="up"
          trendColor="text-emerald-500"
          iconColor="text-primary"
        />
        <StatCard
          title="Volume Restoration"
          value={parseFloat((comparisonData.volumeImprovement.reduce((a, b) => a + b, 0) / 3).toFixed(1))}
          suffix="%"
          decimals={1}
          icon={Sparkle}
          trend="up"
          trendColor="text-emerald-500"
          iconColor="text-blue-500"
        />
        <StatCard
          title="Wrinkle Reduction"
          value={comparisonData.wrinkleImprovement}
          suffix="%"
          decimals={1}
          icon={ChartLineUp}
          trend="up"
          trendColor="text-emerald-500"
          iconColor="text-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Radar Chart */}
        <Card className="relative overflow-hidden group border-border/50">
          <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <Activity className="w-48 h-48 text-primary" />
          </div>
          
          <CardHeader className="border-b border-border/50 pb-6 px-8">
            <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3">
              <Activity weight="duotone" className="w-5 h-5 text-primary" />
              Consolidated Improvement Matrix
            </CardTitle>
          </CardHeader>

          <CardContent className="p-8">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="currentColor" opacity={0.1} />
                  <PolarAngleAxis 
                    dataKey="metric" 
                    tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 'bold', opacity: 0.6 }} 
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    tick={false}
                    axisLine={false}
                  />
                  <Radar
                    name="Origin Node"
                    dataKey="before"
                    stroke="var(--primary)"
                    strokeOpacity={0.4}
                    fill="var(--primary)"
                    fillOpacity={0.1}
                  />
                  <Radar
                    name="Optimized Node"
                    dataKey="after"
                    stroke="#10b981"
                    strokeWidth={3}
                    fill="#10b981"
                    fillOpacity={0.2}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '16px',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
                    }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex justify-center gap-6 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary/40" />
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Temporal Origin</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Current Optimization</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          {/* Volume Analysis */}
          <Card className="border-border/50">
            <CardHeader className="border-b border-border/50 pb-4 px-8">
              <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3">
                <Sparkle weight="duotone" className="w-5 h-5 text-blue-500" />
                Regional Volume Delta
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {['Left Cheek Node', 'Orbital Node', 'Right Cheek Node'].map((region, index) => (
                <div key={region} className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-foreground/70 uppercase tracking-widest">{region}</span>
                    <span className="text-xs font-black text-emerald-500 tabular-nums">+{comparisonData.volumeImprovement[index]}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden border border-border shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${comparisonData.volumeImprovement[index]}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                      className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full shadow-glow-sm"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Treatment Summary */}
          <Card className="relative overflow-hidden border-primary/10 bg-primary/[0.02]">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/20">
                  <ShieldCheck weight="duotone" className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-black text-foreground uppercase tracking-tight">Node Optimization Summary</h4>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Clinical validation</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-card border border-border/50 rounded-2xl">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Protocol Node</p>
                  <p className="text-sm font-bold text-foreground capitalize tracking-tight">{treatmentType}</p>
                </div>
                <div className="p-4 bg-card border border-border/50 rounded-2xl">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Cumulative Delta</p>
                  <p className="text-sm font-black text-emerald-500 tabular-nums">
                    +{(
                      comparisonData.asymmetryImprovement * 0.3 +
                      comparisonData.volumeImprovement.reduce((a, b) => a + b, 0) * 0.4 / 3 +
                      comparisonData.wrinkleImprovement * 0.3
                    ).toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-2xl border border-border shadow-inner">
                <div className="flex items-center gap-3">
                  <Clock weight="bold" className="w-4 h-4 text-primary/60" />
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Recommended Refinement Cycles</span>
                </div>
                <Badge variant="default" className="font-black tabular-nums">
                  {treatmentType === 'filler' ? '1-2 Nodes' : treatmentType === 'laser' ? '3-4 Nodes' : 'N/A'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}