'use client';

import { Shield, Users, Lock, Icon } from '@phosphor-icons/react';
import { usePermissionsContext } from '../context';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function NavigationTabs() {
  const { activeTab, setActiveTab } = usePermissionsContext();
  const t = useTranslations('admin.permissions');

  const tabs = [
    { id: 'roles' as const, label: t('roles'), icon: Shield },
    { id: 'users' as const, label: t('users'), icon: Users },
    { id: 'permissions' as const, label: t('permissions_list'), icon: Lock }
  ];

  return (
    <div className="flex bg-secondary/50 border border-border/50 p-1.5 rounded-[24px] shadow-inner relative overflow-hidden">
      <div className="flex w-full items-center gap-2 relative z-10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-3 py-3 px-6 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest border relative group",
              activeTab === tab.id
                ? "bg-card text-primary border-border/50 shadow-sm"
                : "text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary/50"
            )}
          >
            <tab.icon weight={activeTab === tab.id ? "fill" : "bold"} className={cn("w-4 h-4 transition-transform group-hover:scale-110", activeTab === tab.id ? "text-primary" : "opacity-60")} />
            <span className="relative z-10">{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div 
                layoutId="active-permission-tab"
                className="absolute inset-0 bg-primary/5 rounded-2xl z-[-1]"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
