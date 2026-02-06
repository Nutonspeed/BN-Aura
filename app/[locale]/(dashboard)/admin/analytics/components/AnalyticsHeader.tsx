'use client';

import { ChartBar, ArrowsClockwise, DownloadSimple, CaretDown, Pulse, Graph } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface AnalyticsHeaderProps {
  selectedPeriod: string;
  setSelectedPeriod: (period: string) => void;
  refreshing: boolean;
  onRefresh: () => void;
  onExport: () => void;
}

export default function AnalyticsHeader({ 
  selectedPeriod, 
  setSelectedPeriod, 
  refreshing, 
  onRefresh, 
  onExport 
}: AnalyticsHeaderProps) {
  const t = useTranslations('admin.analytics');
  const tCommon = useTranslations('common');
  
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
      <div className="space-y-1">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]"
        >
          <Pulse weight="duotone" className="w-4 h-4" />
          Intelligence Matrix Node
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl font-heading font-bold text-foreground tracking-tight uppercase"
        >
          System <span className="text-primary">Analytics</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground font-light text-sm italic"
        >
          Orchestrating global performance metrics, revenue trajectories, and cluster utilization data.
        </motion.p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative group/select">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-secondary/50 border border-border/50 rounded-2xl py-3 px-6 pr-12 text-[10px] font-black uppercase tracking-widest text-foreground focus:border-primary outline-none transition-all appearance-none shadow-inner"
          >
            <option value="7d" className="bg-card">{t('period_7d').toUpperCase()}</option>
            <option value="30d" className="bg-card">{t('period_30d').toUpperCase()}</option>
            <option value="90d" className="bg-card">{t('period_90d').toUpperCase()}</option>
            <option value="1y" className="bg-card">{t('period_1y').toUpperCase()}</option>
          </select>
          <CaretDown weight="bold" className="absolute right-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40 pointer-events-none" />
        </div>
        
        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={refreshing}
          className="gap-2 px-6 py-6 rounded-2xl text-xs font-black uppercase tracking-widest border-border/50 hover:bg-secondary group"
        >
          <ArrowsClockwise weight="bold" className={cn("w-4 h-4", refreshing && "animate-spin")} />
          Sync Intel
        </Button>

        <Button 
          onClick={onExport}
          className="gap-2 px-8 py-6 rounded-2xl text-xs font-black uppercase tracking-widest shadow-premium group"
        >
          <DownloadSimple weight="bold" className="w-4 h-4 group-hover:scale-110 transition-transform" />
          Export Matrix
        </Button>
      </div>
    </div>
  );
}