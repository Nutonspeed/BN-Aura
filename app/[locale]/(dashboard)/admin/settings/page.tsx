'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SpinnerGap, 
  ArrowLeft, 
  Gear, 
  ShieldCheck, 
  Bell, 
  Globe, 
  Sparkle, 
  HardDrive, 
  CreditCard, 
  PuzzlePiece,
  Pulse,
  CheckCircle,
  WarningCircle
} from '@phosphor-icons/react';
import { SettingsProvider, useSettingsContext } from './context';
import SettingsHeader from './components/SettingsHeader';
import SettingsNavigation from './components/SettingsNavigation';
import CompanySettings from './components/CompanySettings';
import RegionalSettings from './components/RegionalSettings';
import FeatureFlags from './components/FeatureFlags';
import PricingSettings from './components/PricingSettings';
import EmailTemplates from './components/EmailTemplates';
import { SystemSettings } from './types';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

function SettingsContent() {
  const { goBack } = useBackNavigation();
  const { settings, loading, activeSection, refreshSettings, updateSettings } = useSettingsContext();
  const [pendingChanges, setPendingChanges] = useState<Partial<SystemSettings>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const handleSettingsChange = (updates: Partial<SystemSettings>) => {
    setPendingChanges((prev: Partial<SystemSettings>) => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    try {
      await updateSettings(pendingChanges);
      setPendingChanges({});
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
      // You could add a toast notification here
    }
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'company':
        return <CompanySettings onSettingsChange={handleSettingsChange} />;
      case 'regional':
        return <RegionalSettings onSettingsChange={handleSettingsChange} />;
      case 'features':
        return <FeatureFlags onSettingsChange={handleSettingsChange} />;
      case 'ai':
        return (
          <Card className="p-8 rounded-[40px] border-border/50 shadow-premium group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
              <Sparkle weight="fill" className="w-48 h-48 text-primary" />
            </div>
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                  <Sparkle weight="duotone" className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">AI Configuration</h2>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-black mt-1">Machine learning model parameters</p>
                </div>
              </div>
              <div className="p-6 bg-secondary/30 rounded-[32px] border border-border/50 shadow-inner">
                <p className="text-sm text-muted-foreground font-medium italic leading-relaxed">
                  Autonomous diagnostic nodes and cognitive processing parameters will be accessible in the next synchronization cycle.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Protocol Pending Implementation</span>
              </div>
            </div>
          </Card>
        );
      case 'email':
        return <EmailTemplates onSettingsChange={handleSettingsChange} />;
      case 'security':
        return (
          <Card className="p-8 rounded-[40px] border-border/50 shadow-premium group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
              <ShieldCheck weight="fill" className="w-48 h-48 text-primary" />
            </div>
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                  <ShieldCheck weight="duotone" className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Security Settings</h2>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-black mt-1">Access control & identity encryption</p>
                </div>
              </div>
              <div className="p-6 bg-secondary/30 rounded-[32px] border border-border/50 shadow-inner">
                <p className="text-sm text-muted-foreground font-medium italic leading-relaxed">
                  Global authentication protocols and regional access matrices are currently under administrative lock.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Protocol Pending Implementation</span>
              </div>
            </div>
          </Card>
        );
      case 'subscriptions':
        return <PricingSettings onSettingsChange={handleSettingsChange} />;
      case 'storage':
        return (
          <Card className="p-8 rounded-[40px] border-border/50 shadow-premium group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
              <HardDrive weight="fill" className="w-48 h-48 text-primary" />
            </div>
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                  <HardDrive weight="duotone" className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Storage & Files</h2>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-black mt-1">Cloud asset & telemetry storage</p>
                </div>
              </div>
              <div className="p-6 bg-secondary/30 rounded-[32px] border border-border/50 shadow-inner">
                <p className="text-sm text-muted-foreground font-medium italic leading-relaxed">
                  Distributed cloud storage nodes and asset retention policies will be synchronized in version 2.0.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Protocol Pending Implementation</span>
              </div>
            </div>
          </Card>
        );
      default:
        return <CompanySettings onSettingsChange={handleSettingsChange} />;
    }
  };

  if (loading && !settings) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <SpinnerGap className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse text-xs uppercase tracking-widest text-center">
          Synchronizing System Configuration...
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-20 font-sans"
    >
      <Breadcrumb />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]"
          >
            <Gear weight="duotone" className="w-4 h-4" />
            System Control Node
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-foreground tracking-tight"
          >
            Global <span className="text-primary">Settings</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            Configuring global parameters, feature flags, and clinical orchestration.
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
            onClick={handleSave}
            disabled={!hasUnsavedChanges || loading}
            className="shadow-premium px-8"
          >
            Save Configuration
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Settings Navigation - Takes 1 column */}
        <div className="lg:col-span-1">
          <Card className="sticky top-28 border-border/50">
            <CardContent className="p-2">
              <SettingsNavigation />
            </CardContent>
          </Card>
        </div>

        {/* Settings Content - Takes 3 columns */}
        <div className="lg:col-span-3 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderActiveSection()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export default function SettingsPage() {
  return (
    <SettingsProvider>
      <SettingsContent />
    </SettingsProvider>
  );
}
