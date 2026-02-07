'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Buildings,
  Upload,
  X,
  EnvelopeSimple,
  Phone,
  Headset,
  IdentificationBadge,
  Sparkle,
  Globe,
  MapPin,
  Camera,
  CloudArrowUp,
  CheckCircle,
  Info,
  Briefcase
} from '@phosphor-icons/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSettingsContext } from '../context';

interface CompanySettingsProps {
  onSettingsChange: (updates: any) => void;
}

export default function CompanySettings({ onSettingsChange }: CompanySettingsProps) {
  const { settings } = useSettingsContext();
  const [formData, setFormData] = useState({
    company_name: '',
    contact_email: '',
    support_email: '',
    contact_phone: '',
    company_logo_url: '',
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        company_name: settings.company_name || '',
        contact_email: settings.contact_email || '',
        support_email: settings.support_email || '',
        contact_phone: settings.contact_phone || '',
        company_logo_url: settings.company_logo_url || '',
      });
    }
  }, [settings]);

  const handleChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onSettingsChange(newData);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, you'd upload to storage and get URL
      const url = URL.createObjectURL(file);
      handleChange('logoUrl', url);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* Core Identity Matrix */}
        <div className="xl:col-span-2 space-y-10">
          <Card className="rounded-[40px] border-border/50 shadow-premium overflow-hidden group">
            <CardHeader className="p-10 border-b border-border/50 bg-secondary/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                <Buildings className="w-64 h-64 text-primary" />
              </div>
              <div className="flex items-center gap-5 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                  <Buildings weight="duotone" className="w-7 h-7" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black uppercase tracking-tight">Organization Node</CardTitle>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-1">Core company metadata registry</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10 space-y-10 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Company Designation</label>
                  <div className="relative group/input">
                    <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity rounded-2xl" />
                    <Buildings weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors relative z-10" />
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => handleChange('company_name', e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold tracking-tight relative z-10"
                      placeholder="e.g. BioCore Aesthetic"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Registration Node</label>
                  <div className="relative group/input">
                    <IdentificationBadge weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors relative z-10" />
                    <input
                      type="text"
                      value={formData.contact_email}
                      onChange={(e) => handleChange('contact_email', e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-mono text-xs relative z-10"
                      placeholder="TAX-ID-XXXX-XXXX"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Neural Mail Domain</label>
                  <div className="relative group/input">
                    <EnvelopeSimple weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors" />
                    <input
                      type="email"
                      value={formData.support_email}
                      onChange={(e) => handleChange('support_email', e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-medium italic"
                      placeholder="ops@biocore.network"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Comm Channel Link</label>
                  <div className="relative group/input">
                    <Phone weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors" />
                    <input
                      type="tel"
                      value={formData.contact_phone}
                      onChange={(e) => handleChange('contact_phone', e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold tabular-nums"
                      placeholder="+66 00-000-0000"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Headquarters Coordinate</label>
                <div className="relative group/input">
                  <MapPin weight="bold" className="absolute left-4 top-4 w-5 h-5 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors" />
                  <textarea
                    value={formData.company_name}
                    onChange={(e) => handleChange('company_name', e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-secondary/30 border border-border rounded-[28px] text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all resize-none font-medium leading-relaxed italic h-32"
                    placeholder="Full physical headquarters coordinate..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[40px] border-border/50 shadow-premium overflow-hidden group">
            <CardHeader className="p-10 border-b border-border/50 bg-secondary/30">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                  <Globe weight="duotone" className="w-7 h-7" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black uppercase tracking-tight">Digital Horizon</CardTitle>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-1">Web presence & social uplink nodes</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Main Uplink URL</label>
                  <div className="relative group/input">
                    <Globe weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors" />
                    <input
                      type="url"
                      value={formData.support_email}
                      onChange={(e) => handleChange('support_email', e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-medium italic"
                      placeholder="https://biocore.network"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Social Matrix Link</label>
                  <div className="relative group/input">
                    <IdentificationBadge weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors" />
                    <input
                      type="text"
                      value={formData.contact_email}
                      onChange={(e) => handleChange('contact_email', e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary transition-all font-medium"
                      placeholder="@biocore_aesthetic"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Branding & Media Sidebar */}
        <div className="space-y-10">
          <Card className="rounded-[40px] border-border/50 shadow-premium overflow-hidden group">
            <CardHeader className="p-8 border-b border-border/50 bg-secondary/30">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                  <Camera weight="duotone" className="w-5 h-5" />
                </div>
                <CardTitle className="text-sm font-black uppercase tracking-tight">Visual Identity</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="flex flex-col items-center gap-6">
                <div className="relative group/logo">
                  <div className="w-40 h-40 rounded-[48px] bg-secondary border-2 border-dashed border-border flex items-center justify-center overflow-hidden transition-all group-hover/logo:border-primary/50 shadow-inner">
                    {formData.company_logo_url ? (
                      <img src={formData.company_logo_url} alt="Logo" className="w-full h-full object-contain p-4" />
                    ) : (
                      <div className="flex flex-col items-center gap-3 opacity-20 group-hover/logo:opacity-40 transition-opacity">
                        <Buildings className="w-12 h-12" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Logo Placeholder</span>
                      </div>
                    )}
                  </div>
                  <button className="absolute -bottom-3 -right-3 w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-premium hover:scale-110 transition-all active:scale-95 border-4 border-card">
                    <CloudArrowUp weight="bold" className="w-5 h-5" />
                    <input
                      type="file"
                      id="logo-upload"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="inline-flex items-center gap-3 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-premium hover:brightness-110 transition-all cursor-pointer active:scale-95"
                    >
                      <Upload weight="bold" className="w-4 h-4" />
                      Upload Identity Asset
                    </label>
                  </button>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-[10px] font-black text-foreground uppercase tracking-widest">Master Asset Node</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest leading-relaxed">SVG, PNG or WebP max 5MB<br/>Preferred resolution 512x512</p>
                </div>
              </div>

              <div className="pt-8 border-t border-border/30 space-y-6">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Cluster Status</span>
                  <Badge variant="success" size="sm" className="font-black text-[8px] uppercase px-3 py-1 tracking-widest shadow-sm">VERIFIED_NODE</Badge>
                </div>
                <div className="p-5 bg-primary/5 rounded-[32px] border border-primary/10 space-y-3 group/brief overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover/brief:scale-110 transition-transform">
                    <Sparkle weight="fill" className="w-16 h-16 text-primary" />
                  </div>
                  <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] relative z-10 flex items-center gap-2">
                    <Info weight="bold" className="w-3 h-3" />
                    Node Protocol
                  </h4>
                  <p className="text-[10px] text-muted-foreground italic font-medium leading-relaxed relative z-10 opacity-80">
                    Company metadata is propagated across all clinical terminal points within this regional administrative sector.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-8 rounded-[40px] border-border shadow-card overflow-hidden group">
            <h4 className="text-[10px] font-black text-foreground uppercase tracking-[0.3em] flex items-center gap-3 mb-6">
              <CheckCircle weight="duotone" className="w-5 h-5 text-primary" />
              Integrity Sync
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-2xl border border-border/50 hover:bg-secondary/50 transition-all">
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Metadata Hash</span>
                <span className="text-[9px] font-mono text-primary font-bold">SHA-256_SYNC</span>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium italic leading-relaxed text-center opacity-60">
                Authorized administrative clearance required for core record modifications.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
