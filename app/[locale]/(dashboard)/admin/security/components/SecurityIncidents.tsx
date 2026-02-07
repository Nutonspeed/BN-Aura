'use client';

import { motion } from 'framer-motion';
import { 
  ShieldCheck,
  ShieldWarning,
  CheckCircle,
  Warning,
  Pulse
} from '@phosphor-icons/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface SecurityIncidentsProps {
  resolvedIncidents: number;
  activeIncidents: number;
}

export default function SecurityIncidents({ resolvedIncidents, activeIncidents }: SecurityIncidentsProps) {
  return (
    <Card className="rounded-[40px] border-border/50 shadow-premium overflow-hidden group">
      <CardHeader className="p-8 border-b border-border/50 bg-secondary/30 relative">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
          <ShieldCheck weight="fill" className="w-48 h-48 text-primary" />
        </div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm transition-all group-hover:bg-primary/20">
            <ShieldCheck weight="duotone" className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-xl font-black uppercase tracking-tight">Incident Oversight</CardTitle>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Global security breach monitoring</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-8 md:p-10 relative z-10">
        <div className="grid grid-cols-2 gap-8">
          <div className="text-center p-8 bg-emerald-500/5 rounded-[32px] border border-emerald-500/10 shadow-inner group/node relative overflow-hidden transition-all hover:bg-emerald-500/10">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover/node:opacity-5 transition-opacity">
              <CheckCircle weight="fill" className="w-16 h-16 text-emerald-500" />
            </div>
            <p className="text-5xl font-black text-emerald-500 tabular-nums tracking-tighter mb-2">{resolvedIncidents}</p>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle weight="bold" className="w-3.5 h-3.5 text-emerald-500/60" />
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Settled Nodes</p>
            </div>
          </div>
          <div className="text-center p-8 bg-rose-500/5 rounded-[32px] border border-rose-500/10 shadow-inner group/node relative overflow-hidden transition-all hover:bg-rose-500/10">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover/node:opacity-5 transition-opacity">
              <ShieldWarning weight="fill" className="w-16 h-16 text-rose-500" />
            </div>
            <p className="text-5xl font-black text-rose-500 tabular-nums tracking-tighter mb-2">{activeIncidents}</p>
            <div className="flex items-center justify-center gap-2">
              <Pulse weight="bold" className="w-3.5 h-3.5 text-rose-500/60 animate-pulse" />
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Active Threats</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
