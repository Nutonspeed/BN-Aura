'use client';

import { motion } from 'framer-motion';
import { 
  Settings, 
  Building2, 
  Bell, 
  Shield, 
  CreditCard, 
  Palette, 
  Globe, 
  ChevronRight,
  Upload,
  Save
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const sections = [
    { id: 'general', label: 'Clinic Information', icon: Building2, active: true },
    { id: 'appearance', label: 'Brand & Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security & RLS', icon: Shield },
    { id: 'billing', label: 'Subscription & Billing', icon: CreditCard },
    { id: 'i18n', label: 'Languages', icon: Globe },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Settings className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-white">Clinic Settings</h1>
            <p className="text-muted-foreground font-light text-sm">Configure your BN-Aura workspace and brand identity.</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold shadow-premium hover:brightness-110 transition-all active:scale-95">
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          {sections.map((section) => (
            <button
              key={section.id}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium",
                section.active 
                  ? "bg-primary/10 text-primary border border-primary/20" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
              )}
            >
              <section.icon className="w-4 h-4" />
              <span>{section.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* General Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 rounded-3xl border border-white/10 space-y-8"
          >
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-2xl bg-white/5 border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-muted-foreground group-hover:border-primary/50 group-hover:text-primary transition-all cursor-pointer">
                    <Upload className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Logo</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">Clinic Logo</h3>
                  <p className="text-xs text-muted-foreground font-light">Recommended size: 512x512px. PNG or SVG.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Clinic Name</label>
                  <input 
                    type="text" 
                    defaultValue="Bangkok Premium Aesthetic"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Clinic Code</label>
                  <input 
                    type="text" 
                    defaultValue="BKK-PREMIUM-01"
                    readOnly
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white/40 focus:outline-none cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Contact Email</label>
                  <input 
                    type="email" 
                    defaultValue="contact@bangkokpremium.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium">Public Status</h4>
                  <p className="text-xs text-muted-foreground font-light">Allow customers to find and book appointments online.</p>
                </div>
                <div className="w-12 h-6 bg-primary rounded-full relative p-1 cursor-pointer">
                  <div className="w-4 h-4 bg-white rounded-full absolute right-1" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Subscription Preview Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-8 rounded-3xl border border-white/10 flex items-center justify-between group overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
              <CreditCard className="w-24 h-24 text-primary" />
            </div>
            
            <div className="space-y-2 relative z-10">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">Professional Plan</span>
                <span className="text-xs text-muted-foreground">Renewal date: Feb 28, 2026</span>
              </div>
              <h3 className="text-xl font-bold text-white">Monthly Subscription</h3>
              <p className="text-sm text-muted-foreground font-light italic">Your clinic is currently on the Pro plan with all AI features enabled.</p>
            </div>

            <button className="relative z-10 flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-white hover:bg-white/10 transition-all">
              <span>Manage Plan</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
