'use client';

import { motion } from 'framer-motion';
import { 
  ChatCircle, 
  ThumbsUp, 
  ThumbsDown, 
  Warning,
  Lightbulb,
  Smiley,
  SmileyMeh,
  SmileyXEyes,
  TrendUp
} from '@phosphor-icons/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface VoCData {
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  topConcerns: Array<{ topic: string; count: number }>;
  recentFeedback: Array<{
    id: string;
    customer: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    comment: string; // Summary or excerpt
    date: string;
  }>;
  satisfactionTrend: Array<{ date: string; score: number }>; // 0-10
}

interface VoCAnalyticsWidgetProps {
  data: VoCData;
}

export default function VoCAnalyticsWidget({ data }: VoCAnalyticsWidgetProps) {
  const total = data.sentimentDistribution.positive + data.sentimentDistribution.neutral + data.sentimentDistribution.negative;
  
  const getPercentage = (count: number) => ((count / total) * 100).toFixed(1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sentiment Overview */}
      <div className="bg-card p-6 rounded-2xl border border-border shadow-card lg:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <ChatCircle className="w-5 h-5 text-primary" />
            Sentiment Analysis
          </h3>
          <span className="text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded-lg">Last 30 Days</span>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
            <Smiley className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-black text-white">{getPercentage(data.sentimentDistribution.positive)}%</p>
            <p className="text-xs font-bold text-green-400 uppercase tracking-wider">Positive</p>
          </div>
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-center">
            <SmileyMeh className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <p className="text-2xl font-black text-white">{getPercentage(data.sentimentDistribution.neutral)}%</p>
            <p className="text-xs font-bold text-yellow-400 uppercase tracking-wider">Neutral</p>
          </div>
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
            <SmileyXEyes className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-2xl font-black text-white">{getPercentage(data.sentimentDistribution.negative)}%</p>
            <p className="text-xs font-bold text-red-400 uppercase tracking-wider">Negative</p>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendUp className="w-4 h-4 text-blue-400" />
            Satisfaction Trend (Avg Score)
          </h4>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" aspect={2} minHeight={200}>
              <BarChart data={data.satisfactionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} domain={[0, 10]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', fontSize: '12px' }}
                  itemStyle={{ color: '#fff' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20}>
                  {data.satisfactionTrend.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.score >= 8 ? '#10b981' : entry.score >= 5 ? '#eab308' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Concerns & Insights */}
      <div className="space-y-6">
        {/* Concerns */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-card">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Warning className="w-5 h-5 text-orange-400" />
            Top Concerns
          </h3>
          <div className="space-y-3">
            {data.topConcerns.map((concern, i) => (
              <div key={i} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors">
                <span className="text-sm text-white/80">{concern.topic}</span>
                <span className="text-xs font-bold bg-white/10 px-2 py-1 rounded text-white">{concern.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Feedback Highlights */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-card max-h-[300px] overflow-y-auto custom-scrollbar">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-purple-400" />
            Recent Insights
          </h3>
          <div className="space-y-4">
            {data.recentFeedback.map((fb) => (
              <div key={fb.id} className="p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white">{fb.customer}</span>
                  {fb.sentiment === 'positive' ? <ThumbsUp className="w-3 h-3 text-green-400" /> : 
                   fb.sentiment === 'negative' ? <ThumbsDown className="w-3 h-3 text-red-400" /> : 
                   <div className="w-2 h-2 rounded-full bg-yellow-400" />}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">"{fb.comment}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}