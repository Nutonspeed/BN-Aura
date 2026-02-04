'use client';

import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { motion } from 'framer-motion';
import { Target, TrendUp, Users, WarningCircle } from '@phosphor-icons/react';

export default function PredictiveDashboardClient() {
  // Mock Data for Win Probability Heat Map (Leads)
  const leadsData = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    engagement: Math.floor(Math.random() * 100),
    value: Math.floor(Math.random() * 50000) + 5000,
    probability: Math.floor(Math.random() * 100),
    name: `Lead ${i + 1}`
  }));

  const funnelPrediction = [
    { stage: 'Contacted', current: 150, predicted: 165 },
    { stage: 'Qualified', current: 80, predicted: 95 },
    { stage: 'Proposal', current: 40, predicted: 52 },
    { stage: 'Won', current: 20, predicted: 28 },
  ];

  const staffPrediction = [
    { name: 'Sarah', current: 85, predicted: 92, status: 'improving' },
    { name: 'Mike', current: 72, predicted: 70, status: 'declining' },
    { name: 'Jessica', current: 90, predicted: 95, status: 'stable' },
    { name: 'Tom', current: 65, predicted: 78, status: 'improving' },
  ];

  return (
    <div className="space-y-8">
      {/* 1. Win Probability Map */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 rounded-2xl border border-white/10"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Win Probability Map
            </h3>
            <p className="text-sm text-muted-foreground">High value & high engagement leads</p>
          </div>
        </div>

        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                type="number" 
                dataKey="engagement" 
                name="Engagement Score" 
                unit="%" 
                stroke="#6b7280"
                label={{ value: 'Engagement Score', position: 'bottom', offset: 0, fill: '#6b7280', fontSize: 12 }}
              />
              <YAxis 
                type="number" 
                dataKey="value" 
                name="Deal Value" 
                unit="฿" 
                stroke="#6b7280"
                label={{ value: 'Deal Value', angle: -90, position: 'left', fill: '#6b7280', fontSize: 12 }}
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 border border-white/10 p-3 rounded-xl shadow-xl text-xs">
                        <p className="font-bold text-white mb-1">{data.name}</p>
                        <p className="text-muted-foreground">Value: <span className="text-emerald-400">฿{data.value.toLocaleString()}</span></p>
                        <p className="text-muted-foreground">Win Prob: <span className="text-primary">{data.probability}%</span></p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter name="Leads" data={leadsData} fill="#8b5cf6">
                {leadsData.map((entry, index) => (
                  <circle 
                    key={`cell-${index}`} 
                    r={Math.sqrt(entry.probability) / 2}
                    fill={entry.probability > 70 ? '#10b981' : entry.probability > 40 ? '#f59e0b' : '#ef4444'}
                    fillOpacity={0.7}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* 2. Funnel Prediction */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6 rounded-2xl border border-white/10"
      >
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          Pipeline Forecast (30 Days)
        </h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnelPrediction} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" stroke="#6b7280" fontSize={12} />
              <YAxis dataKey="stage" type="category" stroke="#6b7280" fontSize={12} width={80} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend />
              <Bar dataKey="current" name="Current" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
              <Bar dataKey="predicted" name="Predicted" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* 3. Staff Performance Prediction */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6 rounded-2xl border border-white/10"
      >
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-400" />
          Staff Performance Forecast
        </h3>
        <div className="space-y-4">
          {staffPrediction.map((staff, i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-xs font-bold text-white">
                {staff.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="font-bold text-white text-sm">{staff.name}</span>
                  <span className={`text-xs font-bold ${
                    staff.status === 'improving' ? 'text-emerald-400' : 
                    staff.status === 'declining' ? 'text-red-400' : 'text-blue-400'
                  }`}>
                    {staff.predicted > staff.current ? '↑' : staff.predicted < staff.current ? '↓' : '→'} {Math.abs(staff.predicted - staff.current)}%
                  </span>
                </div>
                <div className="relative h-2 bg-black/20 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-blue-500 rounded-full opacity-50" 
                    style={{ width: `${staff.current}%` }}
                  />
                  <div 
                    className="absolute top-0 left-0 h-full bg-purple-500 rounded-full border-l-2 border-white/20" 
                    style={{ width: `${staff.predicted}%`, zIndex: 1 }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                  <span>Current: {staff.current}%</span>
                  <span>Predicted: {staff.predicted}%</span>
                </div>
              </div>
              {staff.status === 'declining' && (
                <div title="Needs Coaching">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
