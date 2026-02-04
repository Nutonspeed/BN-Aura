'use client';

import { ChartBar, ArrowsClockwise, DownloadSimple } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';

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
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-primary" />
          {t('title')}
        </h1>
        <p className="text-white/60 mt-1">{t('description')}</p>
      </div>

      <div className="flex items-center gap-3">
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="bg-white/10 border border-white/10 rounded-xl py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="7d" className="bg-slate-800">{t('period_7d')}</option>
          <option value="30d" className="bg-slate-800">{t('period_30d')}</option>
          <option value="90d" className="bg-slate-800">{t('period_90d')}</option>
          <option value="1y" className="bg-slate-800">{t('period_1y')}</option>
        </select>
        
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {tCommon('refresh')}
        </button>

        <button 
          onClick={onExport}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:brightness-110 transition-all flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          {tCommon('export')}
        </button>
      </div>
    </div>
  );
}
