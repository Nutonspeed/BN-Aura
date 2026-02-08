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
  Shield,
  TrendUp,
  CheckCircle,
  HardDrives,
  Key,
  IdentificationBadge,
  Briefcase,
  Monitor,
  ChartLineUp,
  Database,
  ArrowSquareOut,
  Target
} from '@phosphor-icons/react';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import Breadcrumb from '@/components/ui/Breadcrumb';
import QuotaAlertPanel from '@/components/monitoring/QuotaAlertPanel';
import AIUsageDashboard from '@/components/monitoring/AIUsageDashboard';

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
    database: 'กำลังตรวจสอบ...',
    storage: 'กำลังตรวจสอบ...',
    ai_gateway: 'กำลังตรวจสอบ...',
    auth_service: 'กำลังตรวจสอบ...'
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
      setUserError('สร้างผู้ใช้ไม่สำเร็จ');
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
      setRegisterError(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <SpinnerGap className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse text-xs uppercase tracking-widest text-center">
          กำลังเข้าถึงโหนดควบคุมระดับโลก...
        </p>
      </div>
    );
  }

  const stats = [
    { label: 'คลินิกทั้งหมด', value: globalStats.totalClinics, icon: Buildings, trend: 'up' as const, change: 0 },
    { label: 'ลูกค้าทั่วโลก', value: globalStats.globalCustomers, icon: Users, trend: 'up' as const, change: 0 },
    { label: 'ภาระ AI รายเดือน', value: globalStats.monthlyAILoad, icon: Lightning, suffix: ' รายการ', trend: 'up' as const, change: 0 },
    { label: 'บุคลากรที่ใช้งาน', value: globalStats.activeSessions, icon: Pulse, trend: 'neutral' as const, change: 0 },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-20 font-sans"
    >
      <Breadcrumb />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-xs text-primary text-label"
          >
            <ShieldCheck weight="duotone" className="w-4 h-4" />
            โหนดอำนาจระบบ
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-display text-foreground"
          >
            ซูเปอร์แอดมิน <span className="text-primary">คอนโซล</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            การประสานงานระดับโลกและการกำกับดูแลประสิทธิภาพ
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-3"
        >
          <Button 
            variant="outline"
            onClick={() => router.push('/admin/network-map')}
            className="space-xs pad-md radius-lg text-micro border-border/50"
          >
            <Globe weight="duotone" className="w-4 h-4 text-primary" />
            แผนที่เครือข่าย
          </Button>
          <Button 
            onClick={() => setShowRegisterModal(true)}
            className="space-xs pad-lg radius-lg text-micro shadow-premium"
          >
            <Plus weight="bold" className="w-4 h-4" />
            ลงทะเบียนคลินิก
          </Button>
          <Button 
            variant="outline"
            className="bg-emerald-500/5 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10 space-xs pad-lg radius-lg text-micro"
            onClick={() => setShowUserModal(true)}
          >
            <Users weight="bold" className="w-4 h-4" />
            สร้างเจ้าของ
          </Button>
        </motion.div>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-2">
        {stats.map((stat, i) => (
          <StatCard
            key={stat.label}
            title={stat.label}
            value={stat.value}
            icon={stat.icon}
            trend={stat.trend}
            change={stat.change}
            suffix={stat.suffix}
            className="p-4"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 px-2">
        {/* Left: Clinic Management */}
        <div className="lg:col-span-2 space-lg">
          <Card className="radius-xl border-border/50 shadow-premium overflow-hidden group">
            <div className="absolute top-0 right-0 pad-xl opacity-[0.02] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
              <Buildings className="w-64 h-64 text-primary" />
            </div>

            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-md border-b border-border/50 pad-lg bg-secondary/30">
              <div className="flex items-center space-sm">
                <div className="w-12 h-12 radius-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                  <IdentificationBadge weight="duotone" className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-heading-2">ทะเบียนคลินิกระดับโลก</CardTitle>
                  <p className="text-label text-muted-foreground mt-0.5">อินสแตนซ์คลัสเตอร์ที่จัดการ</p>
                </div>
              </div>
              <div className="relative group w-full md:w-72">
                <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity radius-md" />
                <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder="ค้นหาโหนดคลัสเตอร์..." 
                  className="w-full bg-card border border-border/50 radius-lg py-3 pl-11 pr-4 text-caption text-foreground focus:outline-none focus:border-primary transition-all shadow-inner relative z-10"
                />
              </div>
            </CardHeader>

            <CardContent className="pad-lg">
              <div className="space-sm">
                {clinics.map((clinic, idx) => (
                  <motion.div
                    key={clinic.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + idx * 0.05 }}
                    className="pad-md bg-secondary/20 radius-xl border border-border/50 hover:border-primary/30 hover:bg-secondary/40 transition-all group/item flex flex-col md:flex-row md:items-center justify-between space-md relative overflow-hidden"
                  >
                    <div className="flex items-center space-md relative z-10">
                      <div className="w-14 h-14 radius-lg bg-card border border-border flex items-center justify-center text-muted-foreground group-hover/item:bg-primary/10 group-hover/item:text-primary transition-all duration-500 shadow-inner">
                        <Buildings weight="duotone" className="w-7 h-7" />
                      </div>
                      <div className="space-xs min-w-0">
                        <h4 className="text-heading-3 text-foreground group-hover/item:text-primary transition-colors truncate uppercase">{clinic.name}</h4>
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge variant="ghost" className="bg-primary/5 text-primary border-none font-black text-[8px] uppercase tracking-widest px-3">
                            {clinic.plan}
                          </Badge>
                          <div className="w-1 h-1 rounded-full bg-border" />
                          <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">
                            NODE-{clinic.id.slice(0, 8).toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-8 md:gap-10 relative z-10">
                      <div className="flex gap-8">
                        <div className="text-center min-w-[60px]">
                          <p className="text-lg font-black text-foreground tabular-nums tracking-tight">{clinic.customerCount.toLocaleString()}</p>
                          <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest">ลูกค้า</p>
                        </div>
                        <div className="text-center min-w-[60px]">
                          <p className="text-lg font-black text-foreground tabular-nums tracking-tight">{clinic.staffCount.toLocaleString()}</p>
                          <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest">บุคลากร</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => handleUpdateStatus(clinic.id, clinic.status)}
                          className={cn(
                            "px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] transition-all border shadow-sm",
                            clinic.status === 'active' 
                              ? "bg-emerald-500/5 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10" 
                              : "bg-rose-500/5 text-rose-500 border-rose-500/20 hover:bg-rose-500/10"
                          )}
                        >
                          {clinic.status === 'active' ? 'ใช้งาน' : 'ออฟไลน์'}
                        </button>
                        <Button 
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/clinics/${clinic.id}`)}
                          className="h-10 w-10 p-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                        >
                          <CaretRight weight="bold" className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <Button 
                variant="ghost" 
                className="w-full mt-8 py-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-primary border border-dashed border-border/50"
              >
                เข้าถึงเมทริกซ์คลัสเตอร์ทั้งหมด
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right: System Health & Operations */}
        <div className="space-y-8">
          {/* System Health */}
          <Card className="rounded-[40px] border-border/50 shadow-premium overflow-hidden group">
            <CardHeader className="border-b border-border/50 p-8 bg-secondary/30">
              <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
                สถานะโครงสร้างพื้นฐาน
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-8 space-y-4">
              {Object.entries(systemStatus).map(([node, status], idx) => (
                <motion.div 
                  key={node} 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                  className="p-4 bg-secondary/20 rounded-2xl border border-border/50 flex justify-between items-center group/health hover:bg-secondary/40 transition-all"
                >
                  <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                    {node.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{status === 'Checking...' ? 'Syncing...' : status}</span>
                    <div className={cn("w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]", status === 'Checking...' ? 'bg-muted animate-pulse' : 'bg-emerald-500')} />
                  </div>
                </motion.div>
              ))}

              <div className="p-5 bg-amber-500/5 rounded-[24px] border border-amber-500/10 flex gap-4 relative z-10 backdrop-blur-md mt-6">
                <WarningCircle weight="fill" className="w-6 h-6 text-amber-500 flex-shrink-0" />
                <p className="text-[10px] text-muted-foreground font-medium leading-relaxed italic">
                  <span className="text-amber-500 font-black uppercase tracking-tighter mr-1.5">พบความผิดปกติ:</span>
                  ความล่าช้าเล็กน้อยในระบบ กำหนดการซิงโครไนซ์อัตโนมัติ 02:00 UTC.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quota Alerts */}
          <QuotaAlertPanel compact />

          {/* AI Usage Monitoring */}
          <AIUsageDashboard />

          {/* Global Control Tools */}
          <Card className="rounded-[40px] border-border/50 shadow-premium overflow-hidden group">
            <CardHeader className="border-b border-border/50 p-8 bg-secondary/30">
              <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3 text-primary">
                <Gear weight="duotone" className="w-5 h-5" />
                ควบคุมระดับโลก
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-8">
              <div className="space-y-3">
                {[
                  { title: "สำรองฐานข้อมูลแบบกระจาย", sub: "ช่วง: 4 ชั่วโมง", icon: Database },
                  { title: "การล้างแคชประสาท", sub: "เกตเวย์ AI และ Redis", icon: Lightning },
                  { title: "การตรวจสอบความปลอดภัย", sub: "3 ไอเด็นติตี้กำลังหมดอายุ", icon: ShieldCheck }
                ].map((tool, i) => (
                  <motion.button 
                    key={i} 
                    whileHover={{ x: 4 }}
                    className="w-full flex items-center justify-between p-4 bg-secondary/20 border border-border/50 rounded-2xl hover:bg-primary/5 hover:border-primary/20 transition-all text-left group/tool"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground group-hover/tool:text-primary transition-colors shadow-inner">
                        <tool.icon weight="duotone" className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-xs font-bold text-foreground group-hover/tool:text-primary transition-colors truncate uppercase">{tool.title}</p>
                        <p className="text-[9px] text-muted-foreground italic font-medium truncate uppercase tracking-tighter">{tool.sub}</p>
                      </div>
                    </div>
                    <CaretRight weight="bold" className="w-3.5 h-3.5 text-muted-foreground group-hover/tool:text-primary transition-all" />
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create User Modal - Refined */}
      <AnimatePresence>
        {showUserModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-card border border-border rounded-[40px] overflow-hidden shadow-premium group p-10"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                <IdentificationBadge className="w-64 h-64 text-primary" />
              </div>

              <div className="relative z-10 space-y-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-sm">
                      <Users weight="duotone" className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground tracking-tight uppercase">การสร้างตัวตน</h3>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">สร้างโหนดผู้ดูแลระบบ</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowUserModal(false)} className="h-10 w-10 p-0 rounded-xl hover:bg-secondary">
                    <X weight="bold" className="w-5 h-5" />
                  </Button>
                </div>
                
                {userError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3"
                  >
                    <WarningCircle weight="fill" className="w-5 h-5 text-rose-500" />
                    <p className="text-rose-500 text-xs font-bold uppercase tracking-widest">ข้อผิดพลาด: {userError}</p>
                  </motion.div>
                )}

                <form onSubmit={handleCreateUser} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">อีเมลตัวตน *</label>
                    <div className="relative">
                      <EnvelopeSimple weight="bold" className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                      <input
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="owner@clinic.com"
                        className="w-full bg-secondary/50 border border-border rounded-2xl py-4 pl-12 pr-6 text-sm text-foreground focus:border-primary outline-none transition-all font-bold"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">ชื่อตัวตนเต็ม *</label>
                    <div className="relative">
                      <IdentificationBadge weight="bold" className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                      <input
                        type="text"
                        value={newUser.fullName}
                        onChange={(e) => setNewUser(prev => ({ ...prev, fullName: e.target.value }))}
                        placeholder="ชื่อผู้ใช้งาน"
                        className="w-full bg-secondary/50 border border-border rounded-2xl py-4 pl-12 pr-6 text-sm text-foreground focus:border-primary outline-none transition-all font-bold"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">คลัสเตอร์เป้าหมาย *</label>
                      <div className="relative">
                        <Buildings weight="bold" className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                        <select
                          value={newUser.clinicId}
                          onChange={(e) => setNewUser(prev => ({ ...prev, clinicId: e.target.value }))}
                          className="w-full bg-secondary/50 border border-border rounded-2xl py-4 pl-12 pr-6 text-xs text-foreground focus:border-primary outline-none transition-all appearance-none font-black uppercase tracking-widest"
                          required
                        >
                          <option value="" className="bg-card">เลือกคลัสเตอร์</option>
                          {clinics.map(clinic => (
                            <option key={clinic.id} value={clinic.id} className="bg-card">
                              {clinic.name.toUpperCase()}
                            </option>
                          ))}
                        </select>
                        <CaretRight weight="bold" className="absolute right-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rotate-90 text-muted-foreground/40 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">โปรโตคอลการเข้าถึง *</label>
                      <div className="relative">
                        <Shield weight="bold" className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                        <select
                          value={newUser.role}
                          onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                          className="w-full bg-secondary/50 border border-border rounded-2xl py-4 pl-12 pr-6 text-xs text-foreground focus:border-primary outline-none transition-all appearance-none font-black uppercase tracking-widest"
                          required
                        >
                          <option value="clinic_owner" className="bg-card">เจ้าของคลินิก</option>
                          <option value="clinic_admin" className="bg-card">ผู้ดูแลคลินิก</option>
                          <option value="sales_staff" className="bg-card">พนักงานขาย</option>
                        </select>
                        <CaretRight weight="bold" className="absolute right-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rotate-90 text-muted-foreground/40 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-primary/5 border border-primary/20 rounded-3xl space-y-2">
                    <div className="flex items-center gap-3">
                      <Key weight="fill" className="w-4 h-4 text-primary" />
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest">ข้อมูลรับรองเริ่มต้น</p>
                    </div>
                    <p className="text-xl font-mono font-black text-foreground tracking-tighter">BNAura2024!</p>
                    <p className="text-[9px] text-muted-foreground font-medium italic">โหนดตัวตนต้องสร้างโทเค็นการเข้าถึงใหม่หลังจากซิงโครไนซ์</p>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowUserModal(false)}
                      className="flex-1 py-6 rounded-[24px] text-[10px] font-black uppercase tracking-widest border-border/50 hover:bg-secondary"
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      type="submit"
                      disabled={creatingUser}
                      className="flex-[2] py-6 rounded-[24px] text-[10px] font-black uppercase tracking-widest shadow-premium gap-3"
                    >
                      {creatingUser ? (
                        <>
                          <SpinnerGap weight="bold" className="w-4 h-4 animate-spin" />
                          กำลังซิงโครไนซ์...
                        </>
                      ) : (
                        <>
                          <CheckCircle weight="bold" className="w-4 h-4" />
                          ยืนยันตัวตน
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Register Clinic Modal - Comprehensive Overhaul */}
      <AnimatePresence>
        {showRegisterModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowRegisterModal(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl bg-card border border-border rounded-[40px] overflow-hidden shadow-premium group"
            >
              {/* Background Decor */}
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                <Buildings className="w-64 h-64 text-primary" />
              </div>

              {/* Multi-step Header */}
              <div className="relative z-10 p-10 pb-0 space-y-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                      <Buildings weight="duotone" className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground tracking-tight uppercase">การลงทะเบียนคลัสเตอร์</h3>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">เริ่มต้นโหนดโครงสร้างพื้นฐาน</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowRegisterModal(false)} className="h-10 w-10 p-0 rounded-xl hover:bg-secondary">
                    <X weight="bold" className="w-5 h-5" />
                  </Button>
                </div>

                {/* Progress Pipeline */}
                <div className="flex items-center justify-center gap-4 max-w-md mx-auto">
                  {[1, 2, 3, 4].map((step) => (
                    <div key={step} className="flex items-center flex-1 last:flex-none">
                      <div className={cn(
                        "w-10 h-10 rounded-xl border-2 flex items-center justify-center text-xs font-black transition-all duration-500 relative",
                        registerStep >= step 
                          ? "bg-primary/10 border-primary text-primary shadow-glow-sm" 
                          : "bg-secondary/50 border-border/50 text-muted-foreground"
                      )}>
                        {registerStep > step ? <CheckCircle weight="bold" className="w-5 h-5" /> : step}
                        {registerStep === step && (
                          <motion.div layoutId="active-step" className="absolute -inset-1.5 bg-primary/5 blur-md rounded-xl z-[-1]" />
                        )}
                      </div>
                      {step < 4 && (
                        <div className="flex-1 h-0.5 mx-4 bg-border/30 relative overflow-hidden">
                          <motion.div 
                            initial={false}
                            animate={{ width: registerStep > step ? '100%' : '0%' }}
                            className="absolute inset-0 bg-primary"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-10 relative z-10">
                {registerError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3"
                  >
                    <WarningCircle weight="fill" className="w-5 h-5 text-rose-500" />
                    <p className="text-rose-500 text-xs font-bold uppercase tracking-widest">Exception: {registerError}</p>
                  </motion.div>
                )}

                <form onSubmit={handleRegisterClinic} className="space-y-8">
                  {/* Step 1: Basic Node Intel */}
                  {registerStep === 1 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Node Identity Name *</label>
                        <input
                          type="text"
                          value={newClinic.name}
                          onChange={(e) => setNewClinic(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g. BN_PREMIUM_CLINIC_NODE_01"
                          required
                          className="w-full bg-secondary/50 border border-border rounded-2xl py-4 px-6 text-sm text-foreground focus:border-primary outline-none transition-all font-bold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Transmission Mail *</label>
                          <input
                            type="email"
                            value={newClinic.email}
                            onChange={(e) => setNewClinic(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="node@cluster.com"
                            required
                            className="w-full bg-secondary/50 border border-border rounded-2xl py-4 px-6 text-sm text-foreground focus:border-primary outline-none transition-all font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Comm Channel</label>
                          <input
                            type="tel"
                            value={newClinic.phone}
                            onChange={(e) => setNewClinic(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="+66 00-000-0000"
                            className="w-full bg-secondary/50 border border-border rounded-2xl py-4 px-6 text-sm text-foreground focus:border-primary outline-none transition-all font-bold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Protocol Tier *</label>
                          <div className="relative">
                            <select
                              value={newClinic.plan}
                              onChange={(e) => setNewClinic(prev => ({ ...prev, plan: e.target.value }))}
                              className="w-full bg-secondary/50 border border-border rounded-2xl py-4 px-6 text-xs text-foreground focus:border-primary outline-none transition-all appearance-none font-black uppercase tracking-widest"
                            >
                              <option value="starter" className="bg-card">STARTER (฿2,900)</option>
                              <option value="professional" className="bg-card">PROFESSIONAL (฿4,900)</option>
                              <option value="premium" className="bg-card">PREMIUM (฿7,900)</option>
                              <option value="enterprise" className="bg-card">ENTERPRISE (฿12,900)</option>
                            </select>
                            <CaretRight weight="bold" className="absolute right-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rotate-90 text-muted-foreground/40 pointer-events-none" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Industry Logic *</label>
                          <div className="relative">
                            <select
                              value={newClinic.businessType}
                              onChange={(e) => setNewClinic(prev => ({ ...prev, businessType: e.target.value }))}
                              className="w-full bg-secondary/50 border border-border rounded-2xl py-4 px-6 text-xs text-foreground focus:border-primary outline-none transition-all appearance-none font-black uppercase tracking-widest"
                            >
                              <option value="clinic" className="bg-card">AESTHETIC_CLINIC</option>
                              <option value="hospital" className="bg-card">MEDICAL_FACILITY</option>
                              <option value="spa" className="bg-card">WELLNESS_NODE</option>
                              <option value="aesthetic_center" className="bg-card">CENTRAL_HUB</option>
                            </select>
                            <CaretRight weight="bold" className="absolute right-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rotate-90 text-muted-foreground/40 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Business Logic Registry */}
                  {registerStep === 2 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Company Registration</label>
                          <input
                            type="text"
                            value={newClinic.companyRegistration}
                            onChange={(e) => setNewClinic(prev => ({ ...prev, companyRegistration: e.target.value }))}
                            placeholder="010XXXXXXXXXX"
                            className="w-full bg-secondary/50 border border-border rounded-2xl py-4 px-6 text-sm text-foreground focus:border-primary outline-none transition-all font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Tax Identity Node</label>
                          <input
                            type="text"
                            value={newClinic.taxId}
                            onChange={(e) => setNewClinic(prev => ({ ...prev, taxId: e.target.value }))}
                            placeholder="TXN-XXXXXXXXXX"
                            className="w-full bg-secondary/50 border border-border rounded-2xl py-4 px-6 text-sm text-foreground focus:border-primary outline-none transition-all font-bold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Registry Year</label>
                          <input
                            type="number"
                            value={newClinic.establishedYear}
                            onChange={(e) => setNewClinic(prev => ({ ...prev, establishedYear: e.target.value }))}
                            placeholder="2024"
                            className="w-full bg-secondary/50 border border-border rounded-2xl py-4 px-6 text-sm text-foreground focus:border-primary outline-none transition-all font-bold tabular-nums"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Personnel count</label>
                          <div className="relative">
                            <select
                              value={newClinic.numberOfStaff}
                              onChange={(e) => setNewClinic(prev => ({ ...prev, numberOfStaff: e.target.value }))}
                              className="w-full bg-secondary/50 border border-border rounded-2xl py-4 px-6 text-[10px] text-foreground focus:border-primary outline-none transition-all appearance-none font-black uppercase tracking-widest"
                            >
                              <option value="" className="bg-card">SELECT_CAP</option>
                              <option value="1-5" className="bg-card">1-5 UNITS</option>
                              <option value="6-10" className="bg-card">6-10 UNITS</option>
                              <option value="11-20" className="bg-card">11-20 UNITS</option>
                              <option value="21-50" className="bg-card">21-50 UNITS</option>
                              <option value="50+" className="bg-card">50+ UNITS</option>
                            </select>
                            <CaretRight weight="bold" className="absolute right-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rotate-90 text-muted-foreground/40 pointer-events-none" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Cluster Nodes</label>
                          <input
                            type="number"
                            value={newClinic.numberOfBranches}
                            onChange={(e) => setNewClinic(prev => ({ ...prev, numberOfBranches: e.target.value }))}
                            placeholder="1"
                            min="1"
                            className="w-full bg-secondary/50 border border-border rounded-2xl py-4 px-6 text-sm text-foreground focus:border-primary outline-none transition-all font-bold tabular-nums"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Public Domain Endpoint</label>
                        <div className="relative">
                          <Globe weight="bold" className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                          <input
                            type="url"
                            value={newClinic.website}
                            onChange={(e) => setNewClinic(prev => ({ ...prev, website: e.target.value }))}
                            placeholder="https://clinical-node.network"
                            className="w-full bg-secondary/50 border border-border rounded-2xl py-4 pl-12 pr-6 text-sm text-foreground focus:border-primary outline-none transition-all font-bold"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Fiscal & Marketing Parameters */}
                  {registerStep === 3 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Yield Band Node</label>
                          <div className="relative">
                            <select
                              value={newClinic.monthlyRevenue}
                              onChange={(e) => setNewClinic(prev => ({ ...prev, monthlyRevenue: e.target.value }))}
                              className="w-full bg-secondary/50 border border-border rounded-2xl py-4 px-6 text-[10px] text-foreground focus:border-primary outline-none transition-all appearance-none font-black uppercase tracking-widest"
                            >
                              <option value="" className="bg-card">SELECT_BAND</option>
                              <option value="<100k" className="bg-card">LESS THAN ฿100K</option>
                              <option value="100k-300k" className="bg-card">฿100K - ฿300K</option>
                              <option value="300k-500k" className="bg-card">฿300K - ฿500K</option>
                              <option value="500k-1m" className="bg-card">฿500K - ฿1M</option>
                              <option value=">1m" className="bg-card">EXCEEDS ฿1M</option>
                            </select>
                            <CaretRight weight="bold" className="absolute right-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rotate-90 text-muted-foreground/40 pointer-events-none" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">IT Fiscal Quota</label>
                          <div className="relative">
                            <select
                              value={newClinic.itBudget}
                              onChange={(e) => setNewClinic(prev => ({ ...prev, itBudget: e.target.value }))}
                              className="w-full bg-secondary/50 border border-border rounded-2xl py-4 px-6 text-[10px] text-foreground focus:border-primary outline-none transition-all appearance-none font-black uppercase tracking-widest"
                            >
                              <option value="" className="bg-card">SELECT_QUOTA</option>
                              <option value="<50k" className="bg-card">UNDER ฿50K</option>
                              <option value="50k-100k" className="bg-card">฿50K - ฿100K</option>
                              <option value=">100k" className="bg-card">OVER ฿100K</option>
                            </select>
                            <CaretRight weight="bold" className="absolute right-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rotate-90 text-muted-foreground/40 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Settlement Node</label>
                          <div className="relative">
                            <select
                              value={newClinic.paymentMethod}
                              onChange={(e) => setNewClinic(prev => ({ ...prev, paymentMethod: e.target.value }))}
                              className="w-full bg-secondary/50 border border-border rounded-2xl py-4 px-6 text-[10px] text-foreground focus:border-primary outline-none transition-all appearance-none font-black uppercase tracking-widest"
                            >
                              <option value="bank_transfer" className="bg-card">BANK_TRANSFER</option>
                              <option value="credit_card" className="bg-card">CREDIT_CARD</option>
                              <option value="direct_debit" className="bg-card">DIRECT_DEBIT</option>
                            </select>
                            <CaretRight weight="bold" className="absolute right-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rotate-90 text-muted-foreground/40 pointer-events-none" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Cycle Term</label>
                          <div className="relative">
                            <select
                              value={newClinic.paymentTerm}
                              onChange={(e) => setNewClinic(prev => ({ ...prev, paymentTerm: e.target.value }))}
                              className="w-full bg-secondary/50 border border-border rounded-2xl py-4 px-6 text-[10px] text-foreground focus:border-primary outline-none transition-all appearance-none font-black uppercase tracking-widest"
                            >
                              <option value="monthly" className="bg-card">MONTHLY_SYNC</option>
                              <option value="quarterly" className="bg-card">QUARTERLY_SYNC</option>
                              <option value="yearly" className="bg-card">ANNUAL_SYNC</option>
                            </select>
                            <CaretRight weight="bold" className="absolute right-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rotate-90 text-muted-foreground/40 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Lead Attribution Matrix</label>
                        <div className="relative">
                          <Target weight="bold" className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                          <select
                            value={newClinic.leadSource}
                            onChange={(e) => setNewClinic(prev => ({ ...prev, leadSource: e.target.value }))}
                            className="w-full bg-secondary/50 border border-border rounded-2xl py-4 pl-12 pr-6 text-[10px] text-foreground focus:border-primary outline-none transition-all appearance-none font-black uppercase tracking-widest"
                          >
                            <option value="" className="bg-card">SELECT_SOURCE</option>
                            <option value="google_ads" className="bg-card">GOOGLE_ENGINE_ADS</option>
                            <option value="facebook_ads" className="bg-card">META_SOCIAL_ADS</option>
                            <option value="instagram" className="bg-card">IG_VISUAL_NODE</option>
                            <option value="referral" className="bg-card">NETWORK_REFERRAL</option>
                            <option value="walk_in" className="bg-card">PHYSICAL_WALK_IN</option>
                          </select>
                          <CaretRight weight="bold" className="absolute right-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rotate-90 text-muted-foreground/40 pointer-events-none" />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 4: Technical Stack Integration */}
                  {registerStep === 4 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Current Legacy Architecture</label>
                        <textarea
                          value={newClinic.currentSystem}
                          onChange={(e) => setNewClinic(prev => ({ ...prev, currentSystem: e.target.value }))}
                          placeholder="Describe current system topography..."
                          rows={3}
                          className="w-full bg-secondary/50 border border-border rounded-2xl py-4 px-6 text-sm text-foreground focus:border-primary outline-none transition-all font-bold resize-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Cross-system Link Requirements</label>
                        <textarea
                          value={newClinic.integrationNeeds}
                          onChange={(e) => setNewClinic(prev => ({ ...prev, integrationNeeds: e.target.value }))}
                          placeholder="List required API endpoints and system links..."
                          rows={3}
                          className="w-full bg-secondary/50 border border-border rounded-2xl py-4 px-6 text-sm text-foreground focus:border-primary outline-none transition-all font-bold resize-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Synchronisation Velocity</label>
                        <div className="relative">
                          <Lightning weight="bold" className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                          <select
                            value={newClinic.timeline}
                            onChange={(e) => setNewClinic(prev => ({ ...prev, timeline: e.target.value }))}
                            className="w-full bg-secondary/50 border border-border rounded-2xl py-4 pl-12 pr-6 text-[10px] text-foreground focus:border-primary outline-none transition-all appearance-none font-black uppercase tracking-widest"
                          >
                            <option value="urgent" className="bg-card">HIGH_PRIORITY (1 WEEK)</option>
                            <option value="normal" className="bg-card">STANDARD_SYNC (2-4 WEEKS)</option>
                            <option value="flexible" className="bg-card">EXTENDED_WINDOW (1-2 MONTHS)</option>
                          </select>
                          <CaretRight weight="bold" className="absolute right-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rotate-90 text-muted-foreground/40 pointer-events-none" />
                        </div>
                      </div>

                      <div className="p-5 bg-primary/5 border border-primary/20 rounded-3xl flex gap-4 mt-6">
                        <ShieldCheck weight="fill" className="w-6 h-6 text-primary flex-shrink-0" />
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-primary uppercase tracking-widest">Protocol Confirmation</p>
                          <p className="text-[9px] text-muted-foreground font-medium italic">Parameters can be refined in cluster settings post-initialization.</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div className="flex gap-4 pt-6">
                    {registerStep > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setRegisterStep(prev => prev - 1)}
                        className="flex-1 py-6 rounded-[24px] text-[10px] font-black uppercase tracking-widest border-border/50 hover:bg-secondary"
                      >
                        Back Cycle
                      </Button>
                    )}
                    
                    {registerStep < 4 ? (
                      <Button
                        type="button"
                        onClick={() => setRegisterStep(prev => prev + 1)}
                        className="flex-1 py-6 rounded-[24px] text-[10px] font-black uppercase tracking-widest shadow-premium gap-3"
                      >
                        Advance Protocol
                        <CaretRight weight="bold" className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={registering}
                        className="flex-[2] py-6 rounded-[24px] text-[10px] font-black uppercase tracking-widest shadow-premium gap-3"
                      >
                        {registering ? (
                          <>
                            <SpinnerGap weight="bold" className="w-4 h-4 animate-spin" />
                            Initializing...
                          </>
                        ) : (
                          <>
                            <Buildings weight="bold" className="w-4 h-4" />
                            Initialize Cluster
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
