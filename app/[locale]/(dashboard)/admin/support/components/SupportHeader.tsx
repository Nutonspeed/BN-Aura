'use client';

import { 
  Headphones,
  Plus,
  ArrowsClockwise
} from '@phosphor-icons/react';
import { useSupportContext } from '../context';
import { useTranslations } from 'next-intl';

interface SupportHeaderProps {
  onCreateTicket: () => void;
}

export default function SupportHeader({ onCreateTicket }: SupportHeaderProps) {
  const { refreshTickets, loading } = useSupportContext();
  const t = useTranslations('admin.support');

  const handleRefresh = async () => {
    await refreshTickets();
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Headphones className="w-8 h-8 text-primary" />
          {t('title')}
        </h1>
        <p className="text-white/60 mt-1">{t('description')}</p>
      </div>
      
      <div className="flex items-center gap-3">
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <ArrowsClockwise className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>

        <button
          onClick={onCreateTicket}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:brightness-110 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('create_ticket')}
        </button>
      </div>
    </div>
  );
}
