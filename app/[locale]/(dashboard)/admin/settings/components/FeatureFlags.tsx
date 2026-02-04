'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lightning, Check, X } from '@phosphor-icons/react';
import { useSettingsContext } from '../context';

interface FeatureFlagsProps {
  onSettingsChange: (updates: any) => void;
}

export default function FeatureFlags({ onSettingsChange }: FeatureFlagsProps) {
  const { settings } = useSettingsContext();
  const [features, setFeatures] = useState({
    ai_analysis_enabled: true,
    subscription_billing: true,
    multi_branch_support: true,
    appointment_booking: true,
    inventory_management: true,
    analytics_dashboard: true,
    support_tickets: true,
    audit_logs: true
  });

  useEffect(() => {
    if (settings?.features) {
      setFeatures(settings.features);
    }
  }, [settings]);

  const handleToggle = (featureKey: string) => {
    const newFeatures = { ...features, [featureKey]: !features[featureKey as keyof typeof features] };
    setFeatures(newFeatures);
    onSettingsChange({ features: newFeatures });
  };

  const featureList = [
    {
      key: 'ai_analysis_enabled',
      name: 'AI Skin Analysis',
      description: 'Enable AI-powered skin analysis and recommendations',
      category: 'Core Features'
    },
    {
      key: 'subscription_billing',
      name: 'Subscription Billing',
      description: 'Enable subscription management and billing system',
      category: 'Business'
    },
    {
      key: 'multi_branch_support',
      name: 'Multi-Branch Support',
      description: 'Allow clinics to manage multiple branch locations',
      category: 'Business'
    },
    {
      key: 'appointment_booking',
      name: 'Appointment Booking',
      description: 'Enable online appointment booking system',
      category: 'Core Features'
    },
    {
      key: 'inventory_management',
      name: 'Inventory Management',
      description: 'Enable product and stock management',
      category: 'Operations'
    },
    {
      key: 'analytics_dashboard',
      name: 'Analytics Dashboard',
      description: 'Enable advanced analytics and reporting',
      category: 'Analytics'
    },
    {
      key: 'support_tickets',
      name: 'Support Tickets',
      description: 'Enable customer support ticket system',
      category: 'Support'
    },
    {
      key: 'audit_logs',
      name: 'Audit Logs',
      description: 'Enable system activity logging and audit trails',
      category: 'Security'
    }
  ];

  const categories = [...new Set(featureList.map(f => f.category))];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-8 rounded-2xl border border-white/10"
    >
      <div className="flex items-center gap-3 mb-8">
        <Lightning className="w-6 h-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold text-white">Feature Flags</h2>
          <p className="text-white/60">Enable or disable system features globally</p>
        </div>
      </div>

      <div className="space-y-8">
        {categories.map((category) => (
          <div key={category}>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full"></span>
              {category}
            </h3>
            
            <div className="space-y-4">
              {featureList
                .filter(feature => feature.category === category)
                .map((feature) => {
                  const isEnabled = features[feature.key as keyof typeof features];
                  
                  return (
                    <motion.div
                      key={feature.key}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all"
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-medium text-white">{feature.name}</h4>
                          {isEnabled ? (
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full font-bold">
                              ENABLED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full font-bold">
                              DISABLED
                            </span>
                          )}
                        </div>
                        <p className="text-white/60 text-sm">{feature.description}</p>
                      </div>

                      <button
                        onClick={() => handleToggle(feature.key)}
                        className={`relative w-12 h-6 rounded-full transition-all ${
                          isEnabled ? 'bg-emerald-500' : 'bg-white/20'
                        }`}
                      >
                        <motion.div
                          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white flex items-center justify-center transition-all ${
                            isEnabled ? 'left-6' : 'left-0.5'
                          }`}
                          layout
                        >
                          {isEnabled ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <X className="w-3 h-3 text-red-500" />
                          )}
                        </motion.div>
                      </button>
                    </motion.div>
                  );
                })}
            </div>
          </div>
        ))}

        {/* Impact Warning */}
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <div>
              <h4 className="text-amber-400 font-medium mb-1">Important Notice</h4>
              <p className="text-amber-300/80 text-sm">
                Disabling features may affect existing clinics and users. Some features may require system restart to take effect.
                Always test changes in a staging environment first.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white/5 rounded-xl">
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-400">
              {Object.values(features).filter(Boolean).length}
            </p>
            <p className="text-white/60 text-sm">Enabled</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-400">
              {Object.values(features).filter(f => !f).length}
            </p>
            <p className="text-white/60 text-sm">Disabled</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">
              {featureList.length}
            </p>
            <p className="text-white/60 text-sm">Total Features</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-400">
              {categories.length}
            </p>
            <p className="text-white/60 text-sm">Categories</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
