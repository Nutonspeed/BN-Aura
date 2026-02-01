'use client';

import { motion } from 'framer-motion';
import { Shield, Users, Building2, Settings, BarChart3, Lock, Edit, Eye } from 'lucide-react';
import { usePermissionsContext } from '../context';

export default function UsersTable() {
  const { users, roles } = usePermissionsContext();

  const getRoleIcon = (roleId: string) => {
    switch (roleId) {
      case 'super_admin': return <Shield className="w-4 h-4 text-red-400" />;
      case 'clinic_owner': return <Building2 className="w-4 h-4 text-purple-400" />;
      case 'clinic_admin': return <Users className="w-4 h-4 text-blue-400" />;
      case 'clinic_staff': return <Settings className="w-4 h-4 text-green-400" />;
      case 'sales_staff': return <BarChart3 className="w-4 h-4 text-amber-400" />;
      default: return <Lock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl border border-white/10 overflow-hidden"
    >
      <div className="p-6 border-b border-white/10">
        <h2 className="text-xl font-bold text-white">User Role Assignments</h2>
        <p className="text-white/60 text-sm mt-1">Manage user roles and custom permissions</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-white/70 uppercase">User</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white/70 uppercase">Current Role</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white/70 uppercase">Clinic</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white/70 uppercase">Custom Permissions</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white/70 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((user) => (
              <tr key={user.userId} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-white">{user.userName}</p>
                    <p className="text-sm text-white/60">{user.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(user.currentRole)}
                    <span className="text-white text-sm">
                      {roles.find(r => r.id === user.currentRole)?.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-white/80 text-sm">
                    {user.clinicName || '-'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {user.customPermissions.length > 0 ? (
                      user.customPermissions.map((permission, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-lg"
                        >
                          {permission}
                        </span>
                      ))
                    ) : (
                      <span className="text-white/40 text-sm">None</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
