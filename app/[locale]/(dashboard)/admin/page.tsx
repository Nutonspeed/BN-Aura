'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Users, 
  Activity, 
  ShieldCheck, 
  Settings, 
  Zap, 
  Globe, 
  Search,
  Plus,
  Loader2,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [systemStatus, setSystemHealth] = useState<Record<string, string>>({
    database: 'Checking...',
    storage: 'Checking...',
    ai_gateway: 'Checking...',
    auth_service: 'Checking...'
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch clinics
      const resClinics = await fetch('/api/admin/management?type=clinics');
      const dataClinics = await resClinics.json();
      if (dataClinics.success) {
        setClinics(dataClinics.data.clinics.map((c: { id: string; name: string; status: string; customers: { count: number }[]; clinic_staff: { count: number }[] }) => ({
          ...c,
          plan: 'Premium AI',
          status: c.status as 'active' | 'inactive' | 'pending',
          customerCount: c.customers?.[0]?.count || 0,
          staffCount: c.clinic_staff?.[0]?.count || 0
        })));
      }

      // 2. Fetch health
      const resHealth = await fetch('/api/admin/management?type=system_health');
      const dataHealth = await resHealth.json();
      if (dataHealth.success) {
        setSystemHealth(dataHealth.data.health);
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
      const res = await fetch('/api/admin/management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateStatus',
          clinicId,
          status: newStatus
        })
      });
      const data = await res.json();
      if (data.success) {
        setClinics(prev => prev.map(c => c.id === clinicId ? { ...c, status: newStatus as 'active' | 'inactive' | 'pending' } : c));
      }
    } catch (error) {
      console.error('Error updating status:', error);
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
    { label: 'Total Clinics', value: clinics.length.toString(), icon: Building2, color: 'text-primary' },
    { label: 'Global Customers', value: clinics.reduce((acc, c) => acc + c.customerCount, 0).toLocaleString(), icon: Users, color: 'text-emerald-400' },
    { label: 'Monthly AI Load', value: '84.2k', icon: Zap, color: 'text-amber-400' },
    { label: 'Active Sessions', value: '1,248', icon: Activity, color: 'text-rose-400' },
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
          <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white hover:bg-white/10 transition-all active:scale-95 flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            Network Map
          </button>
          <button className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-bold shadow-premium hover:brightness-110 transition-all active:scale-95 flex items-center gap-2">
            <Plus className="w-4 h-4 stroke-[3px]" />
            Register New Clinic
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
                    <button className="p-3 hover:bg-white/10 rounded-2xl transition-all border border-transparent hover:border-white/10 shadow-sm">
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
    </motion.div>
  );
}

function cn(...classes: (string | undefined | null | boolean)[]) {
  return classes.filter(Boolean).join(' ');
}
