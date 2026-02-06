'use client';

import {
  ArrowLeft,
  Buildings,
  Users,
  EnvelopeSimple,
  Phone,
  MapPin,
  Globe,
  CalendarDots,
  CreditCard,
  Target,
  Gear,
  Shield,
  ShieldCheck,
  PencilSimple,
  FloppyDisk,
  X,
  SpinnerGap,
  WarningCircle,
  CheckCircle,
  CurrencyDollar,
  TrendUp,
  Pulse,
  Package,
  CaretRight,
  IdentificationCard,
  Briefcase,
  Lightning,
  Sparkle,
  Archive,
  ArrowSquareOut,
  IdentificationBadge
} from '@phosphor-icons/react';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface ClinicDetail {
  id: string;
  clinic_code: string;
  display_name: { th: string; en: string };
  subscription_tier: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  metadata: {
    contact_email: string;
    contact_phone?: string;
    address?: string;
    business_info?: {
      type: string;
      company_registration?: string;
      tax_id?: string;
      established_year?: string;
      number_of_staff?: string;
      number_of_branches?: string;
      website?: string;
      social_media?: string;
    };
    financial?: {
      monthly_revenue?: string;
      it_budget?: string;
      payment_method?: string;
      payment_term?: string;
    };
    marketing?: {
      lead_source?: string;
      referred_by?: string;
      assigned_sales?: string;
      competitors?: string;
    };
    technical?: {
      current_system?: string;
      integration_needs?: string;
      timeline?: string;
    };
  };
}

interface ClinicStats {
  customerCount: number;
  staffCount: number;
  monthlyScans: number;
  monthlyRevenue: number;
}

export default function ClinicDetailPage() {
  const params = useParams();
  const { goBack } = useBackNavigation();
  const clinicId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [clinic, setClinic] = useState<ClinicDetail | null>(null);
  const [stats, setStats] = useState<ClinicStats>({
    customerCount: 0,
    staffCount: 0,
    monthlyScans: 0,
    monthlyRevenue: 0
  });

  const [editForm, setEditForm] = useState<ClinicDetail | null>(null);

  const fetchClinic = useCallback(async () => {
    try {
      // Use admin API to fetch clinic details
      const response = await fetch(`/api/admin/management?type=clinic&id=${clinicId}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch clinic');
      }
      
      const clinicData = data.data.clinic;
      setClinic(clinicData);
      setEditForm(clinicData);

      // Fetch stats using regular client
      const supabase = createClient();
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      // Customer count
      const { count: customerCount } = await supabase
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .eq('clinic_id', clinicId);

      // Staff count
      const { count: staffCount } = await supabase
        .from('clinic_staff')
        .select('id', { count: 'exact', head: true })
        .eq('clinic_id', clinicId)
        .eq('is_active', true);

      // Monthly scans
      const { count: monthlyScans } = await supabase
        .from('skin_analyses')
        .select('id', { count: 'exact', head: true })
        .eq('clinic_id', clinicId)
        .gte('analyzed_at', thirtyDaysAgo);

      setStats({
        customerCount: customerCount || 0,
        staffCount: staffCount || 0,
        monthlyScans: monthlyScans || 0,
        monthlyRevenue: 0 // TODO: Calculate from payments
      });
    } catch (err) {
      console.error('Error fetching clinic:', err);
      setError('Failed to load clinic details');
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  useEffect(() => {
    fetchClinic();
  }, [fetchClinic]);

  const handleSave = async () => {
    if (!editForm) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      // Use admin API to update clinic
      const response = await fetch('/api/admin/management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateClinic',
          clinicId,
          clinicData: editForm
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update clinic');
      }

      setClinic(editForm);
      setIsEditing(false);
      setSuccess('Clinic updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update clinic');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm(clinic);
    setIsEditing(false);
    setError(null);
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <SpinnerGap className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <p className="text-red-400">Clinic not found</p>
      </div>
    );
  }

  const statsCards = [
    {
      label: 'Total Customers',
      value: stats.customerCount.toLocaleString(),
      icon: Users,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10'
    },
    {
      label: 'Active Staff',
      value: stats.staffCount.toLocaleString(),
      icon: Shield,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      label: 'Monthly AI Scans',
      value: stats.monthlyScans.toLocaleString(),
      icon: Pulse,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10'
    },
    {
      label: 'Subscription',
      value: clinic.subscription_tier.charAt(0).toUpperCase() + clinic.subscription_tier.slice(1),
      icon: Package,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-20 font-sans"
    >
      <Breadcrumb 
        customLabels={{ 
          [clinicId]: clinic?.display_name.th || 'Clinic Node Detail'
        }} 
      />

      {/* Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-6">
          <Button 
            variant="outline"
            onClick={() => goBack('/admin/clinics')}
            className="p-4 h-14 w-14 border-border rounded-2xl text-muted-foreground hover:text-foreground transition-all"
          >
            <ArrowLeft weight="bold" className="w-5 h-5" />
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]">
              <Buildings weight="duotone" className="w-4 h-4" />
              Clinical Infrastructure Node
            </div>
            <h1 className="text-4xl font-bold text-foreground tracking-tight uppercase">
              {clinic.display_name.th}
              <span className="text-primary/40 font-light italic ml-3">({clinic.clinic_code})</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isEditing ? (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="gap-2 px-6 py-6 rounded-2xl text-xs font-black uppercase tracking-widest border-border/50"
              >
                <X weight="bold" className="w-4 h-4" />
                Abort Changes
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="gap-2 px-8 py-6 rounded-2xl text-xs font-black uppercase tracking-widest shadow-premium"
              >
                {saving ? (
                  <SpinnerGap className="w-4 h-4 animate-spin" />
                ) : (
                  <FloppyDisk weight="bold" className="w-4 h-4" />
                )}
                Commit Updates
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              className="gap-2 px-8 py-6 rounded-2xl text-xs font-black uppercase tracking-widest shadow-premium"
            >
              <PencilSimple weight="bold" className="w-4 h-4" />
              Modify Identity
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-2">
        {statsCards.map((stat, i) => (
          <StatCard
            key={stat.label}
            title={stat.label}
            value={stat.value === 'Premium' || stat.value === 'Regular' ? 1 : parseInt(stat.value.replace(/,/g, '')) || 0}
            suffix={stat.value === 'Premium' || stat.value === 'Regular' ? ` ${stat.value}` : ''}
            icon={stat.icon}
            iconColor={stat.color}
            className="p-4"
          />
        ))}
      </div>

      {/* Dynamic Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-2 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center gap-3"
          >
            <WarningCircle weight="fill" className="w-5 h-5 text-destructive" />
            <p className="text-destructive text-xs font-bold uppercase tracking-widest">Exception: {error}</p>
          </motion.div>
        )}
        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3"
          >
            <CheckCircle weight="fill" className="w-5 h-5 text-emerald-500" />
            <p className="text-emerald-500 text-xs font-bold uppercase tracking-widest">Sync Complete: {success}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 px-2">
        {/* Main Intel Column */}
        <div className="lg:col-span-2 space-y-10">
          {/* Identity Matrix */}
          <Card className="rounded-[40px] border-border/50 shadow-premium overflow-hidden group">
            <CardHeader className="p-8 border-b border-border/50 bg-secondary/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                  <IdentificationBadge weight="duotone" className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black uppercase tracking-tight">Identity Matrix</CardTitle>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black mt-0.5">Core node authentication & data</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Identity Node (TH)</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm?.display_name.th}
                        onChange={(e) => setEditForm(f => f ? ({ ...f, display_name: { ...f.display_name, th: e.target.value } }) : null)}
                        className="w-full px-6 py-4 bg-secondary border border-border rounded-2xl text-foreground focus:border-primary outline-none transition-all font-bold"
                      />
                    ) : (
                      <div className="p-4 bg-secondary/30 border border-border/50 rounded-2xl flex items-center gap-3">
                        <span className="text-sm font-bold text-foreground">{clinic.display_name.th}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Identity Node (EN)</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm?.display_name.en}
                        onChange={(e) => setEditForm(f => f ? ({ ...f, display_name: { ...f.display_name, en: e.target.value } }) : null)}
                        className="w-full px-6 py-4 bg-secondary border border-border rounded-2xl text-foreground focus:border-primary outline-none transition-all font-bold"
                      />
                    ) : (
                      <div className="p-4 bg-secondary/30 border border-border/50 rounded-2xl flex items-center gap-3">
                        <span className="text-sm font-bold text-foreground">{clinic.display_name.en}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Transmission Uplink</label>
                    <div className="p-4 bg-secondary/30 border border-border/50 rounded-2xl flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-inner">
                        <EnvelopeSimple weight="bold" className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-bold text-foreground truncate">{clinic.metadata.contact_email}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Comm Channel</label>
                    <div className="p-4 bg-secondary/30 border border-border/50 rounded-2xl flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner">
                        <Phone weight="bold" className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-bold text-foreground">{clinic.metadata.contact_phone || 'NODE_OFFLINE'}</span>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Deployment Coordinate</label>
                  <div className="p-5 bg-secondary/30 border border-border/50 rounded-2xl flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 shadow-inner shrink-0">
                      <MapPin weight="bold" className="w-5 h-5" />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium italic leading-relaxed">
                      {clinic.metadata.address || 'Deployment address coordinates not initialized in current node.'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business & Technical Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Business Intel */}
            <Card className="rounded-[40px] border-border/50 group overflow-hidden">
              <CardHeader className="p-8 border-b border-border/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 border border-purple-500/20 shadow-inner">
                    <Gear weight="duotone" className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-lg font-black uppercase tracking-tight">Business Node</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                {clinic.metadata.business_info ? (
                  <>
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Company Type</span>
                      <Badge variant="ghost" className="bg-primary/5 text-primary border-none font-black text-[9px] uppercase px-3">{clinic.metadata.business_info.type}</Badge>
                    </div>
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Registry Year</span>
                      <span className="text-sm font-bold text-foreground">{clinic.metadata.business_info.established_year || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Network Branches</span>
                      <span className="text-sm font-bold text-foreground">{clinic.metadata.business_info.number_of_branches || '1'} Nodes</span>
                    </div>
                    {clinic.metadata.business_info.website && (
                      <div className="pt-4 border-t border-border/30">
                        <Button variant="outline" className="w-full justify-between rounded-xl px-4 py-3 border-border/50 hover:bg-secondary">
                          <span className="text-[10px] font-black uppercase tracking-widest">Public Domain Node</span>
                          <ArrowSquareOut weight="bold" className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-10 text-center opacity-30 italic text-xs">No business metadata synchronized.</div>
                )}
              </CardContent>
            </Card>

            {/* Technical Parameters */}
            <Card className="rounded-[40px] border-border/50 group overflow-hidden">
              <CardHeader className="p-8 border-b border-border/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-inner">
                    <Lightning weight="duotone" className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-lg font-black uppercase tracking-tight">System Parameters</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                {clinic.metadata.technical ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Architecture</label>
                      <div className="p-3 bg-secondary/30 border border-border/50 rounded-xl text-xs font-bold text-foreground">{clinic.metadata.technical.current_system || 'Vanilla Architecture'}</div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Deployment Pipeline</label>
                      <div className="p-3 bg-secondary/30 border border-border/50 rounded-xl text-xs font-bold text-foreground capitalize">{clinic.metadata.technical.timeline || 'Immediate Sync'}</div>
                    </div>
                  </>
                ) : (
                  <div className="py-10 text-center opacity-30 italic text-xs">No technical telemetry synchronized.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar Intel */}
        <div className="space-y-8">
          {/* Status & Security Cluster */}
          <Card className="p-8 rounded-[40px] border-border shadow-card relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 blur-[60px] rounded-full group-hover:bg-primary/20 transition-all duration-700" />
            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-3 mb-8 relative z-10">
              <Shield weight="duotone" className="w-5 h-5" />
              Security Protocol
            </h4>
            
            <div className="space-y-6 relative z-10">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Node Status</span>
                <Badge variant={clinic.is_active ? 'success' : 'destructive'} className="font-black text-[9px] uppercase px-3 py-1 tracking-widest">
                  {clinic.is_active ? 'OPERATIONAL' : 'OFFLINE'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Node Initialized</span>
                <span className="text-xs font-bold text-foreground tabular-nums">{new Date(clinic.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Last Sync</span>
                <span className="text-xs font-bold text-foreground tabular-nums">{new Date(clinic.updated_at).toLocaleDateString()}</span>
              </div>
              
              <div className="pt-6 border-t border-border/30">
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-start gap-4">
                  <div className="mt-1">
                    <ShieldCheck weight="fill" className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium italic leading-relaxed">
                    Identity access managed via Row Level Security (RLS) cluster alpha.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Control Center */}
          <Card className="p-8 rounded-[40px] border-border shadow-card overflow-hidden group">
            <h4 className="text-[10px] font-black text-foreground uppercase tracking-[0.3em] flex items-center gap-3 mb-6">
              <Briefcase weight="duotone" className="w-5 h-5 text-primary" />
              Control Center
            </h4>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-between rounded-2xl px-5 py-4 border-border/50 hover:bg-secondary group/btn">
                <span className="text-[10px] font-black uppercase tracking-widest">Personnel Matrix</span>
                <CaretRight weight="bold" className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" className="w-full justify-between rounded-2xl px-5 py-4 border-border/50 hover:bg-secondary group/btn">
                <span className="text-[10px] font-black uppercase tracking-widest">Identity Registry</span>
                <CaretRight weight="bold" className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" className="w-full justify-between rounded-2xl px-5 py-4 border-border/50 hover:bg-secondary group/btn">
                <span className="text-[10px] font-black uppercase tracking-widest">Scaling Parameters</span>
                <CaretRight weight="bold" className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" className="w-full justify-between rounded-2xl px-5 py-4 border-border/50 hover:bg-secondary group/btn">
                <span className="text-[10px] font-black uppercase tracking-widest">Ledger Export</span>
                <CaretRight weight="bold" className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
