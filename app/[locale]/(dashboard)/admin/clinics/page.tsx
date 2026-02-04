'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
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
  WarningCircle
} from '@phosphor-icons/react';

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

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <SpinnerGap className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Buildings className="w-8 h-8 text-primary" />
            {t('title')}
          </h1>
          <p className="text-white/60 mt-1">{t('description')}</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:brightness-110 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('create_clinic')}
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
          <WarningCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto">
            <XCircle className="w-4 h-4 text-red-400" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <p className="text-emerald-400">{success}</p>
          <button onClick={() => setSuccess(null)} className="ml-auto">
            <XCircle className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 rounded-2xl border border-white/10"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Buildings className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{clinics.length}</p>
              <p className="text-white/60 text-sm">{t('total_clinics')}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 rounded-2xl border border-white/10"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/20 rounded-xl">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">
                {clinics.filter(c => c.is_active).length}
              </p>
              <p className="text-white/60 text-sm">{t('active_clinics')}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 rounded-2xl border border-white/10"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">
                {clinics.reduce((sum, c) => sum + (c.staff_count || 0), 0)}
              </p>
              <p className="text-white/60 text-sm">{t('total_staff')}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 rounded-2xl border border-white/10"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/20 rounded-xl">
              <CurrencyDollar className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">
                {clinics.reduce((sum, c) => sum + (c.usage_stats?.revenue || 0), 0).toLocaleString()}
              </p>
              <p className="text-white/60 text-sm">{t('total_revenue')}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="glass-card p-6 rounded-2xl border border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder={t('search_clinics')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          
          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="all">{t('all_tiers')}</option>
            <option value="starter">{t('starter')}</option>
            <option value="professional">{t('professional')}</option>
            <option value="enterprise">{t('enterprise')}</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="all">{t('all_status')}</option>
            <option value="active">{t('active')}</option>
            <option value="inactive">{t('inactive')}</option>
          </select>
        </div>
        
        <p className="text-white/60 text-sm mt-4">
          {t('showing_results', { filtered: filteredClinics.length, total: clinics.length })}
        </p>
      </div>

      {/* Clinics Table */}
      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-white/70 uppercase">{t('clinic')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white/70 uppercase">{t('tier')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white/70 uppercase">{t('staff')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white/70 uppercase">{t('customers')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white/70 uppercase">{t('status')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white/70 uppercase">{t('created')}</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-white/70 uppercase">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredClinics.map((clinic) => (
                <motion.tr key={clinic.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-white/5">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Buildings className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{getClinicName(clinic)}</p>
                        <p className="text-sm text-white/60">{clinic.clinic_code}</p>
                        {clinic.metadata?.contact?.email && (
                          <p className="text-xs text-white/40">{clinic.metadata.contact.email}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getTierBadge(clinic.subscription_tier)}</td>
                  <td className="px-6 py-4 text-white/60">
                    {clinic.staff_count || 0} / {clinic.max_sales_staff}
                  </td>
                  <td className="px-6 py-4 text-white/60">
                    {clinic.customer_count || 0}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      clinic.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {t(clinic.is_active ? 'active' : 'inactive')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white/60">
                    {new Date(clinic.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleViewClinic(clinic)}
                        className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                        title={t('view_details')}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                        title={t('edit_clinic')}
                      >
                        <PencilSimple className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(clinic.id, clinic.is_active)}
                        className={`p-2 rounded-lg transition-all ${
                          clinic.is_active 
                            ? 'text-red-400 hover:bg-red-500/10' 
                            : 'text-emerald-400 hover:bg-emerald-500/10'
                        }`}
                        title={clinic.is_active ? t('deactivate_clinic') : t('activate_clinic')}
                      >
                        {clinic.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clinic Detail Modal */}
      {showDetailModal && selectedClinic && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">{getClinicName(selectedClinic)}</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Overview */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-white/60 text-sm">{t('clinic_code')}</p>
                  <p className="text-white font-medium">{selectedClinic.clinic_code}</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm">{t('subscription_tier')}</p>
                  <div className="mt-1">{getTierBadge(selectedClinic.subscription_tier)}</div>
                </div>
                <div>
                  <p className="text-white/60 text-sm">{t('max_staff')}</p>
                  <p className="text-white font-medium">{selectedClinic.max_sales_staff}</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm">{t('status')}</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    selectedClinic.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {t(selectedClinic.is_active ? 'active' : 'inactive')}
                  </span>
                </div>
              </div>

              {/* Contact Information */}
              {selectedClinic.metadata?.contact && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <EnvelopeSimple className="w-4 h-4" />
                    {t('contact_information')}
                  </h3>
                  <div className="space-y-2">
                    {selectedClinic.metadata.contact.email && (
                      <div className="flex items-center gap-2">
                        <EnvelopeSimple className="w-4 h-4 text-white/40" />
                        <span className="text-white/80">{selectedClinic.metadata.contact.email}</span>
                      </div>
                    )}
                    {selectedClinic.metadata.contact.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-white/40" />
                        <span className="text-white/80">{selectedClinic.metadata.contact.phone}</span>
                      </div>
                    )}
                    {selectedClinic.metadata.contact.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-white/40" />
                        <span className="text-white/80">{selectedClinic.metadata.contact.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Usage Statistics */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Pulse className="w-4 h-4" />
                  {t('usage_statistics')}
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-white/60 text-sm">{t('ai_analyses')}</p>
                    <p className="text-white font-bold text-xl">
                      {selectedClinic.usage_stats?.ai_analyses || 0}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-white/60 text-sm">{t('appointments')}</p>
                    <p className="text-white font-bold text-xl">
                      {selectedClinic.usage_stats?.appointments || 0}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-white/60 text-sm">{t('revenue')}</p>
                    <p className="text-white font-bold text-xl">
                      ฿{selectedClinic.usage_stats?.revenue?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-white/60 text-sm">{t('created_date')}</p>
                  <p className="text-white font-medium">
                    {new Date(selectedClinic.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-white/60 text-sm">{t('updated_date')}</p>
                  <p className="text-white font-medium">
                    {new Date(selectedClinic.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
