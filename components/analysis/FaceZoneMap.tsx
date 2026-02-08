'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ZoneData {
  id: string;
  name: string;
  nameThai: string;
  score: number;
  level?: number;
}

interface FaceZoneMapProps {
  zones: ZoneData[];
  size?: number;
  className?: string;
  onZoneClick?: (zone: ZoneData) => void;
}

function getZoneColor(score: number): string {
  if (score >= 70) return 'rgba(34,197,94,0.5)';
  if (score >= 40) return 'rgba(234,179,8,0.5)';
  return 'rgba(239,68,68,0.5)';
}

function getZoneStroke(score: number): string {
  if (score >= 70) return 'rgba(34,197,94,0.8)';
  if (score >= 40) return 'rgba(234,179,8,0.8)';
  return 'rgba(239,68,68,0.8)';
}

// Face zone positions (relative to SVG viewBox 0 0 200 280)
const ZONE_POSITIONS: Record<string, { cx: number; cy: number; rx: number; ry: number }> = {
  forehead:   { cx: 100, cy: 55,  rx: 50, ry: 25 },
  leftEye:    { cx: 72,  cy: 100, rx: 18, ry: 12 },
  rightEye:   { cx: 128, cy: 100, rx: 18, ry: 12 },
  nose:       { cx: 100, cy: 135, rx: 15, ry: 22 },
  leftCheek:  { cx: 55,  cy: 155, rx: 28, ry: 25 },
  rightCheek: { cx: 145, cy: 155, rx: 28, ry: 25 },
  mouth:      { cx: 100, cy: 195, rx: 25, ry: 15 },
  chin:       { cx: 100, cy: 235, rx: 25, ry: 20 },
  // Wrinkle zone aliases
  'crow-feet-left':  { cx: 48,  cy: 100, rx: 14, ry: 10 },
  'crow-feet-right': { cx: 152, cy: 100, rx: 14, ry: 10 },
  'nasolabial-left':  { cx: 72,  cy: 175, rx: 10, ry: 18 },
  'nasolabial-right': { cx: 128, cy: 175, rx: 10, ry: 18 },
  'glabella':  { cx: 100, cy: 80,  rx: 12, ry: 10 },
};

export default function FaceZoneMap({ zones, size = 280, className, onZoneClick }: FaceZoneMapProps) {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  const scale = size / 280;

  return (
    <div className={cn('relative', className)} style={{ width: size * (200 / 280), height: size }}>
      <svg
        width={size * (200 / 280)}
        height={size}
        viewBox="0 0 200 280"
        className="overflow-visible"
      >
        {/* Face outline */}
        <ellipse
          cx="100" cy="140"
          rx="75" ry="110"
          fill="none"
          stroke="rgba(168,85,247,0.3)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />

        {/* Hairline */}
        <path
          d="M 30 90 Q 50 20 100 15 Q 150 20 170 90"
          fill="none"
          stroke="rgba(168,85,247,0.2)"
          strokeWidth="1"
        />

        {/* Jaw line */}
        <path
          d="M 30 160 Q 40 240 100 260 Q 160 240 170 160"
          fill="none"
          stroke="rgba(168,85,247,0.2)"
          strokeWidth="1"
        />

        {/* Zone ellipses */}
        {zones.map((zone) => {
          const pos = ZONE_POSITIONS[zone.id];
          if (!pos) return null;

          const isHovered = hoveredZone === zone.id;
          const score = zone.score ?? (zone.level ? 100 - zone.level * 10 : 50);

          return (
            <g key={zone.id}>
              <ellipse
                cx={pos.cx}
                cy={pos.cy}
                rx={pos.rx + (isHovered ? 3 : 0)}
                ry={pos.ry + (isHovered ? 3 : 0)}
                fill={getZoneColor(score)}
                stroke={getZoneStroke(score)}
                strokeWidth={isHovered ? 2 : 1}
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoveredZone(zone.id)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => onZoneClick?.(zone)}
              />
              {/* Score label inside zone */}
              {isHovered && (
                <>
                  <rect
                    x={pos.cx - 22}
                    y={pos.cy - 20}
                    width="44"
                    height="40"
                    rx="6"
                    fill="rgba(0,0,0,0.85)"
                    stroke={getZoneStroke(score)}
                    strokeWidth="1"
                  />
                  <text
                    x={pos.cx}
                    y={pos.cy - 6}
                    textAnchor="middle"
                    className="text-[9px] fill-gray-400"
                  >
                    {zone.nameThai}
                  </text>
                  <text
                    x={pos.cx}
                    y={pos.cy + 10}
                    textAnchor="middle"
                    className="text-[12px] font-bold"
                    fill={getZoneStroke(score)}
                  >
                    {zone.score !== undefined ? `${zone.score}%` : `${zone.level}/10`}
                  </text>
                </>
              )}
            </g>
          );
        })}

        {/* Eye details (decorative) */}
        <circle cx="72" cy="100" r="4" fill="none" stroke="rgba(168,85,247,0.3)" strokeWidth="0.5" />
        <circle cx="128" cy="100" r="4" fill="none" stroke="rgba(168,85,247,0.3)" strokeWidth="0.5" />

        {/* Nose bridge line */}
        <line x1="100" y1="90" x2="100" y2="120" stroke="rgba(168,85,247,0.15)" strokeWidth="0.5" />

        {/* Mouth line */}
        <path d="M 85 195 Q 100 205 115 195" fill="none" stroke="rgba(168,85,247,0.2)" strokeWidth="0.5" />
      </svg>

      {/* Legend */}
      <div className="absolute -bottom-8 left-0 right-0 flex justify-center gap-4 text-[10px] text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
          <span>ดี</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
          <span>ปานกลาง</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
          <span>ควรดูแล</span>
        </div>
      </div>
    </div>
  );
}
