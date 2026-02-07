'use client';

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
import { motion } from 'framer-motion';
import { 
  Funnel
} from '@phosphor-icons/react';
const COLORS = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];

interface FunnelData {
  name: string;
  value: number;
  percentage: number;
}

interface SalesFunnelChartProps {
  data: FunnelData[];
  period?: string;
}

export default function SalesFunnelChartClient({ data, period = 'This Month' }: SalesFunnelChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-6 rounded-2xl border border-white/10"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Funnel className="w-5 h-5 text-primary" />
            Sales Funnel
          </h3>
          <p className="text-sm text-muted-foreground">Conversion tracking • {period}</p>
        </div>
      </div>

      <div className="h-[400px] w-full relative">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              stroke="#6b7280" 
              fontSize={12}
              width={100}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: '#0f172a', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px'
              }}
              itemStyle={{ color: '#fff' }}
            />
            <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={40}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}