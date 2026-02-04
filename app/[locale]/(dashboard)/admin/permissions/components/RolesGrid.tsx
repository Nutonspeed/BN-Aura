'use client';

import { motion } from 'framer-motion';
import { Shield, Users, Buildings, Gear, ChartBar, Lock, PencilSimple, Trash, MagnifyingGlass } from '@phosphor-icons/react';
import { usePermissionsContext } from '../context';
import { Role } from '../types';

interface RolesGridProps {
  onEditRole: (role: Role) => void;
}

export default function RolesGrid({ onEditRole }: RolesGridProps) {
  const { roles, searchTerm, setSearchTerm } = usePermissionsContext();

  const getRoleIcon = (roleId: string) => {
    switch (roleId) {
      case 'super_admin': return <Shield className="w-5 h-5 text-red-400" />;
      case 'clinic_owner': return <Buildings className="w-5 h-5 text-purple-400" />;
      case 'clinic_admin': return <Users className="w-5 h-5 text-blue-400" />;
      case 'clinic_staff': return <Gear className="w-5 h-5 text-green-400" />;
      case 'sales_staff': return <ChartBar className="w-5 h-5 text-amber-400" />;
      default: return <Lock className="w-5 h-5 text-gray-400" />;
    }
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Search Bar */}
      <div className="relative">
        <MagnifyingGlass className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
        <input
          type="text"
          placeholder="Search roles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoles.map((role) => (
          <motion.div
            key={role.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 rounded-2xl border border-white/10 hover:border-primary/30 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {getRoleIcon(role.id)}
                <div>
                  <h3 className="font-bold text-white">{role.name}</h3>
                  <p className="text-xs text-white/60">
                    {role.userCount} users
                  </p>
                </div>
              </div>
              
              {!role.isSystem && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditRole(role)}
                    className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  >
                    <PencilSimple className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 text-white/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <p className="text-white/80 text-sm mb-4">{role.description}</p>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60">Permissions</span>
                <span className="text-xs text-primary font-bold">
                  {role.permissions.length === 1 && role.permissions[0] === '*' 
                    ? 'All Permissions' 
                    : `${role.permissions.length} permissions`}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-1">
                {role.permissions.slice(0, 3).map((permission, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-lg"
                  >
                    {permission === '*' ? 'All' : permission.split(':')[0]}
                  </span>
                ))}
                {role.permissions.length > 3 && (
                  <span className="px-2 py-1 bg-white/10 text-white/60 text-xs rounded-lg">
                    +{role.permissions.length - 3}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
