'use client';

import { motion } from 'framer-motion';
import { 
  Gear, 
  Buildings, 
  Bell, 
  Shield, 
  CreditCard, 
  Palette, 
  Globe, 
  CaretRight,
  UploadSimple,
  FloppyDisk,
  CalendarDots,
  SpinnerGap,
  CheckCircle,
  Sparkle,
  TrendUp,
  ListChecks
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { QUOTA_PLANS } from '@/lib/quota/quotaManager';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [clinicData, setClinicData] = useState<any>(null);
  const [activeSection, setActiveSection] = useState('general');
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const sections = [
    { id: 'general', label: 'Clinic Information', icon: Buildings },
    { id: 'appearance', label: 'Brand & Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security & RLS', icon: Shield },
    { id: 'billing', label: 'Subscription & Billing', icon: CreditCard },
    { id: 'loyalty', label: 'Loyalty Program', icon: Sparkle },
    { id: 'i18n', label: 'Translate', icon: Globe },
  ];

  const currentPlan = useMemo(() => {
    return QUOTA_PLANS.find(p => p.id === clinicData?.subscription_tier) || QUOTA_PLANS[0];
  }, [clinicData?.subscription_tier]);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/clinic/settings');
      const result = await res.json();
      if (result.success) {
        setClinicData(result.data);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      const res = await fetch('/api/clinic/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: clinicData.display_name,
          metadata: clinicData.metadata
        })
      });
      const result = await res.json();
      if (result.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    if (planId === clinicData?.subscription_tier) return;
    
    setUpgrading(planId);
    try {
      const res = await fetch('/api/clinic/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      });
      const result = await res.json();
      if (result.success) {
        setClinicData((prev: any) => ({ ...prev, subscription_tier: planId }));
        alert(`Successfully upgraded to ${result.data.plan.name}`);
      }
    } catch (err) {
      console.error('Upgrade error:', err);
    } finally {
      setUpgrading(null);
    }
  };

  const updateClinicField = (field: string, value: any) => {
    setClinicData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const updateMetadataField = (field: string, value: any) => {
    setClinicData((prev: any) => ({
      ...prev,
      metadata: {
        ...(prev.metadata || {}),
        [field]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-6">
        <SpinnerGap className="w-12 h-12 text-primary animate-spin" />
        <p className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Syncing Configuration Cluster...</p>
      </div>
    );
  }

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
            className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]"
          >
            <Gear className="w-4 h-4" />
            Workspace Configuration
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-black text-white uppercase tracking-tight"
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
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-[0.1em] shadow-premium hover:brightness-110 transition-all active:scale-95 text-xs disabled:opacity-50"
        >
          {saving ? <SpinnerGap className="w-4 h-4 animate-spin" /> : (success ? <CheckCircle className="w-4 h-4" /> : <FloppyDisk className="w-4 h-4 stroke-[3px]" />)}
          <span>{saving ? 'Syncing...' : (success ? 'Saved' : 'Commit Changes')}</span>
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
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest border backdrop-blur-md shadow-sm",
                activeSection === section.id 
                  ? "bg-primary/10 text-primary border-primary/30 shadow-[0_0_20px_rgba(var(--primary),0.1)]" 
                  : "bg-white/5 text-muted-foreground border-white/5 hover:bg-white/10 hover:text-white"
              )}
            >
              <section.icon className={cn("w-4 h-4", activeSection === section.id ? "text-primary" : "opacity-60")} />
              <span>{section.label}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-8">
          {activeSection === 'general' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-premium p-10 rounded-[48px] border border-white/10 space-y-10 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity duration-700">
                <Buildings className="w-48 h-48 text-primary" />
              </div>

              <div className="relative z-10 space-y-8">
                <div className="flex flex-col md:flex-row md:items-center gap-8">
                  <div className="relative group/logo flex-shrink-0">
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="w-28 h-24 rounded-[32px] bg-white/5 border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-muted-foreground group-hover/logo:border-primary/50 group-hover/logo:text-primary transition-all cursor-pointer relative overflow-hidden backdrop-blur-md"
                    >
                      <UploadSimple className="w-6 h-6 mb-1.5" />
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
                      value={clinicData.display_name?.th || ''}
                      onChange={(e) => updateClinicField('display_name', { ...clinicData.display_name, th: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-primary/50 transition-all shadow-inner backdrop-blur-md"
                      placeholder="Clinic Name (Thai)"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Registry Code</label>
                    <input 
                      type="text" 
                      value={clinicData.clinic_code || ''}
                      readOnly
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white/40 font-mono focus:outline-none cursor-not-allowed backdrop-blur-sm"
                    />
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Secure Contact Link</label>
                    <input 
                      type="email" 
                      value={clinicData.metadata?.email || ''}
                      onChange={(e) => updateMetadataField('email', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-primary/50 transition-all shadow-inner backdrop-blur-md"
                      placeholder="contact@clinic.com"
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
                  <div 
                    onClick={() => updateClinicField('is_active', !clinicData.is_active)}
                    className={cn(
                      "w-14 h-7 rounded-full relative p-1.5 cursor-pointer shadow-lg transition-colors",
                      clinicData.is_active ? "bg-primary" : "bg-white/10"
                    )}
                  >
                    <motion.div 
                      animate={{ x: clinicData.is_active ? 28 : 0 }}
                      className="w-4 h-4 bg-white rounded-full" 
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'loyalty' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-premium p-10 rounded-[48px] border border-white/10 space-y-10 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity duration-700">
                <Sparkle className="w-48 h-48 text-primary" />
              </div>

              <div className="relative z-10 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20 shadow-premium">
                    <Sparkle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Loyalty <span className="text-primary">Engine</span></h3>
                    <p className="text-sm text-muted-foreground italic font-light">Configuring rewards and customer retention nodes</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1 flex items-center gap-2">
                      <TrendUp className="w-3 h-3" /> Earning Velocity
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/40">1 POINT /</div>
                      <input 
                        type="number" 
                        value={clinicData.metadata?.loyalty?.earn_rate || 100}
                        onChange={(e) => updateMetadataField('loyalty', { ...clinicData.metadata?.loyalty, earn_rate: parseInt(e.target.value) })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-20 pr-6 text-white font-bold focus:outline-none focus:border-primary/50 transition-all shadow-inner backdrop-blur-md"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary">THB</div>
                    </div>
                    <p className="text-[9px] text-muted-foreground italic">Standard: 1 point for every 100 THB spent</p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1 flex items-center gap-2">
                      <CreditCard className="w-3 h-3" /> Redemption Ratio
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/40">1 POINT =</div>
                      <input 
                        type="number" 
                        value={clinicData.metadata?.loyalty?.burn_rate || 1}
                        onChange={(e) => updateMetadataField('loyalty', { ...clinicData.metadata?.loyalty, burn_rate: parseInt(e.target.value) })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-20 pr-6 text-white font-bold focus:outline-none focus:border-primary/50 transition-all shadow-inner backdrop-blur-md"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary">THB</div>
                    </div>
                    <p className="text-[9px] text-muted-foreground italic">Standard: 1 point equals 1 THB discount</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 space-y-6">
                  <div className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-primary/20 transition-all group/toggle">
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-white uppercase tracking-widest">Automatic Point Injection</h4>
                      <p className="text-[10px] text-muted-foreground font-light italic">Authorize POS terminal to automatically award points upon node validation.</p>
                    </div>
                    <div 
                      onClick={() => updateMetadataField('loyalty', { ...clinicData.metadata?.loyalty, auto_award: !clinicData.metadata?.loyalty?.auto_award })}
                      className={cn(
                        "w-14 h-7 rounded-full relative p-1.5 cursor-pointer shadow-lg transition-colors",
                        clinicData.metadata?.loyalty?.auto_award ? "bg-primary" : "bg-white/10"
                      )}
                    >
                      <motion.div 
                        animate={{ x: clinicData.metadata?.loyalty?.auto_award ? 28 : 0 }}
                        className="w-4 h-4 bg-white rounded-full" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'billing' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-10"
            >
              {/* Current Plan Header */}
              <div className="glass-premium p-10 rounded-[48px] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-10 group overflow-hidden relative">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 blur-[60px] rounded-full group-hover:bg-primary/20 transition-all duration-700" />
                
                <div className="space-y-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="px-4 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-primary text-[9px] font-black uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(var(--primary),0.2)]">
                      Active Tier: {currentPlan?.name}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]",
                        clinicData.is_active ? "bg-emerald-400" : "bg-rose-400"
                      )} />
                      <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest">{clinicData.is_active ? 'Status: Nominal' : 'Status: Offline'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">Computational Subscription</h3>
                    <p className="text-sm text-muted-foreground font-light italic leading-relaxed max-w-md">
                      Your node is operating on the <span className="text-primary font-bold">{currentPlan?.name}</span> infrastructure. 
                      Next cycle adjustment scheduled for the start of next month.
                    </p>
                  </div>
                </div>

                <div className="text-right relative z-10">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Monthly Investment</p>
                  <p className="text-4xl font-black text-white tracking-tighter tabular-nums">฿{currentPlan?.monthlyPrice.toLocaleString()}</p>
                </div>
              </div>

              {/* Plan Selection Grid */}
              <div className="space-y-8">
                <div className="flex items-center justify-between px-4">
                  <h3 className="text-xl font-black text-white uppercase tracking-[0.2em]">Scale <span className="text-primary text-glow">Intelligence</span></h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Select Deployment Tier</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {QUOTA_PLANS.map((plan) => {
                    const isCurrent = plan.id === clinicData?.subscription_tier;
                    const isUpgrading = upgrading === plan.id;

                    return (
                      <motion.div
                        key={plan.id}
                        whileHover={{ y: -5 }}
                        className={cn(
                          "p-8 rounded-[40px] border transition-all duration-500 relative overflow-hidden group/plan",
                          isCurrent 
                            ? "bg-primary/10 border-primary/40 shadow-[0_0_30px_rgba(var(--primary),0.1)]" 
                            : "bg-white/5 border-white/10 hover:border-primary/20"
                        )}
                      >
                        {plan.recommended && !isCurrent && (
                          <div className="absolute top-6 right-6">
                            <span className="px-3 py-1 bg-primary/20 border border-primary/30 text-primary text-[8px] font-black uppercase tracking-widest rounded-full">Elite Choice</span>
                          </div>
                        )}

                        <div className="space-y-6 relative z-10">
                          <div>
                            <h4 className="text-lg font-black text-white uppercase tracking-tight group-hover/plan:text-primary transition-colors">{plan.name}</h4>
                            <p className="text-[10px] text-muted-foreground italic font-light mt-1">{plan.description}</p>
                          </div>

                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-white tracking-tighter">฿{plan.monthlyPrice.toLocaleString()}</span>
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">/ cycle</span>
                          </div>

                          <div className="space-y-2.5 pt-4 border-t border-white/5">
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                              <span className="text-white/40">Bandwidth</span>
                              <span className="text-white">{plan.monthlyQuota} Scans</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                              <span className="text-white/40">Overage Rate</span>
                              <span className="text-primary">฿{plan.scanPrice}/u</span>
                            </div>
                          </div>

                          <button
                            disabled={isCurrent || upgrading !== null}
                            onClick={() => handleUpgrade(plan.id)}
                            className={cn(
                              "w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                              isCurrent 
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default" 
                                : "bg-white/5 text-white hover:bg-primary hover:text-primary-foreground shadow-premium"
                            )}
                          >
                            {isUpgrading ? <SpinnerGap className="w-4 h-4 animate-spin" /> : 
                             isCurrent ? <CheckCircle className="w-4 h-4" /> : null}
                            {isCurrent ? 'Active Infrastructure' : 'Deploy Tier'}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

