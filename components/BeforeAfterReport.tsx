import React, { useMemo } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { type FaceMeasurement } from '@/hooks/useFaceMeasurement';

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
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Facial Symmetry</h3>
          <div className="text-2xl font-bold text-white">
            +{comparisonData.asymmetryImprovement}%
          </div>
          <div className="text-xs text-emerald-400">Improved</div>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Volume Restoration</h3>
          <div className="text-2xl font-bold text-white">
            +{(comparisonData.volumeImprovement.reduce((a, b) => a + b, 0) / 3).toFixed(1)}%
          </div>
          <div className="text-xs text-emerald-400">Average improvement</div>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Wrinkle Reduction</h3>
          <div className="text-2xl font-bold text-white">
            +{comparisonData.wrinkleImprovement}%
          </div>
          <div className="text-xs text-emerald-400">Smoother skin</div>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-lg font-semibold text-white mb-4">Overall Improvement</h3>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8' }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#94a3b8' }} />
            <Radar
              name="Before"
              dataKey="before"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
            />
            <Radar
              name="After"
              dataKey="after"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.3}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0,0,0,0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Volume Analysis */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-lg font-semibold text-white mb-4">Volume Analysis by Region</h3>
        <div className="space-y-3">
          {['Left Cheek', 'Center', 'Right Cheek'].map((region, index) => (
            <div key={region} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{region}</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${comparisonData.volumeImprovement[index]}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-white min-w-[50px] text-right">
                  +{comparisonData.volumeImprovement[index]}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Treatment Summary */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-lg font-semibold text-white mb-4">Treatment Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Treatment Type</span>
            <span className="text-white font-medium capitalize">{treatmentType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Overall Improvement</span>
            <span className="text-white font-medium">
              +{(
                comparisonData.asymmetryImprovement * 0.3 +
                comparisonData.volumeImprovement.reduce((a, b) => a + b, 0) * 0.4 / 3 +
                comparisonData.wrinkleImprovement * 0.3
              ).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Recommended Sessions</span>
            <span className="text-white font-medium">
              {treatmentType === 'filler' ? '1-2' : treatmentType === 'laser' ? '3-4' : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
