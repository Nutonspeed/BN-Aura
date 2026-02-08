'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface RadarMetric {
  id: string;
  name: string;
  nameThai: string;
  score: number;
}

interface RadarChartProps {
  metrics: RadarMetric[];
  size?: number;
  animated?: boolean;
  className?: string;
  onMetricClick?: (metric: RadarMetric) => void;
}

function getScoreColor(score: number): string {
  if (score >= 70) return '#22c55e';
  if (score >= 40) return '#eab308';
  return '#ef4444';
}

export default function RadarChart({
  metrics: rawMetrics,
  size = 320,
  animated = true,
  className,
  onMetricClick,
}: RadarChartProps) {
  const [animProgress, setAnimProgress] = useState(animated ? 0 : 1);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!animated) return;
    const duration = 1200;
    const start = performance.now();
    let frame: number;

    const animate = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimProgress(eased);
      if (t < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [animated]);

  const metrics = Array.isArray(rawMetrics) ? rawMetrics : [];
  if (metrics.length === 0) return <div className={className} style={{ width: size, height: size }} />;

  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.35;
  const n = metrics.length;
  const angleStep = (2 * Math.PI) / n;

  // Get point on radar for a given index and value (0-100)
  const getPoint = (index: number, value: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const r = (value / 100) * maxR * animProgress;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  // Build polygon path
  const polygonPoints = metrics
    .map((m, i) => {
      const p = getPoint(i, m.score);
      return `${p.x},${p.y}`;
    })
    .join(' ');

  // Grid levels
  const levels = [20, 40, 60, 80, 100];

  return (
    <div className={cn('relative', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="overflow-visible">
        {/* Grid polygons */}
        {levels.map((level) => {
          const pts = Array.from({ length: n }, (_, i) => {
            const angle = angleStep * i - Math.PI / 2;
            const r = (level / 100) * maxR;
            return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
          }).join(' ');
          return (
            <polygon
              key={level}
              points={pts}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />
          );
        })}

        {/* Axis lines */}
        {metrics.map((_, i) => {
          const angle = angleStep * i - Math.PI / 2;
          const endX = cx + maxR * Math.cos(angle);
          const endY = cy + maxR * Math.sin(angle);
          return (
            <line
              key={`axis-${i}`}
              x1={cx}
              y1={cy}
              x2={endX}
              y2={endY}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
          );
        })}

        {/* Data polygon — gradient fill */}
        <defs>
          <linearGradient id="radarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(168,85,247,0.4)" />
            <stop offset="100%" stopColor="rgba(236,72,153,0.4)" />
          </linearGradient>
        </defs>
        <polygon
          points={polygonPoints}
          fill="url(#radarGrad)"
          stroke="rgba(168,85,247,0.8)"
          strokeWidth="2"
          strokeLinejoin="round"
          className="transition-all duration-300"
        />

        {/* Data points */}
        {metrics.map((m, i) => {
          const p = getPoint(i, m.score);
          const isHovered = hoveredIdx === i;
          return (
            <g key={m.id}>
              {/* Hover area (invisible, larger) */}
              <circle
                cx={p.x}
                cy={p.y}
                r={16}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => onMetricClick?.(m)}
              />
              {/* Visible dot */}
              <circle
                cx={p.x}
                cy={p.y}
                r={isHovered ? 6 : 4}
                fill={getScoreColor(m.score)}
                stroke="white"
                strokeWidth="2"
                className="transition-all duration-200"
                style={{
                  filter: isHovered ? `drop-shadow(0 0 8px ${getScoreColor(m.score)})` : 'none',
                }}
              />
            </g>
          );
        })}

        {/* Labels */}
        {metrics.map((m, i) => {
          const angle = angleStep * i - Math.PI / 2;
          const labelR = maxR + 28;
          const lx = cx + labelR * Math.cos(angle);
          const ly = cy + labelR * Math.sin(angle);
          const isHovered = hoveredIdx === i;

          return (
            <g key={`label-${m.id}`}>
              <text
                x={lx}
                y={ly - 6}
                textAnchor="middle"
                className={cn(
                  'fill-current text-[10px] font-medium transition-colors duration-200',
                  isHovered ? 'text-white' : 'text-gray-400'
                )}
              >
                {m.nameThai}
              </text>
              <text
                x={lx}
                y={ly + 8}
                textAnchor="middle"
                className="text-[11px] font-bold"
                fill={getScoreColor(m.score)}
              >
                {Math.round(m.score * animProgress)}%
              </text>
            </g>
          );
        })}
      </svg>

      {/* Center label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {hoveredIdx !== null && (
          <div className="bg-black/80 backdrop-blur-sm border border-purple-500/40 rounded-lg px-3 py-2 text-center">
            <p className="text-xs text-gray-400">{metrics[hoveredIdx].name}</p>
            <p className="text-lg font-bold" style={{ color: getScoreColor(metrics[hoveredIdx].score) }}>
              {metrics[hoveredIdx].score}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
