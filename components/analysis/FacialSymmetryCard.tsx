'use client';

import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface FacialMeasurement {
  name: string;
  nameThai: string;
  value: number;
  score: number;
  status: string;
}

interface FacialSymmetryCardProps {
  overallSymmetry: number;
  goldenRatio: number;
  goldenRatioScore: number;
  measurements: FacialMeasurement[];
  facialThirds: {
    upper: number;
    middle: number;
    lower: number;
    balance: number;
  };
  leftRightComparison: {
    eyeSymmetry: number;
    cheekboneSymmetry: number;
    jawlineSymmetry: number;
    overallBalance: number;
  };
  keyInsights: string[];
}

const getScoreColor = (score: number): string => {
  if (score >= 90) return 'text-green-500';
  if (score >= 75) return 'text-lime-500';
  if (score >= 60) return 'text-yellow-500';
  return 'text-orange-500';
};

const getBarColor = (score: number): string => {
  if (score >= 90) return 'bg-green-500';
  if (score >= 75) return 'bg-lime-500';
  if (score >= 60) return 'bg-yellow-500';
  return 'bg-orange-500';
};

export default function FacialSymmetryCard({
  overallSymmetry,
  goldenRatio,
  goldenRatioScore,
  measurements,
  facialThirds,
  leftRightComparison,
  keyInsights,
}: FacialSymmetryCardProps) {
  return (
    <div className="space-y-4">
      {/* Main Score Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Overall Symmetry */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30">
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-1">📐</div>
            <p className="text-sm text-muted-foreground mb-2">Overall Symmetry</p>
            <p className={cn('text-4xl font-bold', getScoreColor(overallSymmetry))}>
              {overallSymmetry}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">Excellent facial balance</p>
          </CardContent>
        </Card>

        {/* Golden Ratio */}
        <Card className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-amber-500/30">
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-1">✨</div>
            <p className="text-sm text-muted-foreground mb-2">Golden Ratio</p>
            <p className={cn('text-4xl font-bold', getScoreColor(goldenRatioScore))}>
              {goldenRatio}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Ideal: 1.618 (Phi)</p>
          </CardContent>
        </Card>
      </div>

      {/* Facial Measurements */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <span>📏</span> Facial Measurements
          </h4>
          <div className="space-y-3">
            {measurements.map((m, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{m.nameThai}</span>
                  <span className={cn('font-medium', getScoreColor(m.score))}>
                    {m.score}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', getBarColor(m.score))}
                    style={{ width: `${m.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Facial Thirds */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <span>📊</span> Facial Thirds Balance
            <span className={cn('ml-auto text-sm', getScoreColor(facialThirds.balance))}>
              {facialThirds.balance}%
            </span>
          </h4>
          <div className="flex gap-2 h-24">
            <div 
              className="flex-1 bg-gradient-to-b from-blue-400 to-blue-600 rounded-t-lg flex items-center justify-center text-white text-xs font-medium"
              style={{ height: `${facialThirds.upper * 3}%` }}
            >
              Upper {facialThirds.upper}%
            </div>
            <div 
              className="flex-1 bg-gradient-to-b from-purple-400 to-purple-600 flex items-center justify-center text-white text-xs font-medium"
              style={{ height: `${facialThirds.middle * 3}%` }}
            >
              Middle {facialThirds.middle}%
            </div>
            <div 
              className="flex-1 bg-gradient-to-b from-pink-400 to-pink-600 rounded-b-lg flex items-center justify-center text-white text-xs font-medium"
              style={{ height: `${facialThirds.lower * 3}%` }}
            >
              Lower {facialThirds.lower}%
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Ideal: 33.3% each section
          </p>
        </CardContent>
      </Card>

      {/* Left-Right Comparison */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <span>↔️</span> Left-Right Symmetry
          </h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl mb-1">👁️</div>
              <p className={cn('text-xl font-bold', getScoreColor(leftRightComparison.eyeSymmetry))}>
                {leftRightComparison.eyeSymmetry}%
              </p>
              <p className="text-xs text-muted-foreground">ตา</p>
            </div>
            <div>
              <div className="text-2xl mb-1">🦴</div>
              <p className={cn('text-xl font-bold', getScoreColor(leftRightComparison.cheekboneSymmetry))}>
                {leftRightComparison.cheekboneSymmetry}%
              </p>
              <p className="text-xs text-muted-foreground">โหนกแก้ม</p>
            </div>
            <div>
              <div className="text-2xl mb-1">🦷</div>
              <p className={cn('text-xl font-bold', getScoreColor(leftRightComparison.jawlineSymmetry))}>
                {leftRightComparison.jawlineSymmetry}%
              </p>
              <p className="text-xs text-muted-foreground">กราม</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card className="bg-gradient-to-r from-green-500/5 to-emerald-500/5 border-green-500/20">
        <CardContent className="p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <span>💡</span> Key Insights
          </h4>
          <ul className="space-y-2">
            {keyInsights.map((insight, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <span className="text-green-500 mt-0.5">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
