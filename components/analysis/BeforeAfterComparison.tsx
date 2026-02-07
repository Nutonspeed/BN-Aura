'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AnalysisRecord {
  id: string;
  analyzed_at: string;
  overall_score: number;
  skin_age: number;
  actual_age: number;
  spots_score: number;
  wrinkles_score: number;
  texture_score: number;
  pores_score: number;
  uv_spots_score: number;
  brown_spots_score: number;
  red_areas_score: number;
  porphyrins_score: number;
  skin_type: string;
  skin_health_grade: string;
  symmetry_score: number;
  golden_ratio: number;
  wrinkle_level: number;
}

interface ComparisonData {
  overallScore: { before: number; after: number; change: number; percentChange: number };
  skinAge: { before: number; after: number; change: number; percentChange: number };
  metrics: {
    spots: { before: number; after: number; change: number; percentChange: number };
    wrinkles: { before: number; after: number; change: number; percentChange: number };
    texture: { before: number; after: number; change: number; percentChange: number };
    pores: { before: number; after: number; change: number; percentChange: number };
  };
  daysBetween: number;
}

interface BeforeAfterComparisonProps {
  customerId: string;
  clinicId: string;
  currentAnalysisId?: string;
  onDownloadPDF?: (beforeId: string, afterId: string) => void;
}

export default function BeforeAfterComparison({
  customerId,
  clinicId,
  currentAnalysisId,
  onDownloadPDF,
}: BeforeAfterComparisonProps) {
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBefore, setSelectedBefore] = useState<string | null>(null);
  const [selectedAfter, setSelectedAfter] = useState<string | null>(null);
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [comparing, setComparing] = useState(false);

  // Fetch customer history
  useEffect(() => {
    const fetchHistory = async () => {
      if (!customerId) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/analysis/save?type=history&customerId=${customerId}&limit=20`);
        const data = await res.json();
        if (data.success && data.data?.analyses) {
          setHistory(data.data.analyses);
          // Auto-select latest two for comparison
          if (data.data.analyses.length >= 2) {
            setSelectedBefore(data.data.analyses[1].id);
            setSelectedAfter(data.data.analyses[0].id);
          }
        }
      } catch (e) {
        console.error('Failed to fetch history:', e);
      }
      setLoading(false);
    };
    fetchHistory();
  }, [customerId]);

  // Compare when selections change
  useEffect(() => {
    if (!selectedBefore || !selectedAfter) return;
    const compare = async () => {
      setComparing(true);
      try {
        const res = await fetch(`/api/analysis/save?type=compare&id1=${selectedBefore}&id2=${selectedAfter}`);
        const data = await res.json();
        if (data.success) setComparison(data.data);
      } catch (e) {
        console.error('Comparison failed:', e);
      }
      setComparing(false);
    };
    compare();
  }, [selectedBefore, selectedAfter]);

  const getScoreColor = (score: number) => score >= 70 ? 'text-green-400' : score >= 40 ? 'text-yellow-400' : 'text-red-400';
  const getChangeColor = (change: number) => change > 0 ? 'text-green-400' : change < 0 ? 'text-red-400' : 'text-gray-400';
  const changeIcon = (change: number) => change > 0 ? '▲' : change < 0 ? '▼' : '—';
  const formatDate = (d: string) => new Date(d).toLocaleDateString('th-TH', { month: 'short', day: 'numeric', year: '2-digit' });

  if (loading) {
    return (
      <Card className="bg-black/30 border-gray-700">
        <CardContent className="p-6 text-center">
          <div className="animate-pulse text-gray-400">Loading history...</div>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card className="bg-black/30 border-gray-700">
        <CardContent className="p-6 text-center">
          <p className="text-gray-400">No previous analysis found for this customer</p>
          <p className="text-xs text-gray-500 mt-1">Complete at least 2 analyses to see Before/After comparison</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timeline */}
      <Card className="bg-black/30 border-emerald-500/20">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3 text-emerald-400">Analysis History ({history.length} records)</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {history.map((record, i) => (
              <button
                key={record.id}
                onClick={() => {
                  if (!selectedBefore || selectedAfter) {
                    setSelectedBefore(record.id);
                    setSelectedAfter(null);
                    setComparison(null);
                  } else {
                    setSelectedAfter(record.id);
                  }
                }}
                className={cn(
                  'flex-shrink-0 p-3 rounded-lg border text-left transition-all min-w-[120px]',
                  record.id === selectedBefore ? 'bg-blue-500/20 border-blue-500' :
                  record.id === selectedAfter ? 'bg-green-500/20 border-green-500' :
                  record.id === currentAnalysisId ? 'bg-purple-500/10 border-purple-500/30' :
                  'bg-gray-800/50 border-gray-700 hover:border-gray-500'
                )}
              >
                <p className="text-xs text-gray-400">{formatDate(record.analyzed_at)}</p>
                <p className={cn('text-xl font-bold', getScoreColor(record.overall_score))}>
                  {record.overall_score}
                </p>
                <p className="text-xs text-gray-500">
                  {record.id === selectedBefore ? 'Before' :
                   record.id === selectedAfter ? 'After' :
                   i === 0 ? 'Latest' : ''}
                </p>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">Click to select Before, then After</p>
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {comparing && (
        <Card className="bg-black/30 border-gray-700">
          <CardContent className="p-6 text-center">
            <div className="animate-pulse text-gray-400">Comparing...</div>
          </CardContent>
        </Card>
      )}

      {comparison && !comparing && (
        <>
          {/* Overall Change */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-blue-500/10 border-blue-500/30">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-gray-400">Before</p>
                <p className={cn('text-3xl font-bold', getScoreColor(comparison.overallScore.before))}>
                  {comparison.overallScore.before}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-gray-400">{comparison.daysBetween} days</p>
                <p className={cn('text-2xl font-bold', getChangeColor(comparison.overallScore.change))}>
                  {changeIcon(comparison.overallScore.change)} {comparison.overallScore.change > 0 ? '+' : ''}{comparison.overallScore.change}
                </p>
                <p className="text-xs text-gray-500">points</p>
              </CardContent>
            </Card>
            <Card className="bg-green-500/10 border-green-500/30">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-gray-400">After</p>
                <p className={cn('text-3xl font-bold', getScoreColor(comparison.overallScore.after))}>
                  {comparison.overallScore.after}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Metrics Comparison */}
          <Card className="bg-black/30 border-emerald-500/20">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Metrics Change</h3>
              <div className="space-y-3">
                {Object.entries(comparison.metrics).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-3">
                    <div className="w-20 text-sm capitalize">{key}</div>
                    <div className="w-10 text-sm text-right text-gray-400">{val.before}</div>
                    <div className="flex-1 h-2 bg-gray-700 rounded-full relative overflow-hidden">
                      <div
                        className="absolute h-full bg-blue-500/40 rounded-full"
                        style={{ width: `${val.before}%` }}
                      />
                      <div
                        className={cn('absolute h-full rounded-full', val.change >= 0 ? 'bg-green-500' : 'bg-red-500')}
                        style={{ width: `${val.after}%` }}
                      />
                    </div>
                    <div className="w-10 text-sm text-right">{val.after}</div>
                    <div className={cn('w-16 text-sm text-right font-medium', getChangeColor(val.change))}>
                      {changeIcon(val.change)} {val.change > 0 ? '+' : ''}{val.change}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Download PDF */}
          {onDownloadPDF && selectedBefore && selectedAfter && (
            <Button
              className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600"
              onClick={() => onDownloadPDF(selectedBefore, selectedAfter)}
            >
              Download Before/After PDF Report
            </Button>
          )}
        </>
      )}
    </div>
  );
}
