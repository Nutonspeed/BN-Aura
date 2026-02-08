'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';

interface AIUsageData {
  totalCost: number;
  totalTokens: number;
  totalRequests: number;
  budgetUsed: number;
  dailyBudget: number;
  topModels: Array<{ model: string; cost: number; usage: number }>;
  daily: Array<{
    date: string;
    totalCost: number;
    requestCount: number;
  }>;
  budgetStatus: { allowed: boolean; reason?: string };
}

export default function AIUsageDashboard() {
  const [data, setData] = useState<AIUsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    fetchData();
  }, [days]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/monitoring/ai-usage?days=${days}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch AI usage:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!data) {
    return <div className="text-center p-8 text-muted-foreground">ไม่พบข้อมูล</div>;
  }

  const budgetPercent = Math.min(data.budgetUsed, 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          🤖 แดชบอร์ดการใช้งาน AI
        </h2>
        <div className="flex gap-2">
          {[7, 14, 30].map(d => (
            <Button
              key={d}
              variant={days === d ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDays(d)}
            >
              {d} วัน
            </Button>
          ))}
        </div>
      </div>

      {/* Budget Status Alert */}
      {!data.budgetStatus.allowed && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-500 font-medium">⚠️ {data.budgetStatus.reason}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">ค่าใช้จ่ายรวม</div>
            <div className="text-3xl font-bold text-primary">
              ฿{data.totalCost.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              งบประมาณ: ฿{data.dailyBudget * days}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">จำนวนคำขอ</div>
            <div className="text-3xl font-bold">{data.totalRequests.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">
              เฉลี่ย {Math.round(data.totalRequests / days)}/วัน
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">โทเค็นทั้งหมด</div>
            <div className="text-3xl font-bold">{(data.totalTokens / 1000).toFixed(1)}K</div>
            <div className="text-xs text-muted-foreground mt-1">
              ~฿{(data.totalTokens / 1000 * 0.001).toFixed(2)}/1K tokens
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">งบประมาณที่ใช้</div>
            <div className="text-3xl font-bold">{budgetPercent.toFixed(1)}%</div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-2">
              <div
                className={`h-full rounded-full ${
                  budgetPercent > 80 ? 'bg-red-500' : budgetPercent > 50 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${budgetPercent}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Models */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🏆 โมเดล AI ยอดนิยม</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.topModels.map((model, index) => (
              <div key={model.model} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                  <div>
                    <div className="font-medium">{model.model}</div>
                    <div className="text-sm text-muted-foreground">{model.usage} requests</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">฿{model.cost.toFixed(2)}</div>
                </div>
              </div>
            ))}
            {data.topModels.length === 0 && (
              <div className="text-center text-muted-foreground py-4">ยังไม่มีการใช้งาน</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* การใช้งานรายวัน Chart (Simple) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📊 การใช้งานรายวัน</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-32">
            {data.daily.map((day, index) => {
              const maxCost = Math.max(...data.daily.map(d => d.totalCost), 1);
              const height = (day.totalCost / maxCost) * 100;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
                    style={{ height: `${Math.max(height, 2)}%` }}
                    title={`${day.date}: ฿${day.totalCost.toFixed(2)}`}
                  />
                  <div className="text-[10px] text-muted-foreground mt-1 rotate-45 origin-left">
                    {day.date.slice(5)}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
