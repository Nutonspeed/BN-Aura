'use client';

import { motion } from 'framer-motion';
import { CurrencyDollar, ChartBar, Graph, Info, Sparkle, Pulse } from '@phosphor-icons/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface RevenueChartProps {
  data: { plan: string; amount: number; count: number }[];
  formatCurrency: (amount: number) => string;
}

export default function RevenueChart({ data, formatCurrency }: RevenueChartProps) {
  const maxAmount = Math.max(...data.map(item => item.amount));
  
  const getPlanColor = (index: number) => {
    const colors = ['bg-emerald-400', 'bg-blue-400', 'bg-purple-400', 'bg-amber-400'];
    return colors[index % colors.length];
  };

  return (
    <Card className="rounded-[40px] border-border/50 shadow-premium overflow-hidden group">
      <CardHeader className="p-8 border-b border-border/50 bg-secondary/30 relative">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
          <Graph weight="fill" className="w-48 h-48 text-primary" />
        </div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
            <CurrencyDollar weight="duotone" className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-xl font-black uppercase tracking-tight">Revenue Matrix</CardTitle>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1">Fiscal distribution by protocol tier</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-8 md:p-10 space-y-10 relative z-10">
        <div className="space-y-8">
          {data.map((item, index) => (
            <div key={item.plan} className="space-y-4 group/item">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-4">
                  <div className={cn("w-2.5 h-2.5 rounded-full shadow-sm", getPlanColor(index))} />
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-foreground uppercase tracking-tight group-hover/item:text-primary transition-colors">{item.plan}</span>
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60">{item.count} ACTIVE_NODES</span>
                  </div>
                </div>
                <span className="text-lg font-black text-foreground tabular-nums tracking-tighter">{formatCurrency(item.amount)}</span>
              </div>
              
              {/* Progress Bar Node */}
              <div className="w-full bg-secondary/50 rounded-full h-2 border border-border/30 p-0.5 shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.amount / maxAmount) * 100}%` }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 1, ease: "circOut" }}
                  className={cn("h-full rounded-full transition-all shadow-sm", getPlanColor(index))}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Summary Footer */}
        <div className="mt-10 pt-8 border-t border-border/30">
          <div className="flex items-center justify-between bg-primary/5 p-6 rounded-[28px] border border-primary/10 group/total overflow-hidden relative shadow-inner">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover/total:scale-110 transition-transform">
              <Pulse weight="fill" className="w-16 h-16 text-primary" />
            </div>
            <div className="space-y-1 relative z-10">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Consolidated Yield</span>
              <p className="text-[9px] text-muted-foreground font-medium italic opacity-60">Global fiscal synchronization nominal</p>
            </div>
            <span className="text-3xl font-black text-primary tabular-nums tracking-tighter relative z-10 text-glow-sm">
              {formatCurrency(data.reduce((sum, item) => sum + item.amount, 0))}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
