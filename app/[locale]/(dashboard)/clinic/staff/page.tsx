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
  Loader2
} from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';

interface StaffMember {
  id: string;
  role: string;
  is_active: boolean;
  created_at: string;
  users: {
    full_name: string;
    email: string;
  } | null;
}

export default function StaffManagement() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function fetchStaff() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('clinic_staff')
          .select(`
            id,
            role,
            is_active,
            created_at,
            users:user_id (
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
    }
    fetchStaff();
  }, [supabase]);

  const filteredStaff = staff.filter(person => 
    person.users?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.users?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white uppercase tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground font-light text-sm italic">Manage your clinic team, roles and permissions.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold shadow-premium hover:brightness-110 transition-all active:scale-95">
          <UserPlus className="w-4 h-4" />
          <span>Invite New Staff</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input 
            type="text" 
            placeholder="Search staff by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-white hover:bg-white/10 transition-all">
          <Filter className="w-4 h-4" />
          <span>Filters</span>
        </button>
      </div>

      {/* Staff Table/Grid */}
      <div className="glass-card rounded-3xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-muted-foreground animate-pulse">Synchronizing team data...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-6 py-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-4 text-sm font-medium text-muted-foreground uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredStaff.length > 0 ? (
                  filteredStaff.map((person, i) => (
                    <motion.tr 
                      key={person.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                            {person.users?.full_name?.charAt(0) || 'U'}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-white font-medium group-hover:text-primary transition-colors">{person.users?.full_name || 'Unnamed User'}</span>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail className="w-3 h-3" />
                              {person.users?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-primary/60" />
                          <span className="text-sm text-white/80">{person.role}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {person.is_active ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium border border-amber-500/20">
                            <Clock className="w-3 h-3" />
                            Inactive
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground font-light">
                        {new Date(person.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-muted-foreground hover:text-white transition-colors rounded-lg hover:bg-white/5">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-muted-foreground font-light italic">
                      No staff members found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
