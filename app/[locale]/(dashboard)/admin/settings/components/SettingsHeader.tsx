'use client';

import { 
  Gear,
  FloppyDisk,
  ArrowsClockwise,
  ShieldCheck,
  Pulse
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettingsContext } from '../context';

interface SettingsHeaderProps {
  onSave: () => void;
  hasUnsavedChanges: boolean;
}

export default function SettingsHeader({ onSave, hasUnsavedChanges }: SettingsHeaderProps) {
  const { refreshSettings, loading } = useSettingsContext();

  const handleRefresh = async () => {
    await refreshSettings();
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
      <div className="space-y-1">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]"
        >
          <Pulse weight="duotone" className="w-4 h-4" />
          System Control Node
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl font-heading font-bold text-foreground tracking-tight uppercase"
        >
          Global <span className="text-primary">Settings</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground font-light text-sm italic"
        >
          จัดการพารามิเตอร์ระบบ ฟีเจอร์ และการตั้งค่าคลินิก
        </motion.p>
      </div>
      
      <div className="flex items-center gap-3">
        <AnimatePresence>
          {hasUnsavedChanges && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 20 }}
              className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl"
            >
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">Unsaved Changes</span>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={loading}
          className="gap-2 px-6 py-6 rounded-2xl text-xs font-black uppercase tracking-widest border-border/50 hover:bg-secondary group"
        >
          <ArrowsClockwise weight="bold" className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Sync Intel
        </Button>

        <Button
          onClick={onSave}
          disabled={!hasUnsavedChanges || loading}
          className="gap-2 px-8 py-6 rounded-2xl text-xs font-black uppercase tracking-widest shadow-premium group"
        >
          <FloppyDisk weight="bold" className="w-4 h-4 group-hover:scale-110 transition-transform" />
          Commit Changes
        </Button>
      </div>
    </div>
  );
}
