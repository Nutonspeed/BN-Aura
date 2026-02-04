'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Buildings, 
  Users, 
  Pulse, 
  ShieldCheck, 
  Gear, 
  Lightning, 
  Globe, 
  MagnifyingGlass,
  Plus,
  SpinnerGap,
  CaretRight,
  WarningCircle,
  X,
  EnvelopeSimple,
  Phone,
  MapPin,
  Shield
} from '@phosphor-icons/react';

interface Clinic {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'pending';
  plan: string;
  customerCount: number;
  staffCount: number;
  createdAt: string;
}

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [globalStats, setGlobalStats] = useState({
    totalClinics: 0,
    globalCustomers: 0,
    monthlyAILoad: 0,
    activeSessions: 0
  });
  const [systemStatus, setSystemHealth] = useState<Record<string, string>>({
    database: 'Checking...',
    storage: 'Checking...',
    ai_gateway: 'Checking...',
    auth_service: 'Checking...'
  });
  
  // Register Clinic Modal State
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerStep, setRegisterStep] = useState(1); // Multi-step wizard
  const [newClinic, setNewClinic] = useState({
    // Basic Info
    name: '',
    email: '',
    phone: '',
    address: '',
    plan: 'starter',
    
    // Business Info
    businessType: 'clinic', // clinic, hospital, spa
    companyRegistration: '',
    taxId: '',
    establishedYear: '',
    numberOfStaff: '',
    numberOfBranches: '1',
    website: '',
    socialMedia: '',
    
    // Financial Info
    monthlyRevenue: '',
    itBudget: '',
    paymentMethod: 'bank_transfer',
    paymentTerm: 'monthly',
    
    // Marketing Info
    leadSource: '',
    referredBy: '',
    assignedSales: '',
    competitors: '',
    
    // Technical Info
    currentSystem: '',
    integrationNeeds: '',
    timeline: 'normal'
  });

  // Create User Modal State
  const [showUserModal, setShowUserModal] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    email: '',
    fullName: '',
    clinicId: '',
    role: 'clinic_owner'
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Import APIClient
      const { apiClient } = await import('@/lib/api/client');
      
      // 1. Fetch clinics
      const resClinics = await apiClient.get('/admin/management?type=clinics');
      if (resClinics.success && resClinics.data) {
        setClinics((resClinics.data as any).clinics || []);
      }

      // 2. Fetch health
      const resHealth = await apiClient.get('/admin/management?type=system_health');
      if (resHealth.success && resHealth.data) {
        setSystemHealth((resHealth.data as any).health || {});
      }

      // 3. Fetch stats
      const resStats = await apiClient.get('/admin/management?type=stats');
      if (resStats.success && resStats.data) {
        const d = resStats.data as any;
        setGlobalStats({
          totalClinics: d.totalClinics || 0,
          globalCustomers: d.globalCustomers || 0,
          monthlyAILoad: d.monthlyAILoad || 0,
          activeSessions: d.activeStaff || 0 // Using active staff as a proxy for activity
        });
      }
    } catch (err) {
      console.error('Super Admin Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateStatus = async (clinicId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const { apiClient } = await import('@/lib/api/client');
      const res = await apiClient.post('/admin/management', {
        action: 'updateStatus',
        clinicId,
        status: newStatus
      });
      
      if (res.success) {
        setClinics(prev => prev.map(c => c.id === clinicId ? { ...c, status: newStatus as any } : c));
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);
    setUserError(null);

    try {
      const { apiClient } = await import('@/lib/api/client');
      const res = await apiClient.post('/admin/management', {
        action: 'createUser',
        ...newUser,
        password: 'BNAura2024!' // Default password
      });
      
      if (res.success) {
        // Reset form and close modal
        setNewUser({ email: '', fullName: '', clinicId: '', role: 'clinic_owner' });
        setShowUserModal(false);
        // Refresh data
        fetchData();
      } else {
        setUserError(res.error?.message || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setUserError('Failed to create user');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleRegisterClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only submit on final step
    if (registerStep < 4) {
      setRegisterStep(prev => prev + 1);
      return;
    }
    
    setRegistering(true);
    setRegisterError(null);

    try {
      // Import APIClient
      const { apiClient } = await import('@/lib/api/client');
      
      // Prepare metadata with all additional fields
      const metadata = {
        contact_email: newClinic.email,
        contact_phone: newClinic.phone,
        address: newClinic.address,
        
        business_info: {
          type: newClinic.businessType,
          company_registration: newClinic.companyRegistration,
          tax_id: newClinic.taxId,
          established_year: newClinic.establishedYear,
          number_of_staff: newClinic.numberOfStaff,
          number_of_branches: newClinic.numberOfBranches,
          website: newClinic.website,
          social_media: newClinic.socialMedia
        },
        
        financial: {
          monthly_revenue: newClinic.monthlyRevenue,
          it_budget: newClinic.itBudget,
          payment_method: newClinic.paymentMethod,
          payment_term: newClinic.paymentTerm
        },
        
        marketing: {
          lead_source: newClinic.leadSource,
          referred_by: newClinic.referredBy,
          assigned_sales: newClinic.assignedSales,
          competitors: newClinic.competitors
        },
        
        technical: {
          current_system: newClinic.currentSystem,
          integration_needs: newClinic.integrationNeeds,
          timeline: newClinic.timeline
        }
      };

      const response = await apiClient.post('/admin/management', {
        action: 'createClinic',
        name: newClinic.name,
        email: newClinic.email,
        phone: newClinic.phone,
        address: newClinic.address,
        plan: newClinic.plan,
        metadata // Send all comprehensive data
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to register clinic');
      }

      // Reset form and step
      setRegisterStep(1);
      setNewClinic({
        name: '',
        email: '',
        phone: '',
        address: '',
        plan: 'starter',
        businessType: 'clinic',
        companyRegistration: '',
        taxId: '',
        establishedYear: '',
        numberOfStaff: '',
        numberOfBranches: '1',
        website: '',
        socialMedia: '',
        monthlyRevenue: '',
        itBudget: '',
        paymentMethod: 'bank_transfer',
        paymentTerm: 'monthly',
        leadSource: '',
        referredBy: '',
        assignedSales: '',
        competitors: '',
        currentSystem: '',
        integrationNeeds: '',
        timeline: 'normal'
      });
      
      setShowRegisterModal(false);
      
      // Refresh data
      await fetchData();
    } catch (error) {
      setRegisterError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse text-xs uppercase tracking-widest text-center">
          Accessing Global Control Node...
        </p>
      </div>
    );
  }

  const stats = [
    { label: 'Total Clinics', value: globalStats.totalClinics.toString(), icon: Building2, color: 'text-primary' },
    { label: 'Global Customers', value: globalStats.globalCustomers.toLocaleString(), icon: Users, color: 'text-emerald-400' },
    { label: 'Monthly AI Load', value: `${(globalStats.monthlyAILoad / 1000).toFixed(1)}k`, icon: Zap, color: 'text-amber-400' },
    { label: 'Active Personnel', value: globalStats.activeSessions.toLocaleString(), icon: Activity, color: 'text-rose-400' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10 pb-20"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-rose-500 text-xs font-black uppercase tracking-[0.3em]"
          >
            <ShieldCheck className="w-4 h-4" />
            System Authority Node
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-white uppercase tracking-tight"
          >
            Super Admin <span className="text-primary text-glow">Console</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            Global orchestration and multi-tenant performance oversight.
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex gap-3"
        >
          <button 
            onClick={() => router.push('/th/admin/network-map')}
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white hover:bg-white/10 transition-all active:scale-95 flex items-center gap-2"
          >
            <Globe className="w-4 h-4 text-primary" />
            Network Map
          </button>
          <button 
            onClick={() => setShowRegisterModal(true)}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-bold shadow-premium hover:brightness-110 transition-all active:scale-95 flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3px]" />
            Register New Clinic
          </button>
          <button 
            onClick={() => setShowUserModal(true)}
            className="px-6 py-3 bg-green-600 text-white rounded-2xl text-sm font-bold shadow-premium hover:brightness-110 transition-all active:scale-95 flex items-center gap-2"
          >
            <Users className="w-4 h-4 stroke-[3px]" />
            Create Clinic Owner
          </button>
        </motion.div>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            whileHover={{ y: -5 }}
            className="glass-card p-6 rounded-3xl border border-white/5 relative overflow-hidden group"
          >
            <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-125 transition-all duration-500">
              <stat.icon className="w-16 h-16 text-primary" />
            </div>
            <div className="space-y-2 relative z-10">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
              <p className="text-3xl font-black text-white tracking-tighter">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Clinic Management */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card p-8 rounded-[40px] border border-white/10 space-y-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
              <Building2 className="w-48 h-48 text-primary" />
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <h3 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20 shadow-premium">
                  <Building2 className="w-6 h-6" />
                </div>
                Global Clinic Registry
              </h3>
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-xl" />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search clinics..." 
                  className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all w-full md:w-72 backdrop-blur-md relative z-10 shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-4 relative z-10">
              {clinics.map((clinic, idx) => (
                <motion.div
                  key={clinic.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + idx * 0.05 }}
                  className="p-6 bg-white/5 rounded-[32px] border border-white/5 hover:border-primary/30 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/[0.08]"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-white border border-white/5 group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20 transition-all duration-500 shadow-sm">
                      <Building2 className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-lg font-black text-white group-hover:text-primary transition-colors tracking-tight">{clinic.name}</h4>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] text-primary font-black uppercase tracking-widest">{clinic.plan}</span>
                        <div className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="text-[10px] text-muted-foreground font-medium italic">
                          ID: {clinic.id.slice(0,8)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 md:gap-10">
                    <div className="text-center min-w-[60px]">
                      <p className="text-lg font-black text-white">{clinic.customerCount}</p>
                      <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Users</p>
                    </div>
                    <div className="text-center min-w-[60px]">
                      <p className="text-lg font-black text-white">{clinic.staffCount}</p>
                      <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Staff</p>
                    </div>
                    <button 
                      onClick={() => handleUpdateStatus(clinic.id, clinic.status)}
                      className={cn(
                        "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] transition-all border",
                        clinic.status === 'active' 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20" 
                          : "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
                      )}
                    >
                      {clinic.status}
                    </button>
                    <button 
                      onClick={() => router.push(`/th/admin/clinics/${clinic.id}`)}
                      className="p-3 hover:bg-white/10 rounded-2xl transition-all border border-transparent hover:border-white/10 shadow-sm"
                    >
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            <button className="w-full py-5 bg-white/5 border border-white/10 rounded-[28px] text-[10px] font-black uppercase tracking-[0.3em] text-white hover:bg-white/10 transition-all active:scale-95 shadow-sm">
              Load Additional Clinic Nodes
            </button>
          </motion.div>
        </div>

        {/* Right: System Health & Maintenance */}
        <div className="space-y-8">
          {/* System Health */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="glass-card p-8 rounded-[40px] border border-white/10 space-y-8 relative overflow-hidden"
          >
            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-emerald-500/5 blur-[50px] rounded-full" />
            
            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3 relative z-10">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.6)]" />
              Infrastructure Health
            </h3>
            
            <div className="space-y-4 relative z-10">
              {Object.entries(systemStatus).map(([node, status]) => (
                <div key={node} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center group hover:bg-white/[0.08] transition-all">
                  <span className="text-[11px] text-muted-foreground font-black uppercase tracking-widest">
                    {node.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">{status}</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-5 bg-primary/5 rounded-[32px] border border-primary/10 flex gap-4 relative z-10 backdrop-blur-md">
              <AlertCircle className="w-6 h-6 text-primary flex-shrink-0" />
              <p className="text-[11px] text-muted-foreground font-light leading-relaxed">
                <span className="text-primary font-black uppercase tracking-tighter mr-1.5">Node Alert:</span>
                Higher than average latency detected in Asia-Pacific vision processing clusters. Optimization required.
              </p>
            </div>
          </motion.div>

          {/* Maintenance Tools */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="glass-card p-8 rounded-[40px] border border-white/10 space-y-8 relative overflow-hidden"
          >
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-primary/5 blur-[50px] rounded-full" />
            
            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3 relative z-10">
              <Settings className="w-4 h-4 text-primary" />
              Global Operations
            </h3>
            
            <div className="grid grid-cols-1 gap-4 relative z-10">
              {[
                { title: "Database Backup", sub: "Last: 4h ago", icon: ShieldCheck },
                { title: "Clear Global Cache", sub: "Redis & AI Gateway", icon: Zap },
                { title: "API Keys Audit", sub: "3 keys expiring", icon: Activity }
              ].map((tool, i) => (
                <button key={i} className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 hover:border-white/10 transition-all text-left group">
                  <div className="space-y-1">
                    <p className="text-xs font-black text-white uppercase tracking-widest group-hover:text-primary transition-colors">{tool.title}</p>
                    <p className="text-[9px] text-muted-foreground italic font-medium">{tool.sub}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Create User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur border border-white/10 rounded-3xl w-full max-w-md max-h-[90vh] overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Users className="w-6 h-6 text-green-400" />
                  Create Clinic Owner
                </h2>
                <button 
                  onClick={() => setShowUserModal(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-white/50" />
                </button>
              </div>
              
              {userError && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <span className="text-red-300 text-sm">{userError}</span>
                </div>
              )}

              <form onSubmit={handleCreateUser} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">อีเมล *</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3 w-4 h-4 text-white/30" />
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="owner@clinic.com (ใช้ 10-minute email)"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-green-400/50 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">ชื่อ-นามสกุล *</label>
                  <input
                    type="text"
                    value={newUser.fullName}
                    onChange={(e) => setNewUser(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="เช่น นาย สมชาย ใจดี"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-green-400/50 transition-all"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">คลินิก *</label>
                  <select
                    value={newUser.clinicId}
                    onChange={(e) => setNewUser(prev => ({ ...prev, clinicId: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-green-400/50 transition-all"
                    required
                  >
                    <option value="" className="bg-slate-800">-- เลือกคลินิก --</option>
                    {clinics.map(clinic => (
                      <option key={clinic.id} value={clinic.id} className="bg-slate-800">
                        {clinic.name} ({clinic.plan})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">บทบาท *</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-green-400/50 transition-all"
                    required
                  >
                    <option value="clinic_owner" className="bg-slate-800">Clinic Owner</option>
                    <option value="clinic_admin" className="bg-slate-800">Clinic Admin</option>
                    <option value="sales_staff" className="bg-slate-800">Sales Staff</option>
                  </select>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-blue-300 font-medium">รหัสผ่านเริ่มต้น</p>
                      <p className="text-blue-200/80 mt-1">BNAura2024!</p>
                      <p className="text-blue-200/60 text-xs mt-1">ผู้ใช้สามารถเปลี่ยนรหัสผ่านได้หลังจากล็อกอินครั้งแรก</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowUserModal(false)}
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={creatingUser}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-bold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {creatingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                    สร้าง User
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Register Clinic Modal */}
      <AnimatePresence>
        {showRegisterModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowRegisterModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg glass-card p-8 rounded-3xl border border-white/10 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Building2 className="w-6 h-6 text-primary" />
                  Register New Clinic
                </h2>
                <button 
                  onClick={() => setShowRegisterModal(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-all"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {registerError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <p className="text-sm text-red-400">{registerError}</p>
                </div>
              )}

              {/* Progress Steps */}
              <div className="flex items-center justify-center mb-6">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      registerStep >= step 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-white/10 text-white/50'
                    }`}>
                      {step}
                    </div>
                    {step < 4 && (
                      <div className={`w-12 h-0.5 ${
                        registerStep > step ? 'bg-primary' : 'bg-white/10'
                      }`} />
                    )}
                  </div>
                ))}
              </div>

              <form onSubmit={handleRegisterClinic} className="space-y-4">
                {/* Step 1: Basic Information */}
                {registerStep === 1 && (
                  <>
                    <h3 className="text-lg font-bold text-white mb-4">ข้อมูลพื้นฐาน</h3>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/70">ชื่อคลินิก *</label>
                      <input
                        type="text"
                        value={newClinic.name}
                        onChange={(e) => setNewClinic(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="เช่น BN Beauty Clinic"
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70">อีเมล *</label>
                        <input
                          type="email"
                          value={newClinic.email}
                          onChange={(e) => setNewClinic(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="clinic@example.com"
                          required
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70">เบอร์โทร</label>
                        <input
                          type="tel"
                          value={newClinic.phone}
                          onChange={(e) => setNewClinic(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="081-234-5678"
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70">แพ็กเกจ *</label>
                        <select
                          value={newClinic.plan}
                          onChange={(e) => setNewClinic(prev => ({ ...prev, plan: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        >
                          <option value="starter" className="bg-slate-800">Starter (฿2,900/เดือน)</option>
                          <option value="professional" className="bg-slate-800">Professional (฿4,900/เดือน)</option>
                          <option value="premium" className="bg-slate-800">Premium (฿7,900/เดือน)</option>
                          <option value="enterprise" className="bg-slate-800">Enterprise (฿12,900/เดือน)</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70">ประเภทธุรกิจ *</label>
                        <select
                          value={newClinic.businessType}
                          onChange={(e) => setNewClinic(prev => ({ ...prev, businessType: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        >
                          <option value="clinic" className="bg-slate-800">คลินิกเสริมความงาม</option>
                          <option value="hospital" className="bg-slate-800">โรงพยาบาลเสริมความงาม</option>
                          <option value="spa" className="bg-slate-800">สปาและเวลเนส</option>
                          <option value="aesthetic_center" className="bg-slate-800">ศูนย์ความงามครบวงจร</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/70">ที่อยู่</label>
                      <textarea
                        value={newClinic.address}
                        onChange={(e) => setNewClinic(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="123 ถนนสุขุมวิท แขวงคลองตัน เขตคลองตัน กรุงเทพฯ 10110"
                        rows={2}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                      />
                    </div>
                  </>
                )}

                {/* Step 2: Business Information */}
                {registerStep === 2 && (
                  <>
                    <h3 className="text-lg font-bold text-white mb-4">ข้อมูลธุรกิจ <span className="text-sm font-normal text-white/50">(สามารถข้ามได้)</span></h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70">เลขทะเบียนบริษัท</label>
                        <input
                          type="text"
                          value={newClinic.companyRegistration}
                          onChange={(e) => setNewClinic(prev => ({ ...prev, companyRegistration: e.target.value }))}
                          placeholder="0105563123456"
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70">เลขประจำตัวผู้เสียภาษี</label>
                        <input
                          type="text"
                          value={newClinic.taxId}
                          onChange={(e) => setNewClinic(prev => ({ ...prev, taxId: e.target.value }))}
                          placeholder="0105563123456"
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70">ปีที่เริ่มดำเนินการ</label>
                        <input
                          type="number"
                          value={newClinic.establishedYear}
                          onChange={(e) => setNewClinic(prev => ({ ...prev, establishedYear: e.target.value }))}
                          placeholder="2020"
                          min="1990"
                          max={new Date().getFullYear()}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70">จำนวนพนักงาน</label>
                        <select
                          value={newClinic.numberOfStaff}
                          onChange={(e) => setNewClinic(prev => ({ ...prev, numberOfStaff: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        >
                          <option value="" className="bg-slate-800">-- เลือก --</option>
                          <option value="1-5" className="bg-slate-800">1-5 คน</option>
                          <option value="6-10" className="bg-slate-800">6-10 คน</option>
                          <option value="11-20" className="bg-slate-800">11-20 คน</option>
                          <option value="21-50" className="bg-slate-800">21-50 คน</option>
                          <option value="50+" className="bg-slate-800">50+ คน</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70">จำนวนสาขา</label>
                        <input
                          type="number"
                          value={newClinic.numberOfBranches}
                          onChange={(e) => setNewClinic(prev => ({ ...prev, numberOfBranches: e.target.value }))}
                          placeholder="1"
                          min="1"
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/70">เว็บไซต์</label>
                      <input
                        type="url"
                        value={newClinic.website}
                        onChange={(e) => setNewClinic(prev => ({ ...prev, website: e.target.value }))}
                        placeholder="https://bnclinic.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/70">โซเชียลมีเดีย</label>
                      <input
                        type="text"
                        value={newClinic.socialMedia}
                        onChange={(e) => setNewClinic(prev => ({ ...prev, socialMedia: e.target.value }))}
                        placeholder="@bnclinic, https://facebook.com/bnclinic"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      />
                    </div>
                  </>
                )}

                {/* Step 3: Financial & Marketing */}
                {registerStep === 3 && (
                  <>
                    <h3 className="text-lg font-bold text-white mb-4">ข้อมูลการเงินและการตลาด <span className="text-sm font-normal text-white/50">(สามารถข้ามได้)</span></h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70">รายได้ต่อเดือน</label>
                        <select
                          value={newClinic.monthlyRevenue}
                          onChange={(e) => setNewClinic(prev => ({ ...prev, monthlyRevenue: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        >
                          <option value="" className="bg-slate-800">-- เลือก --</option>
                          <option value="<100k" className="bg-slate-800">น้อยกว่า 100,000 บาท</option>
                          <option value="100k-300k" className="bg-slate-800">100,000 - 300,000 บาท</option>
                          <option value="300k-500k" className="bg-slate-800">300,000 - 500,000 บาท</option>
                          <option value="500k-1m" className="bg-slate-800">500,000 - 1,000,000 บาท</option>
                          <option value="1m-3m" className="bg-slate-800">1,000,000 - 3,000,000 บาท</option>
                          <option value=">3m" className="bg-slate-800">มากกว่า 3,000,000 บาท</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70">งบประมาณ IT ต่อปี</label>
                        <select
                          value={newClinic.itBudget}
                          onChange={(e) => setNewClinic(prev => ({ ...prev, itBudget: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        >
                          <option value="" className="bg-slate-800">-- เลือก --</option>
                          <option value="<50k" className="bg-slate-800">น้อยกว่า 50,000 บาท</option>
                          <option value="50k-100k" className="bg-slate-800">50,000 - 100,000 บาท</option>
                          <option value="100k-300k" className="bg-slate-800">100,000 - 300,000 บาท</option>
                          <option value="300k-500k" className="bg-slate-800">300,000 - 500,000 บาท</option>
                          <option value=">500k" className="bg-slate-800">มากกว่า 500,000 บาท</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70">วิธีการชำระเงิน</label>
                        <select
                          value={newClinic.paymentMethod}
                          onChange={(e) => setNewClinic(prev => ({ ...prev, paymentMethod: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        >
                          <option value="bank_transfer" className="bg-slate-800">โอนเงินผ่านธนาคาร</option>
                          <option value="credit_card" className="bg-slate-800">บัตรเครดิต</option>
                          <option value="check" className="bg-slate-800">เช็ค</option>
                          <option value="cash" className="bg-slate-800">เงินสด</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70">ระยะเวลาการชำระ</label>
                        <select
                          value={newClinic.paymentTerm}
                          onChange={(e) => setNewClinic(prev => ({ ...prev, paymentTerm: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        >
                          <option value="monthly" className="bg-slate-800">รายเดือน</option>
                          <option value="quarterly" className="bg-slate-800">ราย 3 เดือน</option>
                          <option value="yearly" className="bg-slate-800">รายปี</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/70">แหล่งที่มาของลูกค้า</label>
                      <select
                        value={newClinic.leadSource}
                        onChange={(e) => setNewClinic(prev => ({ ...prev, leadSource: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      >
                        <option value="" className="bg-slate-800">-- เลือก --</option>
                        <option value="google_ads" className="bg-slate-800">Google Ads</option>
                        <option value="facebook_ads" className="bg-slate-800">Facebook Ads</option>
                        <option value="instagram" className="bg-slate-800">Instagram</option>
                        <option value="referral" className="bg-slate-800">การแนะนำ</option>
                        <option value="walk_in" className="bg-slate-800">ลูกค้าเดินเข้ามา</option>
                        <option value="event" className="bg-slate-800">งานแสดงสินค้า</option>
                        <option value="other" className="bg-slate-800">อื่นๆ</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/70">ผู้แนะนำ (ถ้ามี)</label>
                      <input
                        type="text"
                        value={newClinic.referredBy}
                        onChange={(e) => setNewClinic(prev => ({ ...prev, referredBy: e.target.value }))}
                        placeholder="ชื่อคนหรือคลินิกที่แนะนำ"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/70">เซลล์ที่รับผิดชอบ</label>
                      <input
                        type="text"
                        value={newClinic.assignedSales}
                        onChange={(e) => setNewClinic(prev => ({ ...prev, assignedSales: e.target.value }))}
                        placeholder="sales@bnaura.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/70">คู่แข่งหลัก</label>
                      <input
                        type="text"
                        value={newClinic.competitors}
                        onChange={(e) => setNewClinic(prev => ({ ...prev, competitors: e.target.value }))}
                        placeholder="Clinic A, System B, Application C"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      />
                    </div>
                  </>
                )}

                {/* Step 4: Technical Information */}
                {registerStep === 4 && (
                  <>
                    <h3 className="text-lg font-bold text-white mb-4">ข้อมูลเทคนิค <span className="text-sm font-normal text-white/50">(สามารถข้ามได้)</span></h3>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/70">ระบบที่ใช้อยู่ปัจจุบัน</label>
                      <textarea
                        value={newClinic.currentSystem}
                        onChange={(e) => setNewClinic(prev => ({ ...prev, currentSystem: e.target.value }))}
                        placeholder="เช่น Excel สำหรับจัดการลูกค้า, สมุดบันทึกสำหรับนัดหมาย, ไม่มีระบบคอมพิวเตอร์"
                        rows={3}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/70">ความต้องการ Integration กับระบบอื่น</label>
                      <textarea
                        value={newClinic.integrationNeeds}
                        onChange={(e) => setNewClinic(prev => ({ ...prev, integrationNeeds: e.target.value }))}
                        placeholder="เช่น POS System, Accounting Software, CRM, WhatsApp API"
                        rows={3}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/70">ระยะเวลาที่ต้องการใช้งาน</label>
                      <select
                        value={newClinic.timeline}
                        onChange={(e) => setNewClinic(prev => ({ ...prev, timeline: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      >
                        <option value="urgent" className="bg-slate-800">ด่วน (ภายใน 1 สัปดาห์)</option>
                        <option value="normal" className="bg-slate-800">ปกติ (ภายใน 2-4 สัปดาห์)</option>
                        <option value="flexible" className="bg-slate-800">ยืดหยุ่น (ภายใน 1-2 เดือน)</option>
                      </select>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mt-6">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="text-blue-300 font-medium">ข้อมูลสามารถแก้ไขได้ทีหลัง</p>
                          <p className="text-blue-200/80 mt-1">คุณสามารถกลับมาแก้ไขข้อมูลเหล่านี้ได้ทุกเมื่อในหน้าจัดการคลินิก</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-4">
                  {registerStep > 1 && (
                    <button
                      type="button"
                      onClick={() => setRegisterStep(prev => prev - 1)}
                      className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl font-semibold text-white hover:bg-white/10 transition-all"
                    >
                      ก่อนหน้า
                    </button>
                  )}
                  
                  {registerStep < 4 ? (
                    <button
                      type="button"
                      onClick={() => setRegisterStep(prev => prev + 1)}
                      className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-semibold shadow-premium hover:brightness-110 transition-all flex items-center justify-center gap-2"
                    >
                      ถัดไป
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowRegisterModal(false)}
                        className={`${registerStep > 1 ? 'flex-1' : 'w-full'} py-3 bg-white/5 border border-white/10 rounded-xl font-semibold text-white hover:bg-white/10 transition-all`}
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="submit"
                        disabled={registering}
                        className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-semibold shadow-premium hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {registering ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            กำลังสร้าง...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            สร้างคลินิก
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function cn(...classes: (string | undefined | null | boolean)[]) {
  return classes.filter(Boolean).join(' ');
}
