'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Buildings, Gear, ChartBar, Lock, PencilSimple, Eye, X } from '@phosphor-icons/react';
import { usePermissionsContext } from '../context';

interface User {
  userId: string;
  userName: string | any;
  email: string | any;
  currentRole: string;
  clinicName?: string | any;
  customPermissions?: string[] | any;
}

export default function UsersTable() {
  const { users, roles } = usePermissionsContext();
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    // TODO: Open edit modal or navigate to edit page
    console.log('Editing user:', user);
  };

  const getRoleIcon = (roleId: string) => {
    switch (roleId) {
      case 'super_admin': return <Shield className="w-4 h-4 text-red-400" />;
      case 'clinic_owner': return <Buildings className="w-4 h-4 text-purple-400" />;
      case 'clinic_admin': return <Users className="w-4 h-4 text-blue-400" />;
      case 'clinic_staff': return <Gear className="w-4 h-4 text-green-400" />;
      case 'sales_staff': return <ChartBar className="w-4 h-4 text-amber-400" />;
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
                    <p className="font-medium text-white">
                      {typeof user.userName === 'string' ? user.userName : String(user.userName || 'Unknown')}
                    </p>
                    <p className="text-sm text-white/60">
                      {typeof user.email === 'string' ? user.email : String(user.email || 'Unknown')}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(user.currentRole)}
                    <span className="text-white text-sm">
                      {(() => {
                        const role = roles.find(r => r.id === user.currentRole);
                        return role && typeof role.name === 'string' ? role.name : String(role?.name || 'Unknown');
                      })()}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-white/80 text-sm">
                    {typeof user.clinicName === 'string' ? user.clinicName : String(user.clinicName || '-')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {user.customPermissions && Array.isArray(user.customPermissions) && user.customPermissions.length > 0 ? (
                      user.customPermissions.map((permission, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-lg"
                        >
                          {typeof permission === 'string' ? permission : String(permission)}
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
                    <button 
                      className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                      onClick={() => handleEditUser(user)}
                    >
                      <PencilSimple className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setEditingUser(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card p-6 rounded-2xl border border-white/10 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Edit User Role</h3>
              <button
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                onClick={() => setEditingUser(null)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">User</label>
                <div className="text-white">{editingUser.userName}</div>
                <div className="text-sm text-white/60">{editingUser.email}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Current Role</label>
                <select
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                  value={editingUser.currentRole}
                  onChange={(e) => setEditingUser({...editingUser, currentRole: e.target.value})}
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id} className="bg-gray-800">
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg transition-all"
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded-lg transition-all"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/admin/permissions', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          action: 'updateUserRole',
                          userId: editingUser.userId,
                          newRole: editingUser.currentRole,
                          oldRole: users.find(u => u.userId === editingUser.userId)?.currentRole
                        }),
                      });

                      const result = await response.json();
                      
                      if (result.success) {
                        console.log('User role updated successfully:', result);
                        // TODO: Refresh the users list
                        setEditingUser(null);
                      } else {
                        console.error('Failed to update user role:', result.error);
                        alert('Failed to update user role: ' + result.error);
                      }
                    } catch (error) {
                      console.error('Error updating user role:', error);
                      alert('Error updating user role');
                    }
                  }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
