'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { WhiteLabelBranding } from '@/components/branding/WhiteLabelBranding';
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
  ListChecks,
  Monitor,
  ShieldCheck,
  Pulse,
  ArrowsClockwise,
  Icon,
  Crown,
  IdentificationCard,
  EnvelopeSimple
} from '@phosphor-icons/react';
const QUOTA_PLANS = [
  { id: 'starter', name: 'Starter', description: 'Essential AI skin analysis for small clinics', monthlyPrice: 2900, monthlyQuota: 100, scanPrice: 35, recommended: false },
  { id: 'professional', name: 'Professional', description: 'Advanced analysis with priority processing', monthlyPrice: 7900, monthlyQuota: 500, scanPrice: 25, recommended: true },
  { id: 'enterprise', name: 'Enterprise', description: 'Unlimited analysis with dedicated infrastructure', monthlyPrice: 19900, monthlyQuota: 2000, scanPrice: 15, recommended: false },
  { id: 'unlimited', name: 'Unlimited', description: 'Full platform access with custom SLA', monthlyPrice: 49900, monthlyQuota: 10000, scanPrice: 10, recommended: false },
];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [clinicData, setClinicData] = useState<any>(null);
  const [activeSection, setActiveSection] = useState('general');
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const sections = [
    { id: 'general', label: 'ข้อมูลคลินิก', icon: Buildings },
    { id: 'appearance', label: 'แบรนด์และรูปลักษณ์', icon: Palette },
    { id: 'notifications', label: 'การแจ้งเตือน', icon: Bell },
    { id: 'security', label: 'ความปลอดภัย', icon: Shield },
    { id: 'billing', label: 'แพ็กเกจและการชำระเงิน', icon: CreditCard },
    { id: 'loyalty', label: 'โปรแกรมสะสมคะแนน', icon: Sparkle },
    { id: 'i18n', label: 'ภาษา', icon: Globe },
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
        <p className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">กำลังโหลดการตั้งค่า...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto space-y-10 pb-20 font-sans"
    >
      <Breadcrumb />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]"
          >
            <Gear weight="duotone" className="w-4 h-4" />
            ศูนย์กลางการตั้งค่า
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-foreground tracking-tight uppercase"
          >
            Clinic <span className="text-primary">Settings</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            จัดการตั้งค่าคลินิก แบรนด์ และความปลอดภัย
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="gap-3 shadow-premium px-8 py-6 rounded-2xl text-xs font-black uppercase tracking-widest group"
          >
            {saving ? (
              <SpinnerGap weight="bold" className="w-4 h-4 animate-spin" />
            ) : success ? (
              <CheckCircle weight="bold" className="w-4 h-4 text-emerald-400" />
            ) : (
              <FloppyDisk weight="bold" className="w-4 h-4 group-hover:scale-110 transition-transform" />
            )}
            <span>{saving ? 'SYNCHRONIZING...' : success ? 'SETTLED' : 'บันทึกการเปลี่ยนแปลง'}</span>
          </Button>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 px-2">
        {/* Navigation Sidebar Hub */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-1 space-y-3"
        >
          <Card className="border-border/50 shadow-sm p-2 rounded-[32px] bg-secondary/10 backdrop-blur-md">
            <div className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest relative group",
                    activeSection === section.id 
                      ? "bg-primary text-primary-foreground shadow-premium" 
                      : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                  )}
                >
                  <section.icon weight={activeSection === section.id ? "fill" : "duotone"} className={cn("w-4 h-4 transition-transform group-hover:scale-110", activeSection === section.id ? "text-primary-foreground" : "text-primary/60")} />
                  <span>{section.label}</span>
                  {activeSection === section.id && (
                    <motion.div 
                      layoutId="active-nav-glow"
                      className="absolute inset-0 bg-primary/20 blur-xl rounded-2xl z-[-1]"
                    />
                  )}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-6 rounded-[32px] border-primary/10 bg-primary/[0.02] mt-6 group overflow-hidden relative shadow-inner">
            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-primary/5 blur-[50px] rounded-full group-hover:bg-primary/10 transition-all duration-700" />
            <div className="flex items-center gap-3 relative z-10">
              <Sparkle weight="duotone" className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
              <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">ข้อมูลสำคัญ</h4>
            </div>
            <p className="text-[11px] text-muted-foreground italic font-medium leading-relaxed relative z-10 opacity-80 mt-2">
              การตั้งค่าจะมีผลทันทีหลังบันทึก
            </p>
          </Card>
        </motion.div>

        {/* Content Matrix Area */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
            >
              {activeSection === 'general' && (
                <Card className="rounded-[48px] border-border/50 shadow-premium overflow-hidden group">
                  <CardHeader className="p-8 md:p-10 border-b border-border/50 bg-secondary/30 relative">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                      <Buildings weight="fill" className="w-64 h-64 text-primary" />
                    </div>
                    <div className="flex items-center gap-5 relative z-10">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm shadow-inner group-hover:bg-primary/20 transition-all">
                        <Buildings weight="duotone" className="w-7 h-7" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-black uppercase tracking-tight">ข้อมูลคลินิก</CardTitle>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-1">ข้อมูลพื้นฐานคลินิก</p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-8 md:p-12 space-y-10 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center gap-10">
                      <div className="relative group/logo flex-shrink-0">
                        <motion.div 
                          whileHover={{ scale: 1.05 }}
                          className="w-32 h-28 rounded-[40px] bg-secondary/30 border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-all cursor-pointer relative overflow-hidden shadow-inner backdrop-blur-md"
                        >
                          <UploadSimple weight="bold" className="w-7 h-7 mb-2" />
                          <span className="text-[9px] font-black uppercase tracking-[0.2em]">อัพโหลดโลโก้</span>
                        </motion.div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-black text-foreground uppercase tracking-tight">โลโก้คลินิก</h3>
                        <p className="text-sm text-muted-foreground font-medium italic leading-relaxed opacity-80 max-w-sm">
                          ซิงค์โลโก้คลินิก ขนาดแนะนำ 512x512px
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-4">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">ชื่อคลินิก *</label>
                        <div className="relative group/input">
                          <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity rounded-2xl" />
                          <Buildings weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors relative z-10" />
                          <input 
                            type="text" 
                            value={clinicData?.display_name?.th || ''}
                            onChange={(e) => updateClinicField('display_name', { ...clinicData.display_name, th: e.target.value })}
                            className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary outline-none transition-all font-bold shadow-inner relative z-10"
                            placeholder="Clinic Name (THA)"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">รหัสคลินิก</label>
                        <div className="relative group/input">
                          <IdentificationCard weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors relative z-10" />
                          <input 
                            type="text" 
                            value={clinicData?.clinic_code || ''}
                            readOnly
                            className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground/40 focus:outline-none outline-none transition-all font-mono shadow-inner relative z-10 cursor-not-allowed italic"
                          />
                        </div>
                      </div>
                      <div className="space-y-3 md:col-span-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">อีเมลติดต่อ *</label>
                        <div className="relative group/input">
                          <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity rounded-2xl" />
                          <EnvelopeSimple weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors relative z-10" />
                          <input 
                            type="email" 
                            value={clinicData?.metadata?.email || ''}
                            onChange={(e) => updateMetadataField('email', e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary outline-none transition-all font-bold shadow-inner relative z-10"
                            placeholder="contact@clinical.network"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-10 border-t border-border/30">
                      <div className="flex items-center justify-between p-8 bg-secondary/20 rounded-[32px] border border-border/50 group/toggle hover:border-primary/20 transition-all shadow-inner relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover/toggle:scale-110 transition-transform">
                          <Globe weight="fill" className="w-32 h-32 text-primary" />
                        </div>
                        <div className="space-y-1 relative z-10">
                          <h4 className="text-sm font-black text-foreground uppercase tracking-widest">การแสดงผลสาธารณะ</h4>
                          <p className="text-[10px] text-muted-foreground font-medium italic opacity-60">อนุญาตให้แสดงคลินิกในระบบค้นหาและจองออนไลน์</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateClinicField('is_active', !clinicData.is_active)}
                          className={cn(
                            "relative w-14 h-8 rounded-full transition-all duration-500 shadow-inner overflow-hidden z-10",
                            clinicData?.is_active ? "bg-primary shadow-glow-sm" : "bg-card border border-border/50"
                          )}
                        >
                          <motion.div
                            className="absolute top-1 w-6 h-6 rounded-xl bg-white shadow-lg"
                            animate={{ left: clinicData?.is_active ? 28 : 4 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeSection === 'loyalty' && (
                <Card className="rounded-[48px] border-border/50 shadow-premium overflow-hidden group">
                  <CardHeader className="p-8 md:p-10 border-b border-border/50 bg-secondary/30 relative">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                      <Sparkle weight="fill" className="w-64 h-64 text-primary" />
                    </div>
                    <div className="flex items-center gap-5 relative z-10">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm shadow-inner group-hover:bg-primary/20 transition-all">
                        <Sparkle weight="duotone" className="w-7 h-7" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-black uppercase tracking-tight">Loyalty Engine</CardTitle>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-1">Configuring rewards & customer retention nodes</p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-8 md:p-12 space-y-10 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1 flex items-center gap-2">
                          <TrendUp weight="bold" className="w-3.5 h-3.5 text-primary/60" /> Earning Velocity Protocol
                        </label>
                        <div className="relative group/input">
                          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest z-10">1 POINT /</div>
                          <input 
                            type="number" 
                            value={clinicData?.metadata?.loyalty?.earn_rate || 100}
                            onChange={(e) => updateMetadataField('loyalty', { ...clinicData.metadata?.loyalty, earn_rate: parseInt(e.target.value) })}
                            className="w-full pl-24 pr-16 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary outline-none transition-all font-black tabular-nums shadow-inner relative z-10"
                          />
                          <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-primary uppercase tracking-widest z-10">THB</div>
                        </div>
                        <p className="text-[9px] text-muted-foreground italic opacity-60 ml-1 leading-relaxed">System Standard: 1 point for every 100 THB established yield.</p>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1 flex items-center gap-2">
                          <CreditCard weight="bold" className="w-3.5 h-3.5 text-primary/60" /> Redemption Ratio matrix
                        </label>
                        <div className="relative group/input">
                          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest z-10">1 POINT =</div>
                          <input 
                            type="number" 
                            value={clinicData?.metadata?.loyalty?.burn_rate || 1}
                            onChange={(e) => updateMetadataField('loyalty', { ...clinicData.metadata?.loyalty, burn_rate: parseInt(e.target.value) })}
                            className="w-full pl-24 pr-16 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary outline-none transition-all font-black tabular-nums shadow-inner relative z-10"
                          />
                          <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-primary uppercase tracking-widest z-10">THB</div>
                        </div>
                        <p className="text-[9px] text-muted-foreground italic opacity-60 ml-1 leading-relaxed">System Standard: 1 point equals 1 THB commercial discount.</p>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-border/30">
                      <div className="flex items-center justify-between p-8 bg-emerald-500/5 rounded-[32px] border border-emerald-500/10 group/toggle hover:border-emerald-500/20 transition-all shadow-inner">
                        <div className="space-y-1 relative z-10">
                          <h4 className="text-sm font-black text-foreground uppercase tracking-widest">Automatic Point Injection</h4>
                          <p className="text-[10px] text-muted-foreground font-medium italic opacity-60">Authorize POS terminal to automatically award points upon node validation.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateMetadataField('loyalty', { ...clinicData.metadata?.loyalty, auto_award: !clinicData.metadata?.loyalty?.auto_award })}
                          className={cn(
                            "relative w-14 h-8 rounded-full transition-all duration-500 shadow-inner overflow-hidden",
                            clinicData?.metadata?.loyalty?.auto_award ? "bg-emerald-500 shadow-glow-sm" : "bg-card border border-border/50"
                          )}
                        >
                          <motion.div
                            className="absolute top-1 w-6 h-6 rounded-xl bg-white shadow-lg"
                            animate={{ left: clinicData?.metadata?.loyalty?.auto_award ? 28 : 4 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeSection === 'appearance' && (
                <Card className="rounded-[48px] border-border/50 shadow-premium overflow-hidden">
                  <CardHeader className="p-8 md:p-10 border-b border-border/50 bg-secondary/30">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                        <Palette weight="duotone" className="w-7 h-7" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-black uppercase tracking-tight">แบรนด์และรูปลักษณ์</CardTitle>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-1">Visual identity configuration</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 md:p-12">
                    <WhiteLabelBranding clinicId={clinicData?.id || ''} currentTheme={undefined} />
                  </CardContent>
                </Card>
              )}

              {activeSection === 'notifications' && (
                <Card className="rounded-[48px] border-border/50 shadow-premium overflow-hidden">
                  <CardHeader className="p-8 md:p-10 border-b border-border/50 bg-secondary/30">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                        <Bell weight="duotone" className="w-7 h-7" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-black uppercase tracking-tight">Notification Settings</CardTitle>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-1">Alert protocol configuration</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 md:p-12 space-y-6">
                    {[
                      { label: 'Email การแจ้งเตือน', desc: 'Appointment confirmations, reminders & promotions', enabled: true },
                      { label: 'SMS Alerts', desc: 'Critical alerts via SMS gateway', enabled: false },
                      { label: 'Push การแจ้งเตือน', desc: 'Real-time browser push notifications', enabled: true },
                      { label: 'Staff Activity Alerts', desc: 'Notify on staff check-in/check-out events', enabled: true },
                      { label: 'Low Stock Warnings', desc: 'Inventory threshold breach notifications', enabled: false },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-5 bg-secondary/20 rounded-2xl border border-border/50">
                        <div>
                          <p className="text-sm font-bold text-foreground">{item.label}</p>
                          <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                        </div>
                        <div className={cn('w-12 h-7 rounded-full relative cursor-pointer transition-colors', item.enabled ? 'bg-primary' : 'bg-muted')}>
                          <div className={cn('absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all', item.enabled ? 'right-1' : 'left-1')} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {activeSection === 'security' && (
                <Card className="rounded-[48px] border-border/50 shadow-premium overflow-hidden">
                  <CardHeader className="p-8 md:p-10 border-b border-border/50 bg-secondary/30">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                        <Shield weight="duotone" className="w-7 h-7" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-black uppercase tracking-tight">ความปลอดภัย</CardTitle>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-1">Row-level security protocol matrix</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 md:p-12 space-y-6">
                    {[
                      { label: 'Row Level Security', status: 'Active', color: 'emerald' },
                      { label: 'Multi-tenant Isolation', status: 'Enforced', color: 'emerald' },
                      { label: 'Data Encryption (AES-256)', status: 'Active', color: 'emerald' },
                      { label: 'Session Timeout', status: '30 minutes', color: 'blue' },
                      { label: 'Two-Factor Authentication', status: 'Not Configured', color: 'amber' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-5 bg-secondary/20 rounded-2xl border border-border/50">
                        <div className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full ${item.color === "emerald" ? "bg-emerald-500" : item.color === "amber" ? "bg-amber-500" : item.color === "blue" ? "bg-blue-500" : item.color === "red" ? "bg-red-500" : "bg-gray-500"}`} />
                          <p className="text-sm font-bold text-foreground">{item.label}</p>
                        </div>
                        <Badge variant="ghost" className="text-muted-foreground bg-muted/30 text-[9px] font-black uppercase tracking-widest">
                          {item.status}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {activeSection === 'i18n' && (
                <Card className="rounded-[48px] border-border/50 shadow-premium overflow-hidden">
                  <CardHeader className="p-8 md:p-10 border-b border-border/50 bg-secondary/30">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                        <Globe weight="duotone" className="w-7 h-7" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-black uppercase tracking-tight">Internationalization</CardTitle>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-1">Multi-language protocol matrix</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 md:p-12 space-y-6">
                    {[
                      { lang: 'Thai (ภาษาไทย)', code: 'th', status: 'Primary', flag: '🇹🇭' },
                      { lang: 'English', code: 'en', status: 'Active', flag: '🇺🇸' },
                      { lang: 'Chinese (中文)', code: 'zh', status: 'Coming Soon', flag: '🇨🇳' },
                      { lang: 'Japanese (日本語)', code: 'ja', status: 'Coming Soon', flag: '🇯🇵' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-5 bg-secondary/20 rounded-2xl border border-border/50">
                        <div className="flex items-center gap-4">
                          <span className="text-2xl">{item.flag}</span>
                          <div>
                            <p className="text-sm font-bold text-foreground">{item.lang}</p>
                            <p className="text-xs text-muted-foreground">Locale: {item.code}</p>
                          </div>
                        </div>
                        <Badge variant={item.status === 'Primary' ? 'default' : item.status === 'Active' ? 'success' : 'ghost'} className="text-[9px] font-black uppercase tracking-widest">
                          {item.status}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {activeSection === 'billing' && (
                <div className="space-y-10">
                  {/* Current Plan Overview Node */}
                  <Card className="rounded-[48px] border-border/50 shadow-premium overflow-hidden group">
                    <CardContent className="p-10 md:p-12 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                        <Crown weight="fill" className="w-64 h-64 text-primary" />
                      </div>
                      
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 relative z-10">
                        <div className="space-y-8">
                          <div className="flex items-center gap-4">
                            <Badge variant="ghost" className="bg-primary/10 text-primary border-none font-black text-[10px] tracking-[0.2em] px-5 py-2 rounded-full uppercase shadow-sm">
                              ACTIVE_TIER: {currentPlan?.name.toUpperCase()}
                            </Badge>
                            <div className="flex items-center gap-2.5 px-4 py-1.5 bg-emerald-500/5 border border-emerald-500/10 rounded-full">
                              <div className={cn(
                                "w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]",
                                clinicData?.is_active ? "bg-emerald-500" : "bg-rose-500"
                              )} />
                              <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">{clinicData?.is_active ? 'NOMINAL' : 'OFFLINE'}</span>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <h3 className="text-3xl font-black text-foreground uppercase tracking-tight">Computational Subscription</h3>
                            <p className="text-sm text-muted-foreground font-medium italic leading-relaxed max-w-lg opacity-80">
                              Your clinical node is operating on the <span className="text-primary font-black">{currentPlan?.name.toUpperCase()}</span> infrastructure. 
                              Next cycle adjustment established for the temporal reset.
                            </p>
                          </div>
                        </div>

                        <div className="text-right p-8 bg-secondary/30 rounded-[40px] border border-border/50 shadow-inner min-w-[240px]">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 opacity-60">Cycle Investment</p>
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-4xl font-black text-foreground tabular-nums tracking-tighter">฿{currentPlan?.monthlyPrice.toLocaleString()}</span>
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-3">/ Mo</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Plan Deployment Grid */}
                  <div className="space-y-8">
                    <div className="flex items-center justify-between px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(var(--primary),0.6)]" />
                        <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Deployment <span className="text-primary text-glow">Tiers</span></h3>
                      </div>
                      <Badge variant="ghost" className="bg-primary/5 text-primary border-none font-black text-[10px] tracking-widest uppercase px-4 py-1.5 shadow-sm">Scale Optimization Available</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {QUOTA_PLANS.map((plan, i) => {
                        const isCurrent = plan.id === clinicData?.subscription_tier;
                        const isUpgrading = upgrading === plan.id;

                        return (
                          <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                          >
                            <Card className={cn(
                              "h-full p-8 rounded-[48px] border transition-all duration-500 relative overflow-hidden group/plan flex flex-col justify-between shadow-card hover:shadow-premium",
                              isCurrent 
                                ? "border-primary/50 bg-primary/5 shadow-premium" 
                                : "border-border/50 bg-secondary/10 hover:border-primary/30 hover:bg-secondary/20"
                            )}>
                              {plan.recommended && !isCurrent && (
                                <div className="absolute top-8 right-8 z-20">
                                  <Badge variant="default" size="sm" className="font-black text-[8px] tracking-[0.2em] px-4 py-1.5 uppercase shadow-glow-sm">ELITE_CHOICE</Badge>
                                </div>
                              )}

                              <div className="space-y-8 relative z-10">
                                <div className="space-y-1">
                                  <h4 className="text-2xl font-black text-foreground uppercase tracking-tight group-hover/plan:text-primary transition-colors">{plan.name}</h4>
                                  <p className="text-[11px] text-muted-foreground italic font-medium leading-relaxed opacity-80">{plan.description}</p>
                                </div>

                                <div className="flex items-baseline gap-2 pt-2">
                                  <span className="text-4xl font-black text-foreground tabular-nums tracking-tighter">฿{plan.monthlyPrice.toLocaleString()}</span>
                                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">/ cycle</span>
                                </div>

                                <div className="space-y-4 pt-8 border-t border-border/30">
                                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-muted-foreground opacity-60">Neural Bandwidth</span>
                                    <span className="text-foreground">{plan.monthlyQuota} SCAN_NODES</span>
                                  </div>
                                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-muted-foreground opacity-60">Overage Gradient</span>
                                    <span className="text-primary font-bold">฿{plan.scanPrice} / unit</span>
                                  </div>
                                </div>
                              </div>

                              <div className="pt-10 relative z-10">
                                <Button
                                  disabled={isCurrent || upgrading !== null}
                                  onClick={() => handleUpgrade(plan.id)}
                                  className={cn(
                                    "w-full py-7 rounded-[24px] text-[11px] font-black uppercase tracking-[0.3em] shadow-premium gap-3 relative overflow-hidden group/btn",
                                    isCurrent ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 cursor-default shadow-none" : "hover:brightness-110"
                                  )}
                                >
                                  {!isCurrent && <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />}
                                  {isUpgrading ? (
                                    <SpinnerGap weight="bold" className="w-4 h-4 animate-spin" />
                                  ) : isCurrent ? (
                                    <CheckCircle weight="bold" className="w-4 h-4" />
                                  ) : (
                                    <ArrowsClockwise weight="bold" className="w-4 h-4 group-hover/btn:rotate-180 transition-transform duration-500" />
                                  )}
                                  {isCurrent ? 'ACTIVE_INFRASTRUCTURE' : 'DEPLOY TIER'}
                                </Button>
                              </div>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

