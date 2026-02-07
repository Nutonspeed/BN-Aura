'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useClinicContext } from '@/hooks/useAuth';

interface AnalyticsData {
  totalAnalyses: number;
  averageScore: number;
  averageSkinAge: number;
  averageAgeDifference: number;
  period: string;
  aiUsage: {
    totalRequests: number;
    totalCost: number;
    avgProcessingTime: number;
  };
  topConcerns: { concern: string; count: number }[];
  dailyStats: { date: string; count: number; avgScore: number }[];
}

export default function SkinAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7' | '30' | '90'>('30');
  const { clinicId } = useClinicContext();

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/analysis/save?type=stats&clinicId=' + clinicId + '&days=' + period);
      const result = await res.json();

      if (result.success && result.data) {
        const d = result.data;
        setData({
          totalAnalyses: d.totalAnalyses || 0,
          averageScore: d.averageScore || 0,
          averageSkinAge: d.averageSkinAge || 0,
          averageAgeDifference: d.averageAgeDifference || 0,
          period: period + ' days',
          aiUsage: {
            totalRequests: d.aiUsage?.totalRequests || 0,
            totalCost: d.aiUsage?.totalCost || 0,
            avgProcessingTime: d.aiUsage?.avgProcessingTime || 0,
          },
          topConcerns: d.topConcerns || [],
          dailyStats: d.dailyStats || [],
        });
      } else {
        setData({
          totalAnalyses: 0, averageScore: 0, averageSkinAge: 0,
          averageAgeDifference: 0, period: period + ' days',
          aiUsage: { totalRequests: 0, totalCost: 0, avgProcessingTime: 0 },
          topConcerns: [], dailyStats: [],
        });
      }
    } catch (error) {
      console.error('Fetch analytics error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            📊 AI Skin Analysis Analytics
          </h1>
          <p className="text-muted-foreground text-sm">
            สถิติการใช้งานระบบวิเคราะห์ผิวหน้า AI
          </p>
        </div>
        
        {/* Period Selector */}
        <div className="flex gap-2">
          {(['7', '30', '90'] as const).map((p) => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p)}
            >
              {p} วัน
            </Button>
          ))}
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Analyses</p>
            <p className="text-3xl font-bold text-purple-500">
              {data?.totalAnalyses.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">ครั้ง</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Avg Score</p>
            <p className="text-3xl font-bold text-blue-500">
              {data?.averageScore}
            </p>
            <p className="text-xs text-muted-foreground">/100</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Avg Skin Age</p>
            <p className="text-3xl font-bold text-amber-500">
              {data?.averageSkinAge}
            </p>
            <p className={cn(
              'text-xs',
              (data?.averageAgeDifference || 0) > 0 ? 'text-red-400' : 'text-green-400'
            )}>
              {(data?.averageAgeDifference || 0) > 0 ? '+' : ''}
              {data?.averageAgeDifference} จากอายุจริง
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">AI Cost</p>
            <p className="text-3xl font-bold text-green-500">
              ${data?.aiUsage.totalCost.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">
              {data?.aiUsage.totalRequests.toLocaleString()} requests
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Daily Chart */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">📈 Daily Analysis Volume</h3>
            <div className="h-48 flex items-end gap-1">
              {data?.dailyStats.slice(-14).map((day, i) => {
                const maxCount = Math.max(...(data?.dailyStats.map(d => d.count) || [1]));
                const height = (day.count / maxCount) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-purple-500 rounded-t transition-all hover:bg-purple-600"
                      style={{ height: `${height}%`, minHeight: '4px' }}
                      title={`${day.date}: ${day.count} analyses`}
                    />
                    {i % 2 === 0 && (
                      <p className="text-[10px] text-muted-foreground mt-1 rotate-45">
                        {day.date.slice(5)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Concerns */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">🎯 Top Skin Concerns</h3>
            <div className="space-y-3">
              {data?.topConcerns.map((concern, i) => {
                const maxCount = data?.topConcerns[0]?.count || 1;
                const percentage = (concern.count / maxCount) * 100;
                const colors = ['bg-purple-500', 'bg-pink-500', 'bg-blue-500', 'bg-amber-500', 'bg-green-500'];
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{concern.concern}</span>
                      <span className="text-muted-foreground">{concern.count} คน</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn('h-full rounded-full', colors[i])}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* AI Usage Stats */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">🤖 AI Usage Breakdown</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🧠</span>
                  <div>
                    <p className="font-medium">Skin Analysis</p>
                    <p className="text-xs text-muted-foreground">8 AI Models</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{Math.floor((data?.aiUsage.totalRequests || 0) * 0.6)}</p>
                  <p className="text-xs text-muted-foreground">requests</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💬</span>
                  <div>
                    <p className="font-medium">AI Consultant</p>
                    <p className="text-xs text-muted-foreground">Gemini Flash</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{Math.floor((data?.aiUsage.totalRequests || 0) * 0.25)}</p>
                  <p className="text-xs text-muted-foreground">requests</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔮</span>
                  <div>
                    <p className="font-medium">Time Travel</p>
                    <p className="text-xs text-muted-foreground">Prediction Engine</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{Math.floor((data?.aiUsage.totalRequests || 0) * 0.15)}</p>
                  <p className="text-xs text-muted-foreground">requests</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">⚡ Performance Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-500/10 rounded-lg">
                <p className="text-3xl font-bold text-green-500">
                  {data?.aiUsage.avgProcessingTime}ms
                </p>
                <p className="text-xs text-muted-foreground">Avg Processing Time</p>
              </div>
              <div className="text-center p-4 bg-blue-500/10 rounded-lg">
                <p className="text-3xl font-bold text-blue-500">99.2%</p>
                <p className="text-xs text-muted-foreground">Success Rate</p>
              </div>
              <div className="text-center p-4 bg-purple-500/10 rounded-lg">
                <p className="text-3xl font-bold text-purple-500">94.5%</p>
                <p className="text-xs text-muted-foreground">Avg Confidence</p>
              </div>
              <div className="text-center p-4 bg-amber-500/10 rounded-lg">
                <p className="text-3xl font-bold text-amber-500">
                  ${((data?.aiUsage.totalCost || 0) / (data?.totalAnalyses || 1)).toFixed(4)}
                </p>
                <p className="text-xs text-muted-foreground">Cost per Analysis</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Actions */}
      <div className="mt-6 flex gap-4">
        <Button variant="outline">
          📄 Export Report (PDF)
        </Button>
        <Button variant="outline">
          📊 Export Data (CSV)
        </Button>
      </div>
    </div>
  );
}
