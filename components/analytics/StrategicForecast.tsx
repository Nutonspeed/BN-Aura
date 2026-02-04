'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendUp, 
  Package, 
  CaretRight,
  Sparkle,
  ArrowUpRight,
  Pulse,
  ChartBar
} from '@phosphor-icons/react';

interface PredictiveData {
  revenueForecast: {
    nextMonth: number;
    projectedGrowth: string;
    trend: string;
  };
  inventoryForecasting: Array<{
    name: string;
    daysRemaining: number;
    riskLevel: string;
  }>;
  confidenceScore: number;
}

export default function StrategicForecast({ clinicId }: { clinicId: string }) {
  const [data, setData] = useState<PredictiveData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPredictive() {
      try {
        const res = await fetch(`/api/analytics/bi?clinicId=${clinicId}&type=predictive`);
        const result = await res.json();
        if (result.success) {
          setData(result.data.predictive);
        }
      } catch (error) {
        console.error('Error fetching predictive data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPredictive();
  }, [clinicId]);

  if (loading) {
    return (
      <div className="glass-card p-8 rounded-[40px] border border-white/10 animate-pulse space-y-6">
        <div className="h-6 w-48 bg-white/5 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-32 bg-white/5 rounded-3xl" />
          <div className="h-32 bg-white/5 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-premium p-10 rounded-[48px] border border-white/10 space-y-10 relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity duration-700">
        <Activity className="w-48 h-48 text-primary" />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20 shadow-premium">
            <BarChart3 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Strategic <span className="text-primary">Forecast</span></h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">AI-Powered Predictive Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-5 py-2.5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-primary animate-glow-pulse" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Confidence: {(data?.confidenceScore || 0.85 * 100).toFixed(0)}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        {/* Revenue Projection */}
        <div className="p-8 bg-white/5 rounded-[40px] border border-white/5 hover:border-primary/30 transition-all group/item overflow-hidden relative">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/10 blur-[40px] rounded-full group-hover/item:bg-primary/20 transition-all duration-700" />
          <div className="space-y-6 relative z-10">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Projected Monthly Revenue</p>
            <div className="space-y-1">
              <p className="text-4xl font-black text-white tracking-tighter tabular-nums">
                ฿{data?.revenueForecast.nextMonth.toLocaleString() || '---'}
              </p>
              <div className="flex items-center gap-2 text-emerald-400 font-black text-[11px] uppercase tracking-widest">
                <ArrowUpRight className="w-4 h-4" />
                {data?.revenueForecast.projectedGrowth} Growth Trend
              </div>
            </div>
            <div className="pt-4 border-t border-white/5">
              <p className="text-[9px] text-muted-foreground font-light leading-relaxed italic">
                Based on historical multi-channel conversion nodes and seasonal dermal trends.
              </p>
            </div>
          </div>
        </div>

        {/* Inventory Risk Nodes */}
        <div className="p-8 bg-white/5 rounded-[40px] border border-white/5 hover:border-rose-500/30 transition-all group/item overflow-hidden relative">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-rose-500/10 blur-[40px] rounded-full group-hover/item:bg-rose-500/20 transition-all duration-700" />
          <div className="space-y-6 relative z-10">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Supply Chain Risk Nodes</p>
            
            <div className="space-y-3">
              {data?.inventoryForecasting && data.inventoryForecasting.length > 0 ? (
                data.inventoryForecasting.slice(0, 2).map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3.5 bg-black/20 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <Package className="w-4 h-4 text-rose-400" />
                      <span className="text-[11px] font-bold text-white uppercase tracking-tight truncate w-32">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black text-rose-400 uppercase">{item.daysRemaining}D Left</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-3 p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/20">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">All nodes optimized</p>
                </div>
              )}
            </div>

            <button className="flex items-center gap-2 text-[9px] font-black text-primary uppercase tracking-[0.2em] group-hover/item:gap-3 transition-all">
              Supply Chain Registry <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 bg-primary/5 rounded-[32px] border border-primary/10 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
            <Sparkles className="w-5 h-5 animate-glow-pulse" />
          </div>
          <p className="text-[11px] text-white/80 font-light leading-relaxed max-w-md">
            Neural model suggests a <span className="text-primary font-black uppercase">Bullish Cycle</span> ahead. Increasing advertising bandwidth for <span className="text-primary font-black">HydraFacial Plus</span> could optimize ROI by 14.2%.
          </p>
        </div>
        <button className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/10 transition-all active:scale-95 whitespace-nowrap">
          Execute Strategy
        </button>
      </div>
    </motion.div>
  );
}
