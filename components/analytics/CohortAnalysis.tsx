'use client';

import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Users, Calendar } from 'lucide-react';

interface CohortData {
  cohort: string; // "Jan 2025"
  size: number;
  retention: {
    month1: number; // %
    month2: number;
    month3: number;
    month6: number;
    month12: number;
  };
  revenue: {
    total: number;
    perCustomer: number;
  };
}

interface CohortAnalysisProps {
  data: CohortData[];
}

export default function CohortAnalysis({ data }: CohortAnalysisProps) {
  // Transform data for chart if needed, or just display heatmap style
  
  const getRetentionColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-emerald-500/20 text-emerald-400';
    if (percentage >= 60) return 'bg-blue-500/20 text-blue-400';
    if (percentage >= 40) return 'bg-yellow-500/20 text-yellow-400';
    return 'bg-red-500/20 text-red-400';
  };

  return (
    <div className="glass-card p-6 rounded-2xl border border-white/10 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Customer Retention Cohorts
          </h3>
          <p className="text-sm text-muted-foreground">Retention rates by signup month</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
            Retention %
          </button>
          <button className="px-3 py-1.5 text-xs font-bold rounded-lg bg-transparent hover:bg-white/5 text-muted-foreground transition-colors">
            Revenue LTV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="text-muted-foreground border-b border-white/10">
              <th className="px-4 py-3 font-medium min-w-[120px]">Cohort</th>
              <th className="px-4 py-3 font-medium">Users</th>
              <th className="px-4 py-3 font-medium text-center">Month 1</th>
              <th className="px-4 py-3 font-medium text-center">Month 2</th>
              <th className="px-4 py-3 font-medium text-center">Month 3</th>
              <th className="px-4 py-3 font-medium text-center">Month 6</th>
              <th className="px-4 py-3 font-medium text-center">Month 12</th>
              <th className="px-4 py-3 font-medium text-right">LTV</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 font-medium text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  {row.cohort}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{row.size}</td>
                
                {/* Retention Cells */}
                <td className="px-2 py-2">
                  <div className={`w-full py-1.5 rounded text-center text-xs font-bold ${getRetentionColor(row.retention.month1)}`}>
                    {row.retention.month1}%
                  </div>
                </td>
                <td className="px-2 py-2">
                  <div className={`w-full py-1.5 rounded text-center text-xs font-bold ${getRetentionColor(row.retention.month2)}`}>
                    {row.retention.month2}%
                  </div>
                </td>
                <td className="px-2 py-2">
                  <div className={`w-full py-1.5 rounded text-center text-xs font-bold ${getRetentionColor(row.retention.month3)}`}>
                    {row.retention.month3}%
                  </div>
                </td>
                <td className="px-2 py-2">
                  <div className={`w-full py-1.5 rounded text-center text-xs font-bold ${getRetentionColor(row.retention.month6)}`}>
                    {row.retention.month6}%
                  </div>
                </td>
                <td className="px-2 py-2">
                  <div className={`w-full py-1.5 rounded text-center text-xs font-bold ${getRetentionColor(row.retention.month12)}`}>
                    {row.retention.month12}%
                  </div>
                </td>
                
                <td className="px-4 py-3 text-right font-bold text-white">
                  ฿{row.revenue.perCustomer.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-muted-foreground">
        <p>Average Retention (M3): <span className="text-white font-bold">68%</span></p>
        <p>Average LTV (12M): <span className="text-white font-bold">฿45,200</span></p>
      </div>
    </div>
  );
}
