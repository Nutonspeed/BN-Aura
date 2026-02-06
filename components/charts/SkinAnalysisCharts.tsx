'use client';

import { cn } from '@/lib/utils';

interface ChartProps {
  className?: string;
}

// Radar Chart for 8 Skin Metrics
interface RadarChartProps extends ChartProps {
  data: {
    label: string;
    value: number;
    maxValue?: number;
  }[];
  size?: number;
  showLabels?: boolean;
  color?: string;
}

export function SkinMetricsRadar({ 
  data, 
  size = 200, 
  showLabels = true,
  color = '#8B5CF6',
  className 
}: RadarChartProps) {
  const center = size / 2;
  const radius = (size - 40) / 2;
  const angleStep = (2 * Math.PI) / data.length;

  const points = data.map((item, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const value = (item.value / (item.maxValue || 100)) * radius;
    return {
      x: center + value * Math.cos(angle),
      y: center + value * Math.sin(angle),
      labelX: center + (radius + 20) * Math.cos(angle),
      labelY: center + (radius + 20) * Math.sin(angle),
      label: item.label,
      value: item.value,
    };
  });

  const pathData = points.map((p, i) => 
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ') + ' Z';

  // Grid lines
  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <div className={cn('relative', className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid */}
        {gridLevels.map((level, i) => (
          <polygon
            key={i}
            points={data.map((_, j) => {
              const angle = j * angleStep - Math.PI / 2;
              const r = radius * level;
              return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
            }).join(' ')}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.1}
            strokeWidth={1}
          />
        ))}

        {/* Axis lines */}
        {data.map((_, i) => {
          const angle = i * angleStep - Math.PI / 2;
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={center + radius * Math.cos(angle)}
              y2={center + radius * Math.sin(angle)}
              stroke="currentColor"
              strokeOpacity={0.1}
              strokeWidth={1}
            />
          );
        })}

        {/* Data polygon */}
        <polygon
          points={points.map(p => `${p.x},${p.y}`).join(' ')}
          fill={color}
          fillOpacity={0.2}
          stroke={color}
          strokeWidth={2}
        />

        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={4}
            fill={color}
          />
        ))}

        {/* Labels */}
        {showLabels && points.map((p, i) => (
          <text
            key={i}
            x={p.labelX}
            y={p.labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[10px] fill-muted-foreground"
          >
            {p.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

// Progress Ring for Score Display
interface ProgressRingProps extends ChartProps {
  value: number;
  maxValue?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  showValue?: boolean;
}

export function ScoreRing({
  value,
  maxValue = 100,
  size = 120,
  strokeWidth = 10,
  color = '#8B5CF6',
  label,
  showValue = true,
  className,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / maxValue) * circumference;
  const offset = circumference - progress;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.1}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{value}</span>
          {label && <span className="text-xs text-muted-foreground">{label}</span>}
        </div>
      )}
    </div>
  );
}

// Bar Chart for Comparisons
interface BarChartProps extends ChartProps {
  data: {
    label: string;
    value: number;
    color?: string;
  }[];
  height?: number;
  showValues?: boolean;
  horizontal?: boolean;
}

export function ComparisonBar({
  data,
  height = 200,
  showValues = true,
  horizontal = false,
  className,
}: BarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  const colors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  if (horizontal) {
    return (
      <div className={cn('space-y-2', className)}>
        {data.map((item, i) => {
          const width = (item.value / maxValue) * 100;
          return (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{item.label}</span>
                {showValues && <span className="font-medium">{item.value}</span>}
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${width}%`,
                    backgroundColor: item.color || colors[i % colors.length],
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn('flex items-end gap-2', className)} style={{ height }}>
      {data.map((item, i) => {
        const barHeight = (item.value / maxValue) * (height - 30);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            {showValues && (
              <span className="text-xs font-medium">{item.value}</span>
            )}
            <div
              className="w-full rounded-t transition-all duration-500"
              style={{
                height: barHeight,
                backgroundColor: item.color || colors[i % colors.length],
              }}
            />
            <span className="text-xs text-muted-foreground truncate w-full text-center">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Mini Sparkline
interface SparklineProps extends ChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showArea?: boolean;
}

export function Sparkline({
  data,
  width = 100,
  height = 30,
  color = '#8B5CF6',
  showArea = true,
  className,
}: SparklineProps) {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((value, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((value - min) / range) * height,
  }));

  const linePath = points.map((p, i) => 
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ');

  const areaPath = linePath + ` L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg width={width} height={height} className={className}>
      {showArea && (
        <path d={areaPath} fill={color} fillOpacity={0.1} />
      )}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Gauge Chart for Single Metric
interface GaugeProps extends ChartProps {
  value: number;
  min?: number;
  max?: number;
  thresholds?: { value: number; color: string }[];
  label?: string;
  size?: number;
}

export function MetricGauge({
  value,
  min = 0,
  max = 100,
  thresholds = [
    { value: 40, color: '#EF4444' },
    { value: 70, color: '#F59E0B' },
    { value: 100, color: '#10B981' },
  ],
  label,
  size = 150,
  className,
}: GaugeProps) {
  const range = max - min;
  const percentage = ((value - min) / range) * 100;
  const angle = (percentage / 100) * 180 - 90;
  
  const currentColor = thresholds.find((t, i) => 
    value <= t.value || i === thresholds.length - 1
  )?.color || '#8B5CF6';

  return (
    <div className={cn('relative', className)} style={{ width: size, height: size / 2 + 20 }}>
      <svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`}>
        {/* Background arc */}
        <path
          d={`M 10 ${size / 2} A ${size / 2 - 10} ${size / 2 - 10} 0 0 1 ${size - 10} ${size / 2}`}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.1}
          strokeWidth={10}
          strokeLinecap="round"
        />
        
        {/* Value arc */}
        <path
          d={`M 10 ${size / 2} A ${size / 2 - 10} ${size / 2 - 10} 0 0 1 ${size - 10} ${size / 2}`}
          fill="none"
          stroke={currentColor}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${(percentage / 100) * (Math.PI * (size / 2 - 10))} 1000`}
        />
        
        {/* Needle */}
        <g transform={`translate(${size / 2}, ${size / 2}) rotate(${angle})`}>
          <line x1={0} y1={0} x2={0} y2={-(size / 2 - 25)} stroke={currentColor} strokeWidth={3} />
          <circle cx={0} cy={0} r={5} fill={currentColor} />
        </g>
      </svg>
      
      <div className="absolute bottom-0 left-0 right-0 text-center">
        <span className="text-2xl font-bold" style={{ color: currentColor }}>{value}</span>
        {label && <p className="text-xs text-muted-foreground">{label}</p>}
      </div>
    </div>
  );
}

export default {
  SkinMetricsRadar,
  ScoreRing,
  ComparisonBar,
  Sparkline,
  MetricGauge,
};
