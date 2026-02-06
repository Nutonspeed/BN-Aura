'use client';

import { motion } from 'framer-motion';
import { TrendUp, Buildings, Target, Sparkle, Pulse } from '@phosphor-icons/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface TopClinicsChartProps {
  data: { clinic: string; scans: number }[];
  formatNumber: (num: number) => string;
}

export default function TopClinicsChart({ data, formatNumber }: TopClinicsChartProps) {
  const maxScans = Math.max(...data.map(item => item.scans));

  return (
    <Card className="rounded-[40px] border-border/50 shadow-premium overflow-hidden group">
      <CardHeader className="p-8 border-b border-border/50 bg-secondary/30 relative">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
          <Buildings weight="fill" className="w-48 h-48 text-primary" />
        </div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
            <TrendUp weight="duotone" className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-xl font-black uppercase tracking-tight">Node Utilization</CardTitle>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1">Top diagnostic throughput by cluster</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-8 md:p-10 space-y-6 relative z-10">
        {data.length > 0 ? (
          <div className="space-y-4">
            {data.map((item, index) => (
              <motion.div
                key={item.clinic}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-5 bg-secondary/20 rounded-[28px] border border-border/50 hover:border-primary/30 transition-all group/node relative overflow-hidden shadow-sm"
              >
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/node:opacity-100 transition-opacity" />
                
                <div className="flex items-center gap-5 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-card border border-border/50 flex items-center justify-center text-primary font-black text-sm shadow-inner group-hover/node:scale-110 transition-transform">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-foreground truncate uppercase tracking-tight leading-tight">{item.clinic}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Buildings weight="bold" className="w-3 h-3 text-primary/40" />
                      <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Active Node</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8 relative z-10">
                  <div className="hidden sm:flex flex-col items-end gap-2">
                    <div className="flex items-center justify-between w-32 px-1">
                      <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Node Flux</span>
                      <span className="text-[10px] font-bold text-foreground">{Math.round((item.scans / maxScans) * 100)}%</span>
                    </div>
                    <div className="w-32 h-1.5 bg-secondary rounded-full overflow-hidden p-0.5 border border-border/30 shadow-inner">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.scans / maxScans) * 100}%` }}
                        transition={{ delay: 0.5 + index * 0.1, duration: 1, ease: "circOut" }}
                        className="h-full rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.4)]"
                      />
                    </div>
                  </div>
                  
                  <div className="text-right min-w-[100px]">
                    <p className="text-lg font-black text-foreground tabular-nums tracking-tighter">
                      {formatNumber(item.scans)}
                    </p>
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest leading-none">Diagnostic Cycles</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-secondary/10 rounded-[32px] border border-dashed border-border/50 opacity-40">
            <Pulse weight="duotone" className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <p className="text-xs font-black uppercase tracking-[0.2em]">Zero Telemetry Established</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
