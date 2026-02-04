'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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
  PencilSimple,
  FloppyDisk,
  X,
  SpinnerGap,
  WarningCircle,
  CheckCircle,
  CurrencyDollar,
  TrendUp,
  Pulse,
  Package
} from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/client';

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
  const router = useRouter();
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
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-3 hover:bg-white/10 rounded-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {clinic.display_name.th}
            </h1>
            <p className="text-white/60 text-sm">
              ID: {clinic.clinic_code}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <SpinnerGap className="w-4 h-4 animate-spin" />
                ) : (
                  <FloppyDisk className="w-4 h-4" />
                )}
                Save Changes
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:brightness-110 transition-all flex items-center gap-2"
            >
              <PencilSimple className="w-4 h-4" />
              Edit Clinic
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 rounded-2xl border border-white/10"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
          <WarningCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <p className="text-emerald-400">{success}</p>
        </div>
      )}

      {/* Clinic Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Basic Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-8 rounded-3xl border border-white/10">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <Buildings className="w-5 h-5 text-primary" />
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-white/60">Clinic Name (Thai)</label>
                {isEditing && editForm ? (
                  <input
                    type="text"
                    value={editForm.display_name.th}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      display_name: { ...editForm.display_name, th: e.target.value }
                    })}
                    className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                  />
                ) : (
                  <p className="text-white mt-1">{clinic.display_name.th}</p>
                )}
              </div>

              <div>
                <label className="text-sm text-white/60">Clinic Name (English)</label>
                {isEditing && editForm ? (
                  <input
                    type="text"
                    value={editForm.display_name.en}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      display_name: { ...editForm.display_name, en: e.target.value }
                    })}
                    className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                  />
                ) : (
                  <p className="text-white mt-1">{clinic.display_name.en}</p>
                )}
              </div>

              <div>
                <label className="text-sm text-white/60">Contact Email</label>
                <p className="text-white mt-1 flex items-center gap-2">
                  <EnvelopeSimple className="w-4 h-4 text-white/40" />
                  {clinic.metadata.contact_email}
                </p>
              </div>

              <div>
                <label className="text-sm text-white/60">Contact Phone</label>
                {clinic.metadata.contact_phone ? (
                  <p className="text-white mt-1 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-white/40" />
                    {clinic.metadata.contact_phone}
                  </p>
                ) : (
                  <p className="text-white/40 mt-1">Not provided</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-white/60">Address</label>
                {clinic.metadata.address ? (
                  <p className="text-white mt-1 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-white/40 mt-0.5" />
                    {clinic.metadata.address}
                  </p>
                ) : (
                  <p className="text-white/40 mt-1">Not provided</p>
                )}
              </div>
            </div>
          </div>

          {/* Business Information */}
          {clinic.metadata.business_info && (
            <div className="glass-card p-8 rounded-3xl border border-white/10">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <Gear className="w-5 h-5 text-primary" />
                Business Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-white/60">Business Type</label>
                  <p className="text-white mt-1 capitalize">
                    {clinic.metadata.business_info.type.replace('_', ' ')}
                  </p>
                </div>

                {clinic.metadata.business_info.established_year && (
                  <div>
                    <label className="text-sm text-white/60">Established Year</label>
                    <p className="text-white mt-1">{clinic.metadata.business_info.established_year}</p>
                  </div>
                )}

                {clinic.metadata.business_info.number_of_staff && (
                  <div>
                    <label className="text-sm text-white/60">Number of Staff</label>
                    <p className="text-white mt-1">{clinic.metadata.business_info.number_of_staff}</p>
                  </div>
                )}

                {clinic.metadata.business_info.number_of_branches && (
                  <div>
                    <label className="text-sm text-white/60">Number of Branches</label>
                    <p className="text-white mt-1">{clinic.metadata.business_info.number_of_branches}</p>
                  </div>
                )}

                {clinic.metadata.business_info.website && (
                  <div className="md:col-span-2">
                    <label className="text-sm text-white/60">Website</label>
                    <p className="text-white mt-1 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-white/40" />
                      <a
                        href={clinic.metadata.business_info.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {clinic.metadata.business_info.website}
                      </a>
                    </p>
                  </div>
                )}

                {clinic.metadata.business_info.social_media && (
                  <div className="md:col-span-2">
                    <label className="text-sm text-white/60">Social Media</label>
                    <p className="text-white mt-1">{clinic.metadata.business_info.social_media}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Financial Information */}
          {clinic.metadata.financial && (
            <div className="glass-card p-8 rounded-3xl border border-white/10">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <CurrencyDollar className="w-5 h-5 text-primary" />
                Financial Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {clinic.metadata.financial.monthly_revenue && (
                  <div>
                    <label className="text-sm text-white/60">Monthly Revenue Range</label>
                    <p className="text-white mt-1">{clinic.metadata.financial.monthly_revenue}</p>
                  </div>
                )}

                {clinic.metadata.financial.it_budget && (
                  <div>
                    <label className="text-sm text-white/60">IT Budget (Yearly)</label>
                    <p className="text-white mt-1">{clinic.metadata.financial.it_budget}</p>
                  </div>
                )}

                {clinic.metadata.financial.payment_method && (
                  <div>
                    <label className="text-sm text-white/60">Payment Method</label>
                    <p className="text-white mt-1 capitalize">
                      {clinic.metadata.financial.payment_method.replace('_', ' ')}
                    </p>
                  </div>
                )}

                {clinic.metadata.financial.payment_term && (
                  <div>
                    <label className="text-sm text-white/60">Payment Term</label>
                    <p className="text-white mt-1 capitalize">{clinic.metadata.financial.payment_term}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Marketing Information */}
          {clinic.metadata.marketing && (
            <div className="glass-card p-8 rounded-3xl border border-white/10">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <Target className="w-5 h-5 text-primary" />
                Marketing Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {clinic.metadata.marketing.lead_source && (
                  <div>
                    <label className="text-sm text-white/60">Lead Source</label>
                    <p className="text-white mt-1 capitalize">
                      {clinic.metadata.marketing.lead_source.replace('_', ' ')}
                    </p>
                  </div>
                )}

                {clinic.metadata.marketing.assigned_sales && (
                  <div>
                    <label className="text-sm text-white/60">Assigned Sales</label>
                    <p className="text-white mt-1">{clinic.metadata.marketing.assigned_sales}</p>
                  </div>
                )}

                {clinic.metadata.marketing.referred_by && (
                  <div className="md:col-span-2">
                    <label className="text-sm text-white/60">Referred By</label>
                    <p className="text-white mt-1">{clinic.metadata.marketing.referred_by}</p>
                  </div>
                )}

                {clinic.metadata.marketing.competitors && (
                  <div className="md:col-span-2">
                    <label className="text-sm text-white/60">Competitors</label>
                    <p className="text-white mt-1">{clinic.metadata.marketing.competitors}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Technical Information */}
          {clinic.metadata.technical && (
            <div className="glass-card p-8 rounded-3xl border border-white/10">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <Gear className="w-5 h-5 text-primary" />
                Technical Information
              </h2>

              <div className="space-y-4">
                {clinic.metadata.technical.current_system && (
                  <div>
                    <label className="text-sm text-white/60">Current System</label>
                    <p className="text-white mt-1">{clinic.metadata.technical.current_system}</p>
                  </div>
                )}

                {clinic.metadata.technical.integration_needs && (
                  <div>
                    <label className="text-sm text-white/60">Integration Needs</label>
                    <p className="text-white mt-1">{clinic.metadata.technical.integration_needs}</p>
                  </div>
                )}

                {clinic.metadata.technical.timeline && (
                  <div>
                    <label className="text-sm text-white/60">Implementation Timeline</label>
                    <p className="text-white mt-1 capitalize">
                      {clinic.metadata.technical.timeline.replace('_', ' ')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="glass-card p-6 rounded-2xl border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4">Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/60">Clinic Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  clinic.is_active 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {clinic.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Created</span>
                <span className="text-white text-sm">
                  {new Date(clinic.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Last Updated</span>
                <span className="text-white text-sm">
                  {new Date(clinic.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-card p-6 rounded-2xl border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full py-2 px-4 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-all text-sm">
                View All Staff
              </button>
              <button className="w-full py-2 px-4 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-all text-sm">
                View All Customers
              </button>
              <button className="w-full py-2 px-4 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-all text-sm">
                Change Subscription Plan
              </button>
              <button className="w-full py-2 px-4 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-all text-sm">
                Export Clinic Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
