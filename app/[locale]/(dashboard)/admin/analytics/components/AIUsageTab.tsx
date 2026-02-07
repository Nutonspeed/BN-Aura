'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { 
  Lightning,
  Brain,
  CurrencyDollar,
  ChartLine,
  ArrowsClockwise,
  Warning
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export default function AIUsageTab() {
  const [aiData, setAiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => { fetchData(); }, [days]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/monitoring/ai-usage?days=${days}`);
      const result = await res.json();
      if (result.success) setAiData(result.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[300px]"><Brain className="w-10 h-10 animate-pulse text-primary" /></div>;

  const budgetPercent = aiData ? Math.min(aiData.budgetUsed, 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2"><Brain className="w-5 h-5 text-primary" /> AI Usage</h3>
        <div className="flex gap-2">
          {[7, 14, 30].map(d => (
            <Button key={d} variant={days === d ? 'default' : 'outline'} size="sm" onClick={() => setDays(d)}>{d}d</Button>
          ))}
          <Button variant="outline" size="sm" onClick={fetchData}><ArrowsClockwise className="w-4 h-4" /></Button>
        </div>
      </div>

      {aiData && !aiData.budgetStatus?.allowed && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2">
          <Warning className="w-4 h-4 text-red-500" />
          <span className="text-red-500 text-sm">{aiData.budgetStatus.reason}</span>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4"><div className="text-xs text-muted-foreground mb-1">ค่าใช้จ่าย</div><div className="text-2xl font-bold text-primary">฿{aiData?.totalCost?.toFixed(2) || '0'}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground mb-1">Requests</div><div className="text-2xl font-bold">{aiData?.totalRequests || 0}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground mb-1">Tokens</div><div className="text-2xl font-bold">{((aiData?.totalTokens || 0) / 1000).toFixed(1)}K</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground mb-1">Budget</div><div className="text-2xl font-bold">{budgetPercent.toFixed(0)}%</div>
          <div className="h-1.5 bg-secondary rounded-full mt-2"><motion.div initial={{width:0}} animate={{width:`${budgetPercent}%`}} className={`h-full rounded-full ${budgetPercent > 80 ? 'bg-red-500' : 'bg-emerald-500'}`} /></div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="text-sm font-bold mb-3">Daily Cost</div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={aiData?.daily || []}>
                <XAxis dataKey="date" tick={{fontSize:9}} tickFormatter={v => v.slice(5)} />
                <YAxis tick={{fontSize:9}} />
                <Tooltip />
                <Area type="monotone" dataKey="totalCost" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-bold mb-3">Top Models</div>
          <div className="h-48">
            {aiData?.topModels?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aiData.topModels} layout="vertical">
                  <XAxis type="number" tick={{fontSize:9}} />
                  <YAxis dataKey="model" type="category" tick={{fontSize:8}} width={100} />
                  <Tooltip />
                  <Bar dataKey="cost" radius={[0,4,4,0]}>{aiData.topModels.map((_:any, i:number) => <Cell key={i} fill={COLORS[i % 5]} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}
