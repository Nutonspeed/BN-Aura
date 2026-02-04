'use client';

import { Shield, Users, Lock } from '@phosphor-icons/react';
import { usePermissionsContext } from '../context';
import { useTranslations } from 'next-intl';

export default function NavigationTabs() {
  const { activeTab, setActiveTab } = usePermissionsContext();
  const t = useTranslations('admin.permissions');

  const tabs = [
    { id: 'roles' as const, label: t('roles'), icon: Shield },
    { id: 'users' as const, label: t('users'), icon: Users },
    { id: 'permissions' as const, label: t('permissions_list'), icon: Lock }
  ];

  return (
    <div className="flex space-x-1 bg-white/10 rounded-xl p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-all ${
            activeTab === tab.id
              ? 'bg-primary text-primary-foreground shadow-lg'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <tab.icon className="w-4 h-4" />
          <span className="font-medium">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
