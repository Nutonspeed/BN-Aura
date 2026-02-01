'use client';

import { Lock, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PermissionsHeaderProps {
  onCreateRole: () => void;
}

export default function PermissionsHeader({ onCreateRole }: PermissionsHeaderProps) {
  const t = useTranslations('admin.permissions');
  
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Lock className="w-8 h-8 text-primary" />
          {t('title')}
        </h1>
        <p className="text-white/60 mt-1">{t('description')}</p>
      </div>
      
      <button
        onClick={onCreateRole}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:brightness-110 transition-all flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        {t('create_role')}
      </button>
    </div>
  );
}
