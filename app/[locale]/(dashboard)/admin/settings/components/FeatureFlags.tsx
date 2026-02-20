'use client';

import { 
  TrendUp,
  Check,
  X,
  Sparkle,
  Gear,
  ShieldCheck,
  Info,
  CaretDown,
  Pulse,
  ToggleLeft,
  ToggleRight,
  WarningCircle,
  CheckCircle,
  XCircle
} from '@phosphor-icons/react';
import { useSettingsContext } from '../context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
      className="space-y-8"
    >
      <Card className="rounded-[40px] border-border/50 shadow-premium overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
          <TrendUp weight="fill" className="w-64 h-64 text-primary" />
        </div>

        <CardHeader className="p-8 border-b border-border/50 bg-secondary/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
              <TrendUp weight="duotone" className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-black uppercase tracking-tight">ฟีเจอร์ระบบ</CardTitle>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black mt-0.5">เปิดหรือปิดฟีเจอร์ต่างๆ ของระบบ</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8 md:p-10 space-y-12 relative z-10">
          {categories.map((category) => (
            <div key={category} className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
                <h3 className="text-[11px] font-black text-foreground uppercase tracking-[0.3em]">{category}</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {featureList
                  .filter(feature => feature.category === category)
                  .map((feature) => {
                    const isEnabled = features[feature.key as keyof typeof features];
                    
                    return (
                      <motion.div
                        key={feature.key}
                        whileHover={{ y: -2 }}
                        className="p-6 bg-secondary/20 rounded-[32px] border border-border/50 hover:border-primary/30 transition-all flex items-start justify-between gap-6 group/feature"
                      >
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <h4 className="text-sm font-bold text-foreground group-hover/feature:text-primary transition-colors truncate uppercase tracking-tight">{feature.name}</h4>
                            <Badge 
                              variant={isEnabled ? 'success' : 'secondary'} 
                              size="sm" 
                              className="font-black text-[8px] tracking-widest px-2 py-0.5"
                            >
                              {isEnabled ? 'ACTIVE' : 'OFFLINE'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground font-medium italic leading-relaxed opacity-80">
                            {feature.description}
                          </p>
                        </div>

                        <button
                          onClick={() => handleToggle(feature.key)}
                          className={cn(
                            "relative w-14 h-8 rounded-2xl transition-all duration-500 shadow-inner overflow-hidden",
                            isEnabled ? "bg-primary shadow-glow-sm" : "bg-card border border-border/50"
                          )}
                        >
                          <motion.div
                            className={cn(
                              "absolute top-1 w-6 h-6 rounded-xl bg-white shadow-lg flex items-center justify-center transition-all duration-500",
                              isEnabled ? "left-7" : "left-1"
                            )}
                            layout
                          >
                            {isEnabled ? (
                              <Check weight="bold" className="w-3.5 h-3.5 text-primary" />
                            ) : (
                              <X weight="bold" className="w-3.5 h-3.5 text-muted-foreground/40" />
                            )}
                          </motion.div>
                        </button>
                      </motion.div>
                    );
                  })}
              </div>
            </div>
          ))}

          {/* Critical Impact Notification */}
          <div className="p-6 bg-amber-500/5 rounded-[32px] border border-amber-500/10 flex gap-5 relative overflow-hidden group/warning">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover/warning:scale-110 transition-transform">
              <WarningCircle weight="fill" className="w-12 h-12 text-amber-500" />
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-inner shrink-0">
              <Info weight="bold" className="w-6 h-6" />
            </div>
            <div className="space-y-1 relative z-10">
              <h4 className="text-xs font-black text-amber-600 uppercase tracking-widest">Protocol Integrity Notice</h4>
              <p className="text-[11px] text-muted-foreground font-medium leading-relaxed italic">
                Modifying feature flags affects all connected clinical nodes globally. Changes may require immediate synchronization or identity node regeneration to manifest correctly.
              </p>
            </div>
          </div>

          {/* Matrix Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-10 border-t border-border/50">
            {[
              { label: 'Active Nodes', value: Object.values(features).filter(Boolean).length, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'Offline Nodes', value: Object.values(features).filter(f => !f).length, icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
              { label: 'Total Capacity', value: featureList.length, icon: Pulse, color: 'text-primary', bg: 'bg-primary/10' },
              { label: 'Registry Clusters', value: categories.length, icon: Sparkle, color: 'text-purple-500', bg: 'bg-purple-500/10' }
            ].map((stat, i) => (
              <div key={i} className="p-5 bg-secondary/20 rounded-[24px] border border-border/50 flex flex-col items-center text-center gap-3 group/stat hover:bg-secondary/40 transition-all">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-inner group-hover/stat:scale-110 transition-all", stat.bg, stat.color)}>
                  <stat.icon weight="duotone" className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-lg font-black text-foreground tabular-nums">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
