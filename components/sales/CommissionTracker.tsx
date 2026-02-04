'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Clock, ArrowUpRight, ChartBar } from '@phosphor-icons/react';

interface CommissionSummary {
  totalCommission: number;
  pendingCommission: number;
  paidCommission: number;
  transactionCount: number;
  averageCommission: number;
}

interface TargetStats {
  target: { target_amount: number };
  actualSales: number;
  progress: number;
}

export default function CommissionTracker({ salesId }: { salesId: string }) {
  const [summary, setSummary] = useState<CommissionSummary | null>(null);
  const [target, setTarget] = useState<TargetStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  useEffect(() => {
    async function fetchSalesData() {
      setLoading(true);
      try {
        const [commRes, targetRes] = await Promise.all([
          fetch(`/api/commissions?salesId=${salesId}&period=${period}`),
          fetch(`/api/sales/targets?userId=${salesId}`)
        ]);
        
        const commData = await commRes.json();
        const targetData = await targetRes.json();

        if (commData.success) {
          setSummary(commData.data);
        }
        if (targetData.success) {
          setTarget(targetData.data);
        }
      } catch (error) {
        console.error('Error fetching sales data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchSalesData();
  }, [salesId, period]);

  const progressValue = target?.target.target_amount ? Math.min(100, target.progress) : 0;

  return (
    <div className="glass-card p-8 rounded-[40px] border border-white/10 space-y-8 relative overflow-hidden group">
      {/* Background Glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 blur-[100px] rounded-full group-hover:bg-primary/20 transition-all duration-700" />

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white uppercase tracking-tight">Earning Intelligence</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Real-time Commission Tracking</p>
          </div>
        </div>
        
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          {(['daily', 'weekly', 'monthly'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-tighter rounded-lg transition-all ${
                period === p 
                  ? 'bg-primary text-primary-foreground shadow-lg' 
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-white/5 rounded-3xl border border-white/5" />
          ))}
        </div>
      ) : (
        <div className="space-y-6 relative z-10">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 bg-white/5 rounded-[32px] border border-white/5 space-y-1 hover:border-emerald-500/30 transition-all">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Total Earned</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-white">฿{(summary?.totalCommission || 0).toLocaleString()}</span>
                <ArrowUpRight className="w-3 h-3 text-emerald-400" />
              </div>
            </div>
            
            <div className="p-5 bg-white/5 rounded-[32px] border border-white/5 space-y-1 hover:border-primary/30 transition-all">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Pending</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-primary">฿{(summary?.pendingCommission || 0).toLocaleString()}</span>
                <Clock className="w-3 h-3 text-primary animate-pulse" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-white/5 to-transparent rounded-[32px] border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChartBar className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-bold text-white uppercase tracking-widest">Performance Stats</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Transactions</p>
                <p className="text-lg font-bold text-white">{summary?.transactionCount || 0}</p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Avg. Per Sale</p>
                <p className="text-lg font-bold text-emerald-400">฿{Math.round(summary?.averageCommission || 0).toLocaleString()}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-[9px] uppercase tracking-tighter font-bold">
                <span className="text-muted-foreground">Monthly Target Progress</span>
                <span className="text-primary">{Math.round(progressValue)}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressValue}%` }}
                  className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                />
              </div>
              {target && target.target.target_amount > 0 && (
                <p className="text-[8px] text-muted-foreground italic text-right">Goal: ฿{target.target.target_amount.toLocaleString()}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] text-white hover:bg-white/10 transition-all active:scale-95">
        View Detailed Report
      </button>
    </div>
  );
}
