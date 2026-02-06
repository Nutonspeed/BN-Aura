'use client';

import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface WrinkleZone {
  id: string;
  name: string;
  nameThai: string;
  agingLevel: number;
  depth: string;
  count: number;
  coverage: number;
}

interface WrinkleZoneCardProps {
  overallAgingLevel: number;
  zones: WrinkleZone[];
  totalWrinkleCount: number;
  averageDepth: string;
  priorityZones: string[];
  treatmentPlan: {
    immediate: string[];
    preventive: string[];
  };
}

const getAgingColor = (level: number): string => {
  if (level <= 2) return 'bg-green-500';
  if (level <= 4) return 'bg-lime-500';
  if (level <= 6) return 'bg-yellow-500';
  if (level <= 8) return 'bg-orange-500';
  return 'bg-red-500';
};

const getAgingTextColor = (level: number): string => {
  if (level <= 2) return 'text-green-500';
  if (level <= 4) return 'text-lime-500';
  if (level <= 6) return 'text-yellow-500';
  if (level <= 8) return 'text-orange-500';
  return 'text-red-500';
};

const getDepthLabel = (depth: string): string => {
  const labels: Record<string, string> = {
    fine: 'ตื้น',
    moderate: 'ปานกลาง',
    deep: 'ลึก',
  };
  return labels[depth] || depth;
};

export default function WrinkleZoneCard({
  overallAgingLevel,
  zones,
  totalWrinkleCount,
  averageDepth,
  priorityZones,
  treatmentPlan,
}: WrinkleZoneCardProps) {
  return (
    <div className="space-y-4">
      {/* Overall Aging Level */}
      <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Aging Level of Wrinkles</p>
              <p className="text-xs text-muted-foreground">ระดับริ้วรอยตามวัย</p>
            </div>
            <div className="text-right">
              <p className={cn('text-6xl font-bold', getAgingTextColor(overallAgingLevel))}>
                {overallAgingLevel}
              </p>
              <p className="text-sm text-muted-foreground">/10</p>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', getAgingColor(overallAgingLevel))}
              style={{ width: `${overallAgingLevel * 10}%` }}
            />
          </div>
          
          {/* Stats */}
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{totalWrinkleCount}</p>
              <p className="text-xs text-muted-foreground">จำนวนริ้วรอย</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{getDepthLabel(averageDepth)}</p>
              <p className="text-xs text-muted-foreground">ความลึกเฉลี่ย</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{zones.length}</p>
              <p className="text-xs text-muted-foreground">โซนที่ตรวจ</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 7 Wrinkle Zones */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <span>🗺️</span> 7 Wrinkle Zones Analysis
          </h4>
          
          <div className="space-y-3">
            {zones.map((zone) => (
              <div key={zone.id} className="flex items-center gap-3">
                {/* Zone name */}
                <div className="w-32 text-sm">
                  <p className="font-medium">{zone.name}</p>
                  <p className="text-xs text-muted-foreground">{zone.nameThai}</p>
                </div>
                
                {/* Progress bar */}
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative">
                    <div
                      className={cn('h-full rounded-full transition-all', getAgingColor(zone.agingLevel))}
                      style={{ width: `${zone.agingLevel * 10}%` }}
                    />
                    {/* Level markers */}
                    {[2, 4, 6, 8].map((marker) => (
                      <div
                        key={marker}
                        className="absolute top-0 bottom-0 w-px bg-gray-400/50"
                        style={{ left: `${marker * 10}%` }}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Score */}
                <div className="w-16 text-right">
                  <span className={cn('text-lg font-bold', getAgingTextColor(zone.agingLevel))}>
                    {zone.agingLevel}
                  </span>
                  <span className="text-xs text-muted-foreground">/10</span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground border-t pt-3">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>0-2 ดีมาก</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-lime-500" />
              <span>3-4 ดี</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span>5-6 ปานกลาง</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span>7-8 ควรดูแล</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>9-10 ต้องรักษา</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Priority Zones */}
      {priorityZones.length > 0 && (
        <Card className="bg-gradient-to-r from-orange-500/5 to-red-500/5 border-orange-500/20">
          <CardContent className="p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <span>⚠️</span> Priority Zones (ควรดูแลเป็นพิเศษ)
            </h4>
            <div className="flex flex-wrap gap-2">
              {priorityZones.map((zone, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-orange-500/20 text-orange-700 dark:text-orange-300 rounded-full text-sm"
                >
                  {zone}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Treatment Plan */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <span>💊</span> Treatment Recommendations
          </h4>
          
          <div className="grid md:grid-cols-2 gap-4">
            {/* Immediate */}
            <div className="p-3 bg-red-500/5 rounded-lg border border-red-500/20">
              <p className="font-medium text-sm mb-2 text-red-600 dark:text-red-400">
                🔴 Immediate (แนะนำทำทันที)
              </p>
              <ul className="space-y-1">
                {treatmentPlan.immediate.map((t, idx) => (
                  <li key={idx} className="text-sm flex items-center gap-2">
                    <span className="text-red-500">•</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Preventive */}
            <div className="p-3 bg-blue-500/5 rounded-lg border border-blue-500/20">
              <p className="font-medium text-sm mb-2 text-blue-600 dark:text-blue-400">
                🔵 Preventive (ป้องกัน)
              </p>
              <ul className="space-y-1">
                {treatmentPlan.preventive.map((t, idx) => (
                  <li key={idx} className="text-sm flex items-center gap-2">
                    <span className="text-blue-500">•</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
