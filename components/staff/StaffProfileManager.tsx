'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User,
  Plus,
  Trash,
  EnvelopeSimple,
  MagnifyingGlass,
  Users,
  Shield,
  SpinnerGap,
  Clock,
  ShieldCheck,
  UserCheck,
  ArrowLeft,
  CaretRight,
  CaretDown,
  IdentificationCard,
  IdentificationBadge,
  X,
  DotsThreeVertical,
  CheckCircle,
  Funnel,
  Monitor
} from '@phosphor-icons/react';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface StaffProfile {
  id: string;
  role: string;
  is_active: boolean;
  created_at: string;
  users: {
    email: string;
    full_name: string;
    phone?: string;
  };
}

export default function StaffProfileManager({ clinicId }: { clinicId?: string }) {
  const { goBack } = useBackNavigation();
  const t = useTranslations('clinic.staff' as any);
  const [profiles, setProfiles] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'clinic_staff'
  });

  const fetchProfiles = async () => {
    if (!clinicId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/v1/staff/profiles?clinic_id=${clinicId}`, {
        cache: 'no-store'
      });
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        const uniqueProfiles = Array.from(
          new Map(result.data.map((item: StaffProfile) => [item.id, item])).values()
        ) as StaffProfile[];
        setProfiles(uniqueProfiles);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/v1/staff/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, clinic_id: clinicId })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.tempPassword) {
          alert(`Staff created successfully!\n\nTemporary Password: ${data.tempPassword}\nEmail: ${formData.email}`);
        }
        
        await fetchProfiles();
        setShowForm(false);
        setFormData({ email: '', full_name: '', role: 'clinic_staff' });
      }
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [clinicId]);

  const filteredProfiles = profiles.filter(p => 
    p.users?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.users?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = useMemo(() => ({
    total: profiles.length,
    active: profiles.filter(p => p.is_active).length,
    admins: profiles.filter(p => p.role === 'clinic_admin' || p.role === 'clinic_owner').length,
    practitioners: profiles.filter(p => p.role === 'beautician').length
  }), [profiles]);

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
            <ShieldCheck weight="duotone" className="w-4 h-4" />
            ระบบจัดการบุคลากร
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-foreground tracking-tight uppercase"
          >
            Staff <span className="text-primary">Registry</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            จัดการบุคลากร ตำแหน่งงาน และสิทธิ์การเข้าถึง
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button 
            onClick={() => setShowForm(true)}
            className="gap-3 shadow-premium px-8 py-6 rounded-2xl text-xs font-black uppercase tracking-widest group"
          >
            <Plus weight="bold" className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>เพิ่มพนักงานใหม่</span>
          </Button>
        </motion.div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-2">
        <StatCard
          title="พนักงานที่ใช้งาน"
          value={stats.active}
          suffix={` / ${stats.total}`}
          icon={UserCheck}
          iconColor="text-emerald-500"
          className="p-4"
        />
        <StatCard
          title="ผู้จัดการ"
          value={stats.admins}
          icon={Shield}
          iconColor="text-blue-500"
          className="p-4"
        />
        <StatCard
          title="พนักงานปฏิบัติการ"
          value={profiles.filter(p => p.role === 'clinic_staff').length}
          icon={Users}
          iconColor="text-primary"
          className="p-4"
        />
        <StatCard
          title="ผู้เชี่ยวชาญ"
          value={stats.practitioners}
          icon={IdentificationBadge}
          iconColor="text-purple-500"
          className="p-4"
        />
      </div>

      {/* Search & Intelligence Controls */}
      <div className="px-2">
        <Card className="p-6 rounded-[32px] border-border/50 shadow-card relative overflow-hidden group">
          <div className="flex flex-col md:flex-row gap-6 relative z-10">
            <div className="relative flex-1 group/input">
              <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity rounded-xl" />
              <MagnifyingGlass weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors relative z-10" />
              <input 
                type="text" 
                placeholder="กรองตามชื่อ, อีเมล หรือตำแหน่ง..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-secondary/50 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary transition-all shadow-inner relative z-10 font-bold text-sm"
              />
            </div>
            <Button variant="outline" className="gap-2 px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border-border/50 hover:bg-secondary shrink-0">
              <Funnel weight="bold" className="w-4 h-4" />
              ตัวกรอง
            </Button>
          </div>
        </Card>
      </div>

      {/* Staff Matrix Grid */}
      <div className="px-2">
        {loading ? (
          <div className="py-48 flex flex-col items-center justify-center gap-6 bg-card border border-border/50 rounded-[40px] shadow-inner opacity-60">
            <SpinnerGap weight="bold" className="w-12 h-12 text-primary animate-spin" />
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] text-center">กำลังประมวลผลข้อมูลบุคลากร...</p>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <Card variant="ghost" className="py-48 border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-8 opacity-40 rounded-[40px]">
            <IdentificationCard weight="duotone" className="w-20 h-20 text-muted-foreground" />
            <div className="text-center space-y-3">
              <h3 className="text-2xl font-black text-foreground uppercase tracking-widest">ไม่มีข้อมูลพนักงาน</h3>
              <p className="text-sm text-muted-foreground font-medium italic max-w-sm mx-auto">ยังไม่มีบุคลากรทางคลินิกในระบบ</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredProfiles.map((profile, i) => (
                <motion.div
                  key={profile.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="h-full border-border/50 hover:border-primary/30 transition-all group overflow-hidden flex flex-col shadow-card hover:shadow-premium">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                      <IdentificationCard weight="fill" className="w-32 h-32 text-primary" />
                    </div>

                    <CardHeader className="pb-4 relative z-10">
                      <div className="flex justify-between items-start gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-secondary/50 border border-border flex items-center justify-center text-primary group-hover:bg-primary/10 transition-all duration-500 shadow-inner text-2xl font-black">
                          {profile.users?.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="p-2 h-9 w-9 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/5 rounded-xl transition-all"
                            title="TERMINATE NODE"
                          >
                            <Trash weight="bold" className="w-4.5 h-4.5" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="flex-1 space-y-6 relative z-10 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="ghost" className="bg-primary/5 text-primary border-none font-mono text-[9px] px-2 py-0.5 tracking-widest uppercase shadow-sm shadow-inner">
                              {profile.role.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <Badge variant={profile.is_active ? 'success' : 'secondary'} size="sm" className="font-black uppercase text-[8px] tracking-widest px-2.5 py-1">
                              {profile.is_active ? 'OPERATIONAL' : 'OFFLINE'}
                            </Badge>
                          </div>
                          <h3 className="text-xl font-black text-foreground group-hover:text-primary transition-colors tracking-tight truncate uppercase leading-tight">
                            {profile.users?.full_name || 'Anonymous Node'}
                          </h3>
                        </div>

                        <div className="p-4 bg-secondary/30 rounded-2xl border border-border/50 group-hover:border-primary/20 transition-all shadow-inner">
                          <div className="flex items-center gap-3">
                            <EnvelopeSimple weight="duotone" className="w-4 h-4 text-primary/60 shrink-0" />
                            <p className="text-xs text-foreground/70 font-medium truncate italic leading-none">{profile.users?.email}</p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-border/30 flex items-center justify-between">
                        <div className="flex items-center gap-2.5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                          <Clock weight="bold" className="w-3.5 h-3.5 opacity-40" />
                          Registry: {new Date(profile.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <Button variant="ghost" size="sm" className="text-primary font-black uppercase text-[10px] tracking-widest gap-2 hover:bg-primary/5 rounded-xl">
                          View Intel <CaretRight weight="bold" className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* เพิ่มพนักงานใหม่ */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-card border border-border rounded-[40px] p-10 shadow-premium relative z-10 overflow-hidden group my-8"
            >
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                <User weight="fill" className="w-64 h-64 text-primary" />
              </div>

              <div className="flex items-center justify-between mb-10 relative z-10">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm shadow-inner">
                    <Plus weight="duotone" className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-foreground tracking-tight uppercase leading-tight">Identity Synthesis</h2>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Initializing new personnel linkage</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setShowForm(false)}
                  className="h-11 w-11 p-0 rounded-xl hover:bg-secondary transition-all"
                >
                  <X weight="bold" className="w-6 h-6" />
                </Button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                      Identity Email Node *
                    </label>
                    <div className="relative group/input">
                      <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity rounded-xl" />
                      <EnvelopeSimple weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors relative z-10" />
                      <input
                        type="email"
                        placeholder="node.alpha@clinic.network"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary outline-none transition-all font-bold shadow-inner relative z-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                      Full Identity Alias *
                    </label>
                    <div className="relative group/input">
                      <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity rounded-xl" />
                      <User weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors relative z-10" />
                      <input
                        type="text"
                        placeholder="Sarah Wilson"
                        required
                        value={formData.full_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                        className="w-full pl-12 pr-4 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary outline-none transition-all font-bold tracking-tight shadow-inner relative z-10"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Authorized Protocol Tier *
                  </label>
                  <div className="relative group/input">
                    <Shield weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors relative z-10" />
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full pl-12 pr-12 py-4 bg-secondary/30 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary outline-none transition-all appearance-none font-black uppercase tracking-widest text-xs shadow-inner relative z-10"
                    >
                      <option value="clinic_staff" className="bg-card">CLINIC_OPERATIONAL</option>
                      <option value="sales_staff" className="bg-card">COMMERCIAL_INTEL</option>
                      <option value="clinic_admin" className="bg-card">ADMIN_OVERSIGHT</option>
                      <option value="beautician" className="bg-card">CLINICAL_PRACTITIONER</option>
                    </select>
                    <CaretDown weight="bold" className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none z-20" />
                  </div>
                </div>
                
                <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-[32px] flex items-center justify-between shadow-inner">
                  <div className="flex items-center gap-5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
                    <div>
                      <span className="text-xs font-black uppercase tracking-widest text-emerald-500">Active Operational Matrix</span>
                      <p className="text-[10px] text-muted-foreground font-medium italic mt-0.5 uppercase tracking-widest opacity-60">Identity will be initialized as a functional node</p>
                    </div>
                  </div>
                  <UserCheck weight="duotone" className="w-8 h-8 text-emerald-500/40" />
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-border/30">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="w-full sm:flex-1 py-7 rounded-[24px] font-black uppercase tracking-widest text-[10px] border-border/50 hover:bg-secondary"
                  >
                    Abort Synthesis
                  </Button>
                  <Button
                    type="submit"
                    className="w-full sm:flex-[2] py-7 rounded-[24px] font-black uppercase tracking-widest text-[10px] shadow-premium gap-3 relative overflow-hidden group/btn"
                  >
                    <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                    <Plus weight="bold" className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                    Commit Identity node
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}