'use client';

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { 
  Lightning, 
  ThumbsUp, 
  TrendUp, 
  ChatCircle,
  Sparkle
} from '@phosphor-icons/react';

interface AIPerformanceData {
  suggestionsMade: number;
  suggestionsAccepted: number;
  acceptanceRate: number;
  avgDealProbabilityImprovement: number;
  topPerformingPrompts: Array<{
    prompt: string;
    successRate: number;
    count: number;
  }>;
  dailyUsage: Array<{
    date: string;
    suggestions: number;
    accepted: number;
  }>;
}

interface AIPerformanceMetricsProps {
  data: AIPerformanceData;
}

export default function AIPerformanceMetrics({ data }: AIPerformanceMetricsProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-500/10 rounded-xl">
              <Lightning className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase">Total Suggestions</p>
              <h4 className="text-2xl font-black text-white">{data.suggestionsMade}</h4>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <ThumbsUp className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase">Accepted</p>
              <h4 className="text-2xl font-black text-white">{data.suggestionsAccepted}</h4>
            </div>
          </div>
          <p className="text-sm text-emerald-400 font-medium">{data.acceptanceRate}% Rate</p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <TrendUp className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase">Deal Prob. Lift</p>
              <h4 className="text-2xl font-black text-white">+{data.avgDealProbabilityImprovement}%</h4>
            </div>
          </div>
          <p className="text-sm text-blue-400 font-medium">Impact on deals</p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-pink-500/10 rounded-xl">
              <Sparkle className="w-6 h-6 text-pink-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase">Top Strategy</p>
              <h4 className="text-sm font-bold text-white truncate max-w-[120px]">
                {data.topPerformingPrompts[0]?.prompt || 'N/A'}
              </h4>
            </div>
          </div>
          <p className="text-sm text-pink-400 font-medium">
            {data.topPerformingPrompts[0]?.successRate}% Success
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Usage Trend Chart */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-white/10">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <ChatCircle className="w-5 h-5 text-primary" />
            AI Usage & Acceptance Trend
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" aspect={2} minHeight={300}>
              <LineChart data={data.dailyUsage}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#6b7280" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="suggestions" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  dot={false}
                  name="Suggestions"
                />
                <Line 
                  type="monotone" 
                  dataKey="accepted" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={false}
                  name="Accepted"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Prompts */}
        <div className="glass-card p-6 rounded-2xl border border-white/10">
          <h3 className="text-lg font-bold text-white mb-6">Top Performing Prompts</h3>
          <div className="space-y-4">
            {data.topPerformingPrompts.map((item, i) => (
              <div key={i} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded">
                    #{i + 1}
                  </span>
                  <span className="text-xs font-bold text-emerald-400">
                    {item.successRate}% Success
                  </span>
                </div>
                <p className="text-sm text-white/80 font-medium mb-1 line-clamp-2">
                  "{item.prompt}"
                </p>
                <p className="text-xs text-muted-foreground text-right">
                  Used {item.count} times
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
