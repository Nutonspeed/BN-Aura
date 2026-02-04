'use client';

import { useState, useEffect } from 'react';
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
  UserCheck
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

/**
 * M1.1: Staff Profile Management Component
 */

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
        
        // For E2E testing: log and alert temp password if provided
        if (data.tempPassword) {
          console.log('🔐 Temporary Password for E2E Testing:', data.tempPassword);
          console.log('📧 Email:', formData.email);
          alert(`✅ Staff created successfully!\n\n🔐 Temporary Password: ${data.tempPassword}\n📧 Email: ${formData.email}\n\n(For E2E testing purposes)`);
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

  const stats = {
    total: profiles.length,
    active: profiles.filter(p => p.is_active).length,
    admins: profiles.filter(p => p.role === 'clinic_admin' || p.role === 'clinic_owner').length
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10 pb-20 font-sans"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]">
            <ShieldCheck className="w-4 h-4" />
            Personnel Management
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tight font-heading">Staff <span className="text-primary text-glow font-heading">Directory</span></h1>
          <p className="text-muted-foreground font-light text-sm italic">Managing clinic personnel, roles, and access permissions.</p>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowForm(true)}
          className="flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-[0.1em] shadow-premium hover:brightness-110 transition-all active:scale-95 text-xs"
        >
          <Plus className="w-4 h-4 stroke-[3px]" />
          <span>Initialize New Staff Node</span>
        </motion.button>
      </div>

      {/* Search & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-2">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/10 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-3xl" />
            <MagnifyingGlass className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Filter by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-3xl py-4 pl-14 pr-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all shadow-inner backdrop-blur-md relative z-10"
            />
          </div>
        </div>
        <div className="glass-premium p-6 rounded-3xl border border-white/5 flex items-center justify-between group overflow-hidden relative">
          <div className="absolute -top-2 -right-2 opacity-5 group-hover:opacity-10 transition-opacity">
            <Users className="w-16 h-16 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Active Staff</p>
            <p className="text-3xl font-black text-white tracking-tighter tabular-nums">{stats.active} / {stats.total}</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-premium">
            <UserCheck className="w-7 h-7" />
          </div>
        </div>
        <div className="glass-premium p-6 rounded-3xl border border-white/5 flex items-center justify-between group overflow-hidden relative">
          <div className="absolute -top-2 -right-2 opacity-5 group-hover:opacity-10 transition-opacity">
            <Shield className="w-16 h-16 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Authorities</p>
            <p className="text-3xl font-black text-white tracking-tighter tabular-nums">{stats.admins}</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-premium">
            <Shield className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* Staff Grid */}
      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center space-y-6">
          <SpinnerGap className="w-12 h-12 text-primary animate-spin" />
          <p className="text-muted-foreground animate-pulse font-bold uppercase tracking-[0.3em] text-[10px]">Synchronizing Personnel Data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          <AnimatePresence>
            {filteredProfiles.map((profile, i) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -8 }}
                className="glass-premium p-8 rounded-[40px] border border-white/10 flex flex-col justify-between group hover:border-primary/40 transition-all duration-500 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none">
                  <User className="w-24 h-24 text-white" />
                </div>

                <div className="space-y-6 relative z-10">
                  <div className="flex justify-between items-start">
                    <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 font-black text-2xl shadow-sm group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500">
                      {profile.users?.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex gap-2">
                      <motion.button 
                        whileHover={{ scale: 1.1, rotate: 5 }} 
                        whileTap={{ scale: 0.9 }} 
                        className="p-2.5 bg-white/5 rounded-xl text-rose-500/30 hover:text-rose-400 hover:bg-rose-500/10 transition-all border border-transparent hover:border-white/10"
                        title="TERMINATE NODE"
                      >
                        <Trash className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono text-primary font-bold tracking-[0.2em] bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                        {profile.role.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md border",
                        profile.is_active ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                      )}>
                        {profile.is_active ? 'OPERATIONAL' : 'OFFLINE'}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-white group-hover:text-primary transition-colors tracking-tight leading-tight uppercase">
                      {profile.users?.full_name || 'ANONYMOUS NODE'}
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <EnvelopeSimple className="w-4 h-4 text-primary/60 shrink-0" />
                      <p className="text-xs text-muted-foreground font-light leading-relaxed truncate italic">{profile.users?.email}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                      Registry: {new Date(profile.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredProfiles.length === 0 && !loading && (
            <div className="col-span-full py-32 text-center relative overflow-hidden glass-card rounded-[48px] border border-white/5">
              <div className="flex flex-col items-center justify-center space-y-6 relative z-10 opacity-30 text-white">
                <User className="w-16 h-16" />
                <p className="text-sm font-black uppercase tracking-[0.2em]">No Personnel Nodes Detected</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Initialize Staff Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-[32px] p-8 shadow-2xl relative z-10 overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none text-primary">
                <User className="w-32 h-32" />
              </div>

              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/20 flex items-center justify-center text-primary shadow-premium">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Initialize Staff Node</h3>
                    <p className="text-sm text-muted-foreground italic font-light">Establishing new operational personnel linkage.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-3 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/10"
                >
                  <Plus className="w-6 h-6 text-muted-foreground rotate-45" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                      Email Designation *
                    </label>
                    <div className="relative group/input">
                      <EnvelopeSimple className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/input:text-primary transition-colors" />
                      <input
                        type="email"
                        placeholder="e.g. node.alpha@clinic.com"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all text-sm font-medium"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                      Personnel Full Name *
                    </label>
                    <div className="relative group/input">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/input:text-primary transition-colors" />
                      <input
                        type="text"
                        placeholder="e.g. Sarah Wilson"
                        required
                        value={formData.full_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all text-sm font-medium"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Operational Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-primary/50 transition-all appearance-none text-sm font-medium"
                  >
                    <option value="clinic_staff" className="bg-[#0A0A0A]">CLINIC STAFF</option>
                    <option value="sales_staff" className="bg-[#0A0A0A]">SALES STAFF</option>
                    <option value="clinic_admin" className="bg-[#0A0A0A]">CLINIC ADMIN</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Operational Status
                  </label>
                  <div className="px-6 py-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-black uppercase tracking-[0.1em] text-emerald-400">Active Operational Node</span>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-6 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all text-[10px] shadow-sm active:scale-95"
                  >
                    Abort
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] px-6 py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-3 text-[10px] shadow-premium active:scale-95"
                  >
                    <Plus className="w-4 h-4 stroke-[3px]" />
                    Initialize Node
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

