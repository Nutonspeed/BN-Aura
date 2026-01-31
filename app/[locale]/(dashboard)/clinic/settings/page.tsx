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
  Save,
  Calendar
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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto space-y-10 pb-20 font-sans"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-[0.3em]"
          >
            <Settings className="w-4 h-4" />
            Workspace Configuration
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-white uppercase tracking-tight"
          >
            Clinic <span className="text-primary text-glow">Settings</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            Configuring clinical orchestration, brand identity, and security protocols.
          </motion.p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-[0.1em] shadow-premium hover:brightness-110 transition-all active:scale-95 text-xs"
        >
          <Save className="w-4 h-4 stroke-[3px]" />
          <span>Commit Changes</span>
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Navigation Sidebar */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-1 space-y-3"
        >
          {sections.map((section) => (
            <motion.button
              key={section.id}
              whileHover={{ x: 5 }}
              className={cn(
                "w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all text-xs font-black uppercase tracking-widest border backdrop-blur-md shadow-sm",
                section.active 
                  ? "bg-primary/10 text-primary border-primary/30 shadow-[0_0_20px_rgba(var(--primary),0.1)]" 
                  : "bg-white/5 text-muted-foreground border-white/5 hover:bg-white/10 hover:text-white"
              )}
            >
              <section.icon className={cn("w-4 h-4", section.active ? "text-primary" : "opacity-60")} />
              <span>{section.label}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-8">
          {/* General Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-premium p-10 rounded-[48px] border border-white/10 space-y-10 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity duration-700">
              <Building2 className="w-48 h-48 text-primary" />
            </div>

            <div className="relative z-10 space-y-8">
              <div className="flex flex-col md:flex-row md:items-center gap-8">
                <div className="relative group/logo flex-shrink-0">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="w-28 h-24 rounded-[32px] bg-white/5 border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-muted-foreground group-hover/logo:border-primary/50 group-hover/logo:text-primary transition-all cursor-pointer relative overflow-hidden backdrop-blur-md"
                  >
                    <Upload className="w-6 h-6 mb-1.5" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">Upload</span>
                  </motion.div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Identity Node</h3>
                  <p className="text-xs text-muted-foreground font-light italic">Recommended specs: 512x512px. Optimal transparency enabled.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Clinical Designation</label>
                  <input 
                    type="text" 
                    defaultValue="Bangkok Premium Aesthetic"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-primary/50 transition-all shadow-inner backdrop-blur-md"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Registry Code</label>
                  <input 
                    type="text" 
                    defaultValue="BKK-PREMIUM-01"
                    readOnly
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white/40 font-mono focus:outline-none cursor-not-allowed backdrop-blur-sm"
                  />
                </div>
                <div className="space-y-3 md:col-span-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Secure Contact Link</label>
                  <input 
                    type="email" 
                    defaultValue="contact@bangkokpremium.com"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-primary/50 transition-all shadow-inner backdrop-blur-md"
                  />
                </div>
              </div>
            </div>

            <div className="pt-10 border-t border-white/5 space-y-6 relative z-10">
              <div className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5 group/toggle hover:border-primary/20 transition-all">
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-white uppercase tracking-widest">Public Visibility Node</h4>
                  <p className="text-[10px] text-muted-foreground font-light italic">Authorize external discovery and neural booking integration.</p>
                </div>
                <div className="w-14 h-7 bg-primary rounded-full relative p-1.5 cursor-pointer shadow-lg">
                  <motion.div 
                    layout
                    className="w-4 h-4 bg-white rounded-full absolute right-1.5" 
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Subscription Preview Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-premium p-10 rounded-[48px] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-10 group overflow-hidden relative"
          >
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 blur-[60px] rounded-full group-hover:bg-primary/20 transition-all duration-700" />
            
            <div className="space-y-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="px-4 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-primary text-[9px] font-black uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(var(--primary),0.2)]">
                  Intelligence Tier: Professional
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                  <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest">Active Node</span>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Computational Subscription</h3>
                <p className="text-sm text-muted-foreground font-light italic leading-relaxed max-w-md">The cluster is operating at full capacity with priority access to Gemini 2.5 Pro neural engines.</p>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                <Calendar className="w-3.5 h-3.5 text-primary/60" />
                Next Cycle Adjustment: Feb 28, 2026
              </div>
            </div>

            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative z-10 flex items-center justify-center gap-3 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/10 transition-all group/btn"
            >
              <span>Manage Node</span>
              <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
