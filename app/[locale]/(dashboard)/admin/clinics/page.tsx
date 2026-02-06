'use client';

import {
  Buildings,
  MagnifyingGlass,
  Plus,
  Shield,
  EnvelopeSimple,
  Phone,
  MapPin,
  CalendarDots,
  Users,
  CheckCircle,
  XCircle,
  SpinnerGap,
  PencilSimple,
  Eye,
  Gear,
  Pulse,
  CurrencyDollar,
  WarningCircle,
  ArrowLeft,
  TrendUp,
  X,
  Funnel,
  IdentificationCard,
  Briefcase
} from '@phosphor-icons/react';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import Breadcrumb from '@/components/ui/Breadcrumb';
import ResponsiveTable from '@/components/ui/ResponsiveTable';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Clinic {
  id: string;
  clinic_code: string;
  display_name: { th: string; en: string };
  subscription_tier: 'starter' | 'professional' | 'enterprise';
  max_sales_staff: number;
  is_active: boolean;
  owner_user_id?: string;
  created_at: string;
  updated_at: string;
  metadata: {
    contact?: {
      email?: string;
      phone?: string;
      address?: string;
    };
    branding?: {
      logo?: string;
      colors?: {
        primary?: string;
        secondary?: string;
      };
    };
  };
  staff_count?: number;
  customer_count?: number;
  usage_stats?: {
    ai_analyses?: number;
    appointments?: number;
    revenue?: number;
  };
}

export default function ClinicManagementPage() {
  const { goBack } = useBackNavigation();
  const t = useTranslations('admin.clinics');
  const tCommon = useTranslations('common');
  const [loading, setLoading] = useState(true);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchClinics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/management?type=clinics');
      if (!response.ok) throw new Error('Failed to fetch clinics');
      
      const data = await response.json();
      if (data.success) {
        setClinics(data.data.clinics || []);
      } else {
        throw new Error(data.error || 'Failed to load clinics');
      }
    } catch (err) {
      console.error('Error fetching clinics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load clinics');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUpdateStatus = async (clinicId: string, currentStatus: boolean) => {
    try {
      setError(null);
      
      const response = await fetch('/api/admin/management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateClinicStatus',
          clinicId,
          status: !currentStatus
        })
      });

      const data = await response.json();
      if (data.success) {
        setClinics(prev => prev.map(c => 
          c.id === clinicId ? { ...c, is_active: !currentStatus } : c
        ));
        setSuccess(t('status_updated'));
      } else {
        throw new Error(data.error || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating clinic status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleViewClinic = (clinic: Clinic) => {
    setSelectedClinic(clinic);
    setShowDetailModal(true);
  };

  useEffect(() => {
    fetchClinics();
  }, [fetchClinics]);

  const filteredClinics = clinics.filter(clinic => {
    const matchesSearch = 
      clinic.display_name.th?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clinic.display_name.en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clinic.clinic_code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTier = filterTier === 'all' || clinic.subscription_tier === filterTier;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && clinic.is_active) ||
      (filterStatus === 'inactive' && !clinic.is_active);
    
    return matchesSearch && matchesTier && matchesStatus;
  });

  const getTierBadge = (tier: string) => {
    const configs = {
      starter: 'bg-gray-500/20 text-gray-400',
      professional: 'bg-blue-500/20 text-blue-400',
      enterprise: 'bg-purple-500/20 text-purple-400'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold ${configs[tier as keyof typeof configs]}`}>
        {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </span>
    );
  };

  const getClinicName = (clinic: Clinic) => {
    return clinic.display_name.th || clinic.display_name.en || 'Unknown Clinic';
  };

  const columns = [
    {
      header: t('clinic'),
      accessor: (clinic: Clinic) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Buildings className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-foreground truncate">{getClinicName(clinic)}</p>
            <p className="text-[10px] text-muted-foreground truncate">{clinic.clinic_code}</p>
          </div>
        </div>
      )
    },
    {
      header: t('tier'),
      accessor: (clinic: Clinic) => getTierBadge(clinic.subscription_tier)
    },
    {
      header: t('staff'),
      accessor: (clinic: Clinic) => (
        <span className="text-sm text-muted-foreground font-medium">
          {clinic.staff_count || 0} / {clinic.max_sales_staff}
        </span>
      )
    },
    {
      header: t('customers'),
      accessor: (clinic: Clinic) => (
        <span className="text-sm text-muted-foreground font-medium">
          {clinic.customer_count || 0}
        </span>
      )
    },
    {
      header: t('status'),
      accessor: (clinic: Clinic) => (
        <span className={cn(
          "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
          clinic.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
        )}>
          {t(clinic.is_active ? 'active' : 'inactive')}
        </span>
      )
    },
    {
      header: t('created'),
      accessor: (clinic: Clinic) => (
        <span className="text-sm text-muted-foreground">
          {new Date(clinic.created_at).toLocaleDateString()}
        </span>
      )
    },
    {
      header: t('actions'),
      className: 'text-right',
      accessor: (clinic: Clinic) => (
        <div className="flex items-center justify-end gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); handleViewClinic(clinic); }}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-all border border-transparent hover:border-border"
            title={t('view_details')}
          >
            <Eye className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => e.stopPropagation()}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-all border border-transparent hover:border-border"
            title={t('edit_clinic')}
          >
            <PencilSimple className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleUpdateStatus(clinic.id, clinic.is_active); }}
            className={cn(
              "p-2 rounded-lg transition-all border border-transparent hover:border-border bg-secondary",
              clinic.is_active ? 'text-rose-500 hover:bg-rose-500/10' : 'text-emerald-500 hover:bg-emerald-500/10'
            )}
            title={clinic.is_active ? t('deactivate_clinic') : t('activate_clinic')}
          >
            {clinic.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          </button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <SpinnerGap className="w-10 h-10 text-primary animate-spin" />
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
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]"
          >
            <Buildings weight="duotone" className="w-4 h-4" />
            Cluster Management
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-foreground tracking-tight uppercase"
          >
            Clinic <span className="text-primary">Clusters</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            Orchestrating clinical infrastructure nodes and regional data clusters.
          </motion.p>
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="gap-3 shadow-premium px-8 py-6 rounded-2xl text-xs font-black uppercase tracking-widest"
          >
            <Plus weight="bold" className="w-4 h-4" />
            <span>Initialize New Node</span>
          </Button>
        </motion.div>
      </div>

      {/* Stats Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-2">
        <StatCard
          title="Active Nodes"
          value={clinics.filter(c => c.is_active).length}
          icon={Buildings}
          className="p-4"
        />
        <StatCard
          title="Total Personnel"
          value={clinics.reduce((sum, c) => sum + (c.staff_count || 0), 0)}
          icon={Users}
          trend="up"
          change={12}
          className="p-4"
        />
        <StatCard
          title="Network Population"
          value={clinics.reduce((sum, c) => sum + (c.customer_count || 0), 0)}
          icon={Users}
          className="p-4"
        />
        <StatCard
          title="Yield Forecast"
          value={clinics.reduce((sum, c) => sum + (c.usage_stats?.revenue || 0), 0)}
          prefix="฿"
          trend="up"
          change={8.4}
          icon={CurrencyDollar}
          className="p-4"
        />
      </div>

      {/* Alerts */}
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
            <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto p-2 h-auto text-destructive hover:bg-destructive/10">
              <X weight="bold" className="w-4 h-4" />
            </Button>
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
            <Button variant="ghost" size="sm" onClick={() => setSuccess(null)} className="ml-auto p-2 h-auto text-emerald-500 hover:bg-emerald-500/10">
              <X weight="bold" className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Filters */}
      <div className="px-2">
        <Card className="p-6 rounded-[32px] border-border/50 shadow-card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-xl" />
              <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Query cluster identity, node code, or registry..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-2xl py-3.5 pl-12 pr-4 text-sm text-foreground focus:outline-none focus:border-primary transition-all shadow-inner relative z-10"
              />
            </div>
            
            <div className="relative">
              <select
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-2xl py-3.5 px-6 text-sm text-foreground focus:border-primary outline-none transition-all appearance-none font-bold"
              >
                <option value="all">Protocol: ALL TIERS</option>
                <option value="starter">STARTER</option>
                <option value="professional">PROFESSIONAL</option>
                <option value="enterprise">ENTERPRISE</option>
              </select>
              <Funnel weight="bold" className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-2xl py-3.5 px-6 text-sm text-foreground focus:border-primary outline-none transition-all appearance-none font-bold"
              >
                <option value="all">Status: ALL NODES</option>
                <option value="active">OPERATIONAL</option>
                <option value="inactive">OFFLINE</option>
              </select>
              <Pulse weight="bold" className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-6 px-1">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Matrix Synchronization: {filteredClinics.length} of {clinics.length} Clusters Detected
            </p>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Global Sync Active</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Clinics Table */}
      <div className="px-2">
        <Card className="rounded-[40px] border-border/50 overflow-hidden shadow-premium">
          <ResponsiveTable
            columns={columns}
            data={filteredClinics}
            loading={loading}
            rowKey={(c) => c.id}
            emptyMessage="No clinical infrastructure nodes detected in current matrix."
            onRowClick={(c) => window.location.href = `/admin/clinics/${c.id}`}
            mobileCard={(clinic) => (
              <div className="space-y-5">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-secondary border border-border flex items-center justify-center text-primary shadow-inner">
                      <Buildings weight="duotone" className="w-7 h-7" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-foreground truncate uppercase tracking-tight">{getClinicName(clinic)}</p>
                      <p className="text-[10px] font-black text-muted-foreground truncate uppercase tracking-widest">{clinic.clinic_code}</p>
                    </div>
                  </div>
                  <Badge variant="ghost" className="bg-primary/5 text-primary border-none font-black text-[9px] uppercase px-3 py-1">
                    {clinic.subscription_tier}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-6 py-4 border-y border-border/50">
                  <div>
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Personnel</p>
                    <p className="text-xs font-bold text-foreground tabular-nums">{clinic.staff_count || 0} / {clinic.max_sales_staff}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Node Status</p>
                    <Badge variant={clinic.is_active ? 'success' : 'destructive'} size="sm" className="font-black text-[8px] uppercase tracking-widest px-2">
                      {clinic.is_active ? 'OPERATIONAL' : 'OFFLINE'}
                    </Badge>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em]">Node Population</p>
                    <p className="text-xs font-bold text-foreground tabular-nums">{clinic.customer_count || 0} Entities</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => window.location.href = `/admin/clinics/${clinic.id}`} className="h-10 w-10 p-0 border-border/50 rounded-xl hover:bg-secondary">
                      <Eye weight="bold" className="w-4 h-4" />
                    </Button>
                    <Button 
                      onClick={(e) => { e.stopPropagation(); handleUpdateStatus(clinic.id, clinic.is_active); }}
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-10 w-10 p-0 border-border/50 rounded-xl transition-all",
                        clinic.is_active ? 'text-rose-500 hover:bg-rose-500/10' : 'text-emerald-500 hover:bg-emerald-500/10'
                      )}
                    >
                      {clinic.is_active ? <XCircle weight="bold" className="w-4 h-4" /> : <CheckCircle weight="bold" className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          />
        </Card>
      </div>

      {/* Clinic Detail Modal Overhaul - Consider making this a separate component or refining */}
      <AnimatePresence>
        {showDetailModal && selectedClinic && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowDetailModal(false)}
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-card border border-border rounded-[40px] overflow-hidden shadow-premium group p-10"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                <Briefcase className="w-64 h-64 text-primary" />
              </div>

              <div className="relative z-10 space-y-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                      <Buildings weight="duotone" className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground tracking-tight uppercase">{getClinicName(selectedClinic)}</h3>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Identity Node: {selectedClinic.clinic_code}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowDetailModal(false)} className="h-10 w-10 p-0 rounded-xl hover:bg-secondary">
                    <X weight="bold" className="w-5 h-5" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="p-5 bg-secondary/30 rounded-3xl border border-border/50">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Protocol Architecture</p>
                      <Badge variant="ghost" className="bg-primary/10 text-primary border-none font-black text-[10px] uppercase tracking-widest px-3 py-1.5">
                        {selectedClinic.subscription_tier}
                      </Badge>
                    </div>
                    <div className="p-5 bg-secondary/30 rounded-3xl border border-border/50">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Personnel Quota</p>
                      <p className="text-xl font-bold text-foreground tabular-nums">
                        {selectedClinic.staff_count || 0} / {selectedClinic.max_sales_staff}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-5 bg-secondary/30 rounded-3xl border border-border/50">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Operating Status</p>
                      <Badge variant={selectedClinic.is_active ? 'success' : 'destructive'} className="font-black text-[9px] uppercase px-3 py-1 tracking-widest">
                        {selectedClinic.is_active ? 'OPERATIONAL' : 'OFFLINE'}
                      </Badge>
                    </div>
                    <div className="p-5 bg-secondary/30 rounded-3xl border border-border/50">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Network Reach</p>
                      <p className="text-xl font-bold text-foreground tabular-nums">
                        {selectedClinic.customer_count || 0} <span className="text-xs font-medium text-muted-foreground">Entities</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 pt-4 border-t border-border/30">
                  <h4 className="text-[10px] font-black text-foreground uppercase tracking-[0.3em] flex items-center gap-3">
                    <Pulse weight="bold" className="w-4 h-4 text-primary" />
                    Telemetry Analytics
                  </h4>
                  <div className="grid grid-cols-3 gap-6">
                    {[
                      { label: 'AI Scans', value: selectedClinic.usage_stats?.ai_analyses || 0 },
                      { label: 'Cycles', value: selectedClinic.usage_stats?.appointments || 0 },
                      { label: 'Yield', value: `฿${selectedClinic.usage_stats?.revenue?.toLocaleString() || 0}` }
                    ].map((stat) => (
                      <div key={stat.label} className="text-center p-4 bg-secondary/30 rounded-2xl border border-border/50 shadow-inner">
                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className="text-sm font-black text-foreground tabular-nums">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <Button variant="outline" className="flex-1 py-6 rounded-[24px] text-[10px] font-black uppercase tracking-widest border-border/50 hover:bg-secondary">
                    Access Cluster Detail
                  </Button>
                  <Button className="flex-1 py-6 rounded-[24px] text-[10px] font-black uppercase tracking-widest shadow-premium">
                    Establish Connection
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
