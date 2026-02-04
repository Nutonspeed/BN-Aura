'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SpinnerGap } from '@phosphor-icons/react';
import { SettingsProvider, useSettingsContext } from './context';
import SettingsHeader from './components/SettingsHeader';
import SettingsNavigation from './components/SettingsNavigation';
import CompanySettings from './components/CompanySettings';
import RegionalSettings from './components/RegionalSettings';
import FeatureFlags from './components/FeatureFlags';
import PricingSettings from './components/PricingSettings';
import EmailTemplates from './components/EmailTemplates';
import { SystemSettings } from './types';

function SettingsContent() {
  const { settings, loading, activeSection, refreshSettings, updateSettings } = useSettingsContext();
  const [pendingChanges, setPendingChanges] = useState<Partial<SystemSettings>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const handleSettingsChange = (updates: Partial<SystemSettings>) => {
    setPendingChanges(prev => ({ ...prev, ...updates }));
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
          <div className="glass-card p-8 rounded-2xl border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">AI Configuration</h2>
            <p className="text-white/60">AI settings will be implemented in the next update.</p>
          </div>
        );
      case 'email':
        return <EmailTemplates onSettingsChange={handleSettingsChange} />;
      case 'security':
        return (
          <div className="glass-card p-8 rounded-2xl border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">Security Settings</h2>
            <p className="text-white/60">Security configuration will be implemented in the next update.</p>
          </div>
        );
      case 'subscriptions':
        return <PricingSettings onSettingsChange={handleSettingsChange} />;
      case 'storage':
        return (
          <div className="glass-card p-8 rounded-2xl border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">Storage & Files</h2>
            <p className="text-white/60">Storage configuration will be implemented in the next update.</p>
          </div>
        );
      default:
        return <CompanySettings onSettingsChange={handleSettingsChange} />;
    }
  };

  if (loading && !settings) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <SettingsHeader 
        onSave={handleSave}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Settings Navigation - Takes 1 column */}
        <div className="lg:col-span-1">
          <SettingsNavigation />
        </div>

        {/* Settings Content - Takes 3 columns */}
        <div className="lg:col-span-3">
          {renderActiveSection()}
        </div>
      </div>

      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 right-6 bg-amber-500/20 border border-amber-500/50 rounded-xl p-4 backdrop-blur-md"
        >
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
            <div>
              <p className="text-amber-400 font-medium text-sm">You have unsaved changes</p>
              <p className="text-amber-300/80 text-xs">Don't forget to save your settings</p>
            </div>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all text-sm font-medium"
            >
              Save Now
            </button>
          </div>
        </motion.div>
      )}
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
