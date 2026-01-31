'use client';

import { motion } from 'framer-motion';
import { 
  UserPlus, 
  MoreVertical, 
  Mail, 
  Shield, 
  CheckCircle2, 
  Clock,
  Search,
  Filter,
  Users,
  Trash2,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import InviteStaffModal from '@/components/InviteStaffModal';
import SetTargetModal from '@/components/SetTargetModal';

interface StaffMember {
  id: string;
  role: string;
  is_active: boolean;
  created_at: string;
  clinic_id: string;
  user_id: string;
  users: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}

export default function StaffManagement() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [selectedStaffForTarget, setSelectedStaffForTarget] = useState<{ id: string; name: string } | null>(null);

  const supabase = useMemo(() => createClient(), []);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clinic_staff')
        .select(`
          id,
          role,
          is_active,
          created_at,
          clinic_id,
          user_id,
          users:user_id (
            id,
            full_name,
            email
          )
        `);

      if (error) throw error;
      setStaff((data as unknown as StaffMember[]) || []);
    } catch (err) {
      console.error('Error fetching staff:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const handleSetTarget = (person: any) => {
    setSelectedStaffForTarget({
      id: person.users?.id || '',
      name: person.users?.full_name || 'Personnel'
    });
    setIsTargetModalOpen(true);
  };

  const handleUpdateStatus = async (staffId: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/clinic/staff/${staffId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive })
      });
      if (res.ok) fetchStaff();
    } catch (err) {
      console.error('Error updating staff status:', err);
    }
  };

  const handleRemoveStaff = async (staffId: string) => {
    if (!confirm('Are you sure you want to terminate this personnel node?')) return;
    try {
      const res = await fetch(`/api/clinic/staff/${staffId}`, {
        method: 'DELETE'
      });
      if (res.ok) fetchStaff();
    } catch (err) {
      console.error('Error removing staff:', err);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleInviteSuccess = () => {
    fetchStaff(); // Refresh the staff list
  };

  const filteredStaff = staff.filter(person => 
    person.users?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.users?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10 pb-20 font-sans"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-[0.3em]"
          >
            <Shield className="w-4 h-4" />
            Human Capital Intelligence
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-white uppercase tracking-tight"
          >
            Staff <span className="text-primary text-glow">Orchestration</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            Managing clinical talent, roles, and security access protocols.
          </motion.p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-[0.1em] shadow-premium hover:brightness-110 transition-all active:scale-95 text-xs"
        >
          <UserPlus className="w-4 h-4 stroke-[3px]" />
          <span>Authorize New Personnel</span>
        </motion.button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative flex-1 group"
        >
          <div className="absolute inset-0 bg-primary/10 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-3xl" />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search team by identity or digital mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-3xl py-4 pl-14 pr-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all shadow-inner backdrop-blur-md relative z-10"
          />
        </motion.div>
        
        <motion.button 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-3 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all backdrop-blur-md"
        >
          <Filter className="w-4 h-4 text-primary" />
          <span>Access Filters</span>
        </motion.button>
      </div>

      {/* Staff Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-premium rounded-[40px] overflow-hidden border border-white/5 shadow-2xl relative"
      >
        <div className="overflow-x-auto custom-scrollbar">
          {loading ? (
            <div className="py-32 flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <Users className="absolute inset-0 m-auto w-6 h-6 text-primary animate-pulse" />
              </div>
              <p className="text-muted-foreground animate-pulse font-bold uppercase tracking-[0.3em] text-[10px]">Syncing Personnel Data...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.03]">
                  <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Personnel Identity</th>
                  <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Operational Role</th>
                  <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Authorization Status</th>
                  <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Registry Date</th>
                  <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredStaff.length > 0 ? (
                  filteredStaff.map((person, i) => (
                    <motion.tr 
                      key={person.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.03 }}
                      className="group hover:bg-white/[0.05] transition-all relative overflow-hidden"
                    >
                      <td className="px-8 py-6 relative">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary/0 group-hover:bg-primary transition-all" />
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary text-sm font-black border border-primary/20 shadow-premium group-hover:scale-110 transition-transform duration-500">
                            {person.users?.full_name?.charAt(0) || 'U'}
                          </div>
                          <div className="flex flex-col space-y-1 pr-6">
                            <span className="text-base font-black text-white group-hover:text-primary transition-colors tracking-tight">{person.users?.full_name || 'Anonymous Entity'}</span>
                            <div className="flex items-center gap-2">
                              <Mail className="w-3 h-3 text-primary/60" />
                              <p className="text-[10px] text-muted-foreground font-medium italic">{person.users?.email}</p>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-primary/20 transition-all">
                            <Shield className="w-4 h-4 text-primary/60" />
                          </div>
                          <span className="text-[11px] font-black text-white/80 uppercase tracking-widest">{person.role.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        {person.is_active ? (
                          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-widest border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                            <CheckCircle2 className="w-3 h-3" />
                            Active Node
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 text-rose-400 text-[9px] font-black uppercase tracking-widest border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
                            <Clock className="w-3 h-3" />
                            Suspended
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-6 text-xs text-muted-foreground font-medium uppercase tracking-tighter">
                        {new Date(person.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleUpdateStatus(person.id, person.is_active)}
                            className={cn(
                              "p-3 rounded-xl border border-transparent transition-all shadow-sm",
                              person.is_active 
                                ? "text-amber-500/40 hover:text-amber-500 hover:bg-amber-500/10 hover:border-amber-500/10" 
                                : "text-emerald-500/40 hover:text-emerald-500 hover:bg-emerald-500/10 hover:border-emerald-500/10"
                            )}
                            title={person.is_active ? "Suspend Node" : "Activate Node"}
                          >
                            {person.is_active ? <Clock className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                          </motion.button>
                          
                          {person.role === 'sales_staff' && (
                            <motion.button 
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleSetTarget(person)}
                              className="p-3 text-primary/40 hover:text-primary transition-all rounded-xl hover:bg-primary/10 border border-transparent hover:border-primary/10 shadow-sm"
                              title="Set Sales Target"
                            >
                              <Target className="w-4 h-4" />
                            </motion.button>
                          )}

                          <motion.button 
                            whileHover={{ scale: 1.1, rotate: 5 }} 
                            whileTap={{ scale: 0.9 }} 
                            onClick={() => handleRemoveStaff(person.id)}
                            className="p-3 text-rose-500/30 hover:text-rose-400 transition-all rounded-xl hover:bg-rose-500/10 border border-transparent hover:border-rose-500/10 shadow-sm"
                            title="Terminate Personnel"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-32 text-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
                      <div className="flex flex-col items-center justify-center space-y-6 relative z-10">
                        <div className="w-20 h-20 rounded-[32px] bg-white/5 border border-white/5 flex items-center justify-center text-white/10 animate-float">
                          <Users className="w-10 h-10" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-xl font-black text-white/40 uppercase tracking-widest">Personnel Registry Empty</p>
                          <p className="text-sm text-muted-foreground font-light max-w-sm mx-auto italic">No authorized personnel detected within the current security cluster.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>

      {/* Set Target Modal */}
      {selectedStaffForTarget && (
        <SetTargetModal
          isOpen={isTargetModalOpen}
          onClose={() => setIsTargetModalOpen(false)}
          onSuccess={fetchStaff}
          staffId={selectedStaffForTarget.id}
          staffName={selectedStaffForTarget.name}
          currentClinicId={staff[0]?.clinic_id || ''}
        />
      )}

      {/* Invite Staff Modal */}
      <InviteStaffModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={handleInviteSuccess}
      />
    </motion.div>
  );
}
