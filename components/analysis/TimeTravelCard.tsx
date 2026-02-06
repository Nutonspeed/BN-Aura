'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface AgingPrediction {
  year: number;
  skinScore: number;
  skinAge: number;
  visualChanges: string[];
}

interface TimeTravelCardProps {
  currentAge: number;
  currentSkinScore: number;
  naturalAging: AgingPrediction[];
  withTreatment: AgingPrediction[];
  insights: {
    urgency: string;
    messageThai: string;
    potentialSavings: string;
  };
}

export default function TimeTravelCard({
  currentAge,
  currentSkinScore,
  naturalAging,
  withTreatment,
  insights,
}: TimeTravelCardProps) {
  const [selectedYear, setSelectedYear] = useState(0);
  const [showTreatment, setShowTreatment] = useState(false);

  const currentPrediction = showTreatment 
    ? withTreatment.find(p => p.year === selectedYear) 
    : naturalAging.find(p => p.year === selectedYear);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getUrgencyColor = (urgency: string) => {
    if (urgency === 'low') return 'bg-green-500/10 border-green-500/30 text-green-600';
    if (urgency === 'medium') return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600';
    return 'bg-red-500/10 border-red-500/30 text-red-600';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            🔮 AI Time Travel
            <span className="text-sm font-normal text-muted-foreground">ดูอนาคตผิวหน้า</span>
          </h3>
          <p className="text-sm text-muted-foreground">
            เปรียบเทียบผิวของคุณใน 10 ปีข้างหน้า
          </p>
        </div>
      </div>

      {/* Toggle Treatment View */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowTreatment(false)}
          className={cn(
            'flex-1 py-3 px-4 rounded-lg font-medium transition-all',
            !showTreatment 
              ? 'bg-red-500 text-white' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          )}
        >
          ❌ ไม่ดูแล
        </button>
        <button
          onClick={() => setShowTreatment(true)}
          className={cn(
            'flex-1 py-3 px-4 rounded-lg font-medium transition-all',
            showTreatment 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          )}
        >
          ✅ ดูแลตามแผน
        </button>
      </div>

      {/* Timeline Slider */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Timeline</span>
            <span className="text-sm text-muted-foreground">
              +{selectedYear} ปี (อายุ {currentAge + selectedYear})
            </span>
          </div>
          
          {/* Year Buttons */}
          <div className="flex gap-2 mb-4">
            {[0, 1, 3, 5, 10].map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
                  selectedYear === year
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-800'
                )}
              >
                {year === 0 ? 'Now' : `+${year}y`}
              </button>
            ))}
          </div>

          {/* Comparison Chart */}
          <div className="grid grid-cols-2 gap-4">
            {/* Without Treatment */}
            <div className={cn(
              'p-4 rounded-lg border-2 transition-all',
              !showTreatment ? 'border-red-500 bg-red-500/5' : 'border-gray-200 dark:border-gray-700'
            )}>
              <p className="text-xs text-muted-foreground mb-1">ไม่ดูแล</p>
              <p className={cn(
                'text-3xl font-bold',
                getScoreColor(naturalAging.find(p => p.year === selectedYear)?.skinScore || 0)
              )}>
                {naturalAging.find(p => p.year === selectedYear)?.skinScore || 0}
              </p>
              <p className="text-xs text-muted-foreground">
                Skin Age: {naturalAging.find(p => p.year === selectedYear)?.skinAge || 0}
              </p>
            </div>

            {/* With Treatment */}
            <div className={cn(
              'p-4 rounded-lg border-2 transition-all',
              showTreatment ? 'border-green-500 bg-green-500/5' : 'border-gray-200 dark:border-gray-700'
            )}>
              <p className="text-xs text-muted-foreground mb-1">ดูแลตามแผน</p>
              <p className={cn(
                'text-3xl font-bold',
                getScoreColor(withTreatment.find(p => p.year === selectedYear)?.skinScore || 0)
              )}>
                {withTreatment.find(p => p.year === selectedYear)?.skinScore || 0}
              </p>
              <p className="text-xs text-muted-foreground">
                Skin Age: {withTreatment.find(p => p.year === selectedYear)?.skinAge || 0}
              </p>
            </div>
          </div>

          {/* Visual Changes */}
          {currentPrediction && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm font-medium mb-2">
                {showTreatment ? '✨ ผลลัพธ์ที่คาดหวัง:' : '⚠️ การเปลี่ยนแปลงที่จะเกิดขึ้น:'}
              </p>
              <ul className="space-y-1">
                {currentPrediction.visualChanges.map((change, idx) => (
                  <li key={idx} className="text-sm flex items-center gap-2">
                    <span className={showTreatment ? 'text-green-500' : 'text-red-500'}>
                      {showTreatment ? '✓' : '!'}
                    </span>
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Score Difference */}
      {selectedYear > 0 && (
        <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              ความแตกต่างใน {selectedYear} ปีข้างหน้า
            </p>
            <div className="flex items-center justify-center gap-4">
              <div>
                <p className="text-2xl font-bold text-red-500">
                  {naturalAging.find(p => p.year === selectedYear)?.skinScore || 0}
                </p>
                <p className="text-xs text-muted-foreground">ไม่ดูแล</p>
              </div>
              <div className="text-2xl">→</div>
              <div>
                <p className="text-2xl font-bold text-green-500">
                  {withTreatment.find(p => p.year === selectedYear)?.skinScore || 0}
                </p>
                <p className="text-xs text-muted-foreground">ดูแล</p>
              </div>
              <div className="text-2xl">=</div>
              <div>
                <p className="text-2xl font-bold text-purple-500">
                  +{(withTreatment.find(p => p.year === selectedYear)?.skinScore || 0) - 
                     (naturalAging.find(p => p.year === selectedYear)?.skinScore || 0)}
                </p>
                <p className="text-xs text-muted-foreground">คะแนนที่ดีกว่า</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Urgency Alert */}
      <Card className={cn('border-2', getUrgencyColor(insights.urgency))}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">
              {insights.urgency === 'high' ? '🚨' : insights.urgency === 'medium' ? '⚠️' : '💡'}
            </span>
            <div>
              <p className="font-semibold">{insights.messageThai}</p>
              <p className="text-sm mt-1">{insights.potentialSavings}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
