'use client';

import { 
  Users,
  MagnifyingGlass,
  Plus,
  WarningCircle,
  CheckCircle,
  SpinnerGap,
  X,
  Crown,
  UserCheck,
  UserMinus,
  PencilSimple,
  IdentificationCard,
  ShieldCheck,
  Lightning,
  Funnel,
  CaretRight,
  UserList,
  Eye,
  ArrowsClockwise
} from '@phosphor-icons/react';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import ResponsiveTable from '@/components/ui/ResponsiveTable';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { cn } from '@/lib/utils';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'super_admin' | 'premium_customer' | 'free_user';
  tier: 'free' | 'premium' | 'clinical';
  clinic_id?: string;
  clinic_name?: string;
  is_active: boolean;
  created_at: string;
}

export default function UserManagementPage() {
  const { goBack } = useBackNavigation();
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    role: 'free_user' as 'super_admin' | 'premium_customer' | 'free_user',
    tier: 'free' as 'free' | 'premium' | 'clinical'
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/management?type=users');
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data.users);
      } else {
        setError('โหลดผู้ใช้ไม่สำเร็จ');
      }
    } catch (err) {
      setError('โหลดผู้ใช้ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUpdateStatus = async (userId: string, currentStatus: boolean) => {
    setIsProcessing(userId);
    try {
      const response = await fetch('/api/admin/management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateUserStatus',
          userId,
          status: !currentStatus
        })
      });
      const data = await response.json();
      if (data.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !currentStatus } : u));
        setSuccess('อัปเดตสถานะสำเร็จ');
      } else {
        setError(data.error || 'Failed to update status');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          fullName: formData.fullName,
          role: formData.role,
          tier: formData.tier
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(`User created successfully! ${data.tempPassword ? `Temporary password: ${data.tempPassword}` : ''}`);
        setShowCreateForm(false);
        setFormData({
          email: '',
          fullName: '',
          role: 'free_user',
          tier: 'free'
        });
        await fetchData(); // Refresh user list
      } else {
        setError(data.error || 'Failed to create user');
      }
    } catch (err) {
      setError('An error occurred while creating user');
    } finally {
      setCreateLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    const configs: Record<string, { bg: string; label: string }> = {
      super_admin: { bg: 'bg-red-500/10 text-red-500', label: 'ผู้ดูแลระบบ' },
      premium_customer: { bg: 'bg-purple-500/10 text-purple-500', label: 'พรีเมียม' },
      free_user: { bg: 'bg-secondary text-muted-foreground', label: 'ผู้ใช้ฟรี' }
    };
    const config = configs[role] || configs.free_user;
    return (
      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.bg}`}>
        {config.label}
      </span>
    );
  };

  const columns = [
    {
      header: 'User',
      accessor: (user: User) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            {user.role === 'super_admin' ? (
              <Crown className="w-5 h-5" />
            ) : (
              <Users className="w-5 h-5" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate">{user.full_name || 'No Name'}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Role',
      accessor: (user: User) => getRoleBadge(user.role)
    },
    {
      header: 'Status',
      accessor: (user: User) => (
        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          user.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
        }`}>
          {user.is_active ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      header: 'Created',
      accessor: (user: User) => (
        <p className="text-sm text-muted-foreground">
          {new Date(user.created_at).toLocaleDateString()}
        </p>
      )
    },
    {
      header: 'Actions',
      className: 'text-right',
      accessor: (user: User) => (
        <div className="flex items-center justify-end gap-2">
          <button 
            disabled={isProcessing === user.id}
            onClick={(e) => {
              e.stopPropagation();
              handleUpdateStatus(user.id, user.is_active);
            }}
            className={`p-2 rounded-lg transition-all border border-border bg-secondary ${
              user.is_active 
                ? 'text-red-500 hover:bg-red-500/10' 
                : 'text-emerald-500 hover:bg-emerald-500/10'
            }`}
            title={user.is_active ? 'Suspend User' : 'Activate User'}
          >
            {isProcessing === user.id ? (
              <SpinnerGap className="w-4 h-4 animate-spin" />
            ) : user.is_active ? (
              <UserMinus className="w-4 h-4" />
            ) : (
              <UserCheck className="w-4 h-4" />
            )}
          </button>
          <button 
            onClick={(e) => e.stopPropagation()}
            className="p-2 bg-secondary border border-border text-muted-foreground hover:text-foreground rounded-lg transition-all"
            title="Edit User"
          >
            <PencilSimple className="w-4 h-4" />
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
            <Users weight="duotone" className="w-4 h-4" />
            จัดการผู้ใช้
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-foreground tracking-tight uppercase"
          >
            Network <span className="text-primary">Entities</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            จัดการผู้ใช้ระบบ สิทธิ์การเข้าถึง และข้อมูลรับรอง
          </motion.p>
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="gap-3 shadow-premium px-8 py-6 rounded-2xl text-xs font-black uppercase tracking-widest"
          >
            <Plus weight="bold" className="w-4 h-4" />
            <span>สร้างผู้ใช้</span>
          </Button>
        </motion.div>
      </div>

      {/* Stats Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-2">
        <StatCard
          title="ผู้ใช้ทั้งหมด"
          value={users.length}
          icon={Users}
          className="p-4"
        />
        <StatCard
          title="ผู้ใช้ที่ใช้งาน"
          value={users.filter(u => u.is_active).length}
          icon={UserCheck}
          trend="up"
          change={4.2}
          className="p-4"
        />
        <StatCard
          title="ผู้ดูแลระบบ"
          value={users.filter(u => u.role === 'super_admin').length}
          icon={Crown}
          iconColor="text-red-500"
          className="p-4"
        />
        <StatCard
          title="เซสชันที่ใช้งาน"
          value={Math.floor(users.length * 0.4)}
          icon={Lightning}
          iconColor="text-emerald-500"
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

      {/* Search & Intelligence Controls */}
      <div className="px-2">
        <Card className="p-6 rounded-[32px] border-border/50 shadow-card">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative flex-1 group">
              <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-xl" />
              <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ อีเมล หรือบทบาท..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-2xl py-3.5 pl-12 pr-4 text-sm text-foreground focus:outline-none focus:border-primary transition-all shadow-inner relative z-10"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border-border/50 hover:bg-secondary">
                <Funnel weight="bold" className="w-4 h-4" />
                Filters
              </Button>
              <Button variant="outline" onClick={() => fetchData()} className="p-3.5 border-border/50 rounded-2xl hover:bg-secondary transition-all">
                <ArrowsClockwise weight="bold" className={cn("w-4 h-4", loading && "animate-spin")} />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Create User Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateForm(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-card border border-border rounded-3xl p-8 w-full max-w-md shadow-premium"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-foreground uppercase tracking-tight">สร้างผู้ใช้</h3>
                  <p className="text-sm text-muted-foreground mt-1">สร้างผู้ใช้ใหม่พร้อมข้อมูลรับรอง</p>
                </div>

                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Email Address</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-secondary border border-border rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-all"
                      placeholder="user@domain.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      className="w-full bg-secondary border border-border rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-all"
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Access Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
                      className="w-full bg-secondary border border-border rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-all"
                    >
                      <option value="free_user">Free User</option>
                      <option value="premium_customer">Premium Customer</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Service Tier</label>
                    <select
                      value={formData.tier}
                      onChange={(e) => setFormData(prev => ({ ...prev, tier: e.target.value as any }))}
                      className="w-full bg-secondary border border-border rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-all"
                    >
                      <option value="free">Free</option>
                      <option value="premium">Premium</option>
                      <option value="clinical">Clinical</option>
                    </select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateForm(false)}
                      className="flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest"
                      disabled={createLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest gap-2"
                      disabled={createLoading}
                    >
                      {createLoading ? (
                        <>
                          <SpinnerGap className="w-4 h-4 animate-spin" />
                          Initializing...
                        </>
                      ) : (
                        <>
                          <Plus weight="bold" className="w-4 h-4" />สร้าง</>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Users Table */}
      <div className="px-2">
        <Card className="rounded-[40px] border-border/50 overflow-hidden shadow-premium">
          <ResponsiveTable
            columns={columns}
            data={filteredUsers}
            loading={loading}
            rowKey={(user) => user.id}
            emptyMessage="ไม่พบผู้ใช้ในระบบ"
            mobileCard={(user) => (
              <div className="space-y-5">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-secondary border border-border flex items-center justify-center text-primary shadow-inner">
                      {user.role === 'super_admin' ? (
                        <Crown weight="duotone" className="w-7 h-7 text-red-500" />
                      ) : (
                        <Users weight="duotone" className="w-7 h-7" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-foreground truncate uppercase tracking-tight">{user.full_name || 'ไม่ระบุชื่อ'}</p>
                      <p className="text-[10px] font-black text-muted-foreground truncate uppercase tracking-widest">{user.email}</p>
                    </div>
                  </div>
                  {getRoleBadge(user.role)}
                </div>
                
                <div className="grid grid-cols-2 gap-6 py-4 border-y border-border/50">
                  <div>
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">วันที่สร้าง</p>
                    <p className="text-xs font-bold text-foreground tabular-nums">{new Date(user.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Status</p>
                    <Badge variant={user.is_active ? 'success' : 'destructive'} size="sm" className="font-black text-[8px] uppercase tracking-widest px-2">
                      {user.is_active ? 'OPERATIONAL' : 'OFFLINE'}
                    </Badge>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-1.5 h-1.5 rounded-full", user.is_active ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-muted")} />
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{user.tier} ระดับ</span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      disabled={isProcessing === user.id}
                      onClick={() => handleUpdateStatus(user.id, user.is_active)}
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-10 w-10 p-0 border-border/50 rounded-xl transition-all",
                        user.is_active ? 'text-rose-500 hover:bg-rose-500/10' : 'text-emerald-500 hover:bg-emerald-500/10'
                      )}
                    >
                      {isProcessing === user.id ? (
                        <SpinnerGap weight="bold" className="w-4 h-4 animate-spin" />
                      ) : user.is_active ? (
                        <UserMinus weight="bold" className="w-4 h-4" />
                      ) : (
                        <UserCheck weight="bold" className="w-4 h-4" />
                      )}
                    </Button>
                    <Button variant="outline" size="sm" className="h-10 w-10 p-0 border-border/50 rounded-xl hover:bg-secondary">
                      <PencilSimple weight="bold" className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          />
        </Card>
      </div>
    </motion.div>
  );
}
