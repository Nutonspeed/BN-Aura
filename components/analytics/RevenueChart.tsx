'use client';

import { useState, useEffect } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { 
  TrendUp,
  CalendarDots,
  Funnel
} from '@phosphor-icons/react';
interface RevenueData {
  name: string;
  revenue: number;
}

export default function RevenueChart({ clinicId }: { clinicId: string }) {
  const [data, setData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  useEffect(() => {
    async function fetchRevenue() {
      setLoading(true);
      try {
        const res = await fetch(`/api/analytics/bi?clinicId=${clinicId}&type=revenue&period=${period}`);
        const result = await res.json();
        if (result.success) {
          setData(result.data.revenue);
        }
      } catch (error) {
        console.error('Error fetching revenue data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchRevenue();
  }, [clinicId, period]);

  return (
    <div className="bg-card p-6 rounded-2xl border border-border shadow-card space-y-6 relative overflow-hidden group h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <TrendUp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Revenue Intelligence</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Growth Analytics & Trends</p>
          </div>
        </div>

        <div className="flex bg-secondary p-1 rounded-xl border border-border">
          {(['daily', 'weekly', 'monthly'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-tighter rounded-lg transition-all ${
                period === p 
                  ? 'bg-primary text-primary-foreground shadow-lg' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-[200px] flex items-center justify-center animate-pulse">
          <div className="w-full h-full bg-white/5 rounded-3xl" />
        </div>
      ) : data.length === 0 ? (
        <div className="h-[120px] flex flex-col items-center justify-center text-muted-foreground/50 relative z-10">
          <TrendUp className="w-10 h-10 mb-2 opacity-30" />
          <p className="text-xs font-medium uppercase tracking-widest">No Revenue Data Yet</p>
          <p className="text-[10px] mt-1">Transactions will appear here as they occur</p>
        </div>
      ) : (
        <div className="h-[250px] w-full relative z-10">
          <ResponsiveContainer width="100%" aspect={2} minHeight={300}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgb(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="rgb(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 600 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 600 }}
                tickFormatter={(value) => `฿${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#121212', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '16px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                  fontSize: '12px'
                }}
                itemStyle={{ color: 'rgb(var(--primary))', fontWeight: 700 }}
                labelStyle={{ color: 'white', marginBottom: '4px', fontWeight: 800 }}
                formatter={(value: number | string | undefined) => [`฿${Number(value || 0).toLocaleString()}`, 'Revenue']}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="rgb(var(--primary))" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
                isAnimationActive={true}
                animationDuration={1500}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="pt-4 border-t border-border flex items-center justify-between text-[10px] uppercase tracking-widest font-medium text-muted-foreground relative z-10">
        <div className="flex items-center gap-2">
          <CalendarDots className="w-3 h-3" />
          Data updated in real-time
        </div>
        <button className="flex items-center gap-2 hover:text-foreground transition-colors">
          <Funnel className="w-3 h-3" />
          Filter Advanced
        </button>
      </div>
    </div>
  );
}