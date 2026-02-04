'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendUp, TrendDown, Lightning, HardDrive, Clock } from '@phosphor-icons/react';
import { NetworkNode } from '@/app/[locale]/(dashboard)/admin/network-map/page';

interface NetworkPerformanceChartsProps {
  nodes: NetworkNode[];
  selectedNode?: NetworkNode | null;
}

export default function NetworkPerformanceCharts({ nodes, selectedNode }: NetworkPerformanceChartsProps) {
  const [data, setData] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h');

  useEffect(() => {
    const generateData = () => {
      const points = [];
      const configs = {
        '1h': { count: 12, interval: 300000, format: (d: Date) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
        '6h': { count: 36, interval: 600000, format: (d: Date) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
        '24h': { count: 24, interval: 3600000, format: (d: Date) => d.toLocaleTimeString('en-US', { hour: '2-digit' }) },
        '7d': { count: 168, interval: 3600000, format: (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }
      };
      const config = configs[timeRange];
      
      for (let i = config.count - 1; i >= 0; i--) {
        const time = new Date(Date.now() - i * config.interval);
        const base = selectedNode?.metrics.latency || 50;
        points.push({
          time: config.format(time),
          latency: Math.max(10, base + (Math.random() - 0.5) * 30),
          load: Math.max(0, Math.min(100, (selectedNode?.metrics.load || 60) + (Math.random() - 0.5) * 40))
        });
      }
      return points;
    };
    setData(generateData());
  }, [selectedNode, timeRange]);

  const avgLatency = data.length > 0 ? Math.round(data.reduce((sum, d) => sum + d.latency, 0) / data.length) : 0;
  const avgLoad = data.length > 0 ? Math.round(data.reduce((sum, d) => sum + d.load, 0) / data.length) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-white/60 text-sm">Avg Latency</span>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-bold text-white">{avgLatency}</span>
            <span className="text-white/60 text-sm">ms</span>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="w-4 h-4 text-purple-400" />
            <span className="text-white/60 text-sm">Avg Load</span>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-bold text-white">{avgLoad}</span>
            <span className="text-white/60 text-sm">%</span>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="text-white/60 text-sm">Uptime</span>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-bold text-white">{selectedNode?.metrics.uptime.toFixed(1) || '99.9'}</span>
            <span className="text-white/60 text-sm">%</span>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium">Performance Trends</h3>
          <div className="flex gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
            {(['1h', '6h', '24h', '7d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  timeRange === range
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-400/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="time" stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} />
            <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
            <Line type="monotone" dataKey="latency" stroke="#f59e0b" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="load" stroke="#a855f7" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
