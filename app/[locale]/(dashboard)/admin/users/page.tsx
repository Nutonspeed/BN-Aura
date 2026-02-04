'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
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
  PencilSimple
} from '@phosphor-icons/react';

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
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/management?type=users');
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data.users);
      } else {
        setError('Failed to load users');
      }
    } catch (err) {
      setError('Failed to load users');
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
        setSuccess('Status updated successfully');
      } else {
        setError(data.error || 'Failed to update status');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setIsProcessing(null);
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
      super_admin: { bg: 'bg-red-500/20 text-red-400', label: 'Super Admin' },
      premium_customer: { bg: 'bg-purple-500/20 text-purple-400', label: 'Premium' },
      free_user: { bg: 'bg-gray-500/20 text-gray-400', label: 'Free User' }
    };
    const config = configs[role] || configs.free_user;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold ${config.bg}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            User Management
          </h1>
          <p className="text-white/60 mt-1">Manage all system users and permissions</p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:brightness-110 transition-all flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create User
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4 text-red-400" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <p className="text-emerald-400">{success}</p>
          <button onClick={() => setSuccess(null)} className="ml-auto">
            <X className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="glass-card p-6 rounded-2xl border border-white/10">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <p className="text-white/60 text-sm mt-4">
          Showing {filteredUsers.length} of {users.length} users
        </p>
      </div>

      {/* Users Table */}
      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-white/70 uppercase">User</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white/70 uppercase">Role</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white/70 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white/70 uppercase">Created</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-white/70 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.slice(0, 20).map((user) => (
                <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-white/5">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        {user.role === 'super_admin' ? (
                          <Crown className="w-5 h-5 text-primary" />
                        ) : (
                          <Users className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white">{user.full_name || 'No Name'}</p>
                        <p className="text-sm text-white/60">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      user.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white/60">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        disabled={isProcessing === user.id}
                        onClick={() => handleUpdateStatus(user.id, user.is_active)}
                        className={`p-2 rounded-lg transition-all ${
                          user.is_active 
                            ? 'text-red-400 hover:bg-red-500/10' 
                            : 'text-emerald-400 hover:bg-emerald-500/10'
                        }`}
                        title={user.is_active ? 'Suspend User' : 'Activate User'}
                      >
                        {isProcessing === user.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : user.is_active ? (
                          <UserMinus className="w-4 h-4" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                      </button>
                      <button 
                        className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                        title="Edit User"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length > 20 && (
          <div className="p-4 text-center border-t border-white/10">
            <p className="text-white/60 text-sm">Showing first 20 of {filteredUsers.length} users</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
