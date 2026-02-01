'use client';

import { motion } from 'framer-motion';
import { Building2, Users, Calendar, BarChart3, Zap, Lock, Shield } from 'lucide-react';
import { usePermissionsContext } from '../context';

export default function PermissionsList() {
  const { permissions } = usePermissionsContext();

  const getPermissionIcon = (category: string) => {
    switch (category) {
      case 'Clinic': return <Building2 className="w-4 h-4 text-blue-400" />;
      case 'Staff': return <Users className="w-4 h-4 text-green-400" />;
      case 'Appointments': return <Calendar className="w-4 h-4 text-purple-400" />;
      case 'Reports': return <BarChart3 className="w-4 h-4 text-amber-400" />;
      case 'AI': return <Zap className="w-4 h-4 text-orange-400" />;
      case 'Sales': return <Shield className="w-4 h-4 text-cyan-400" />;
      default: return <Lock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Clinic': return 'bg-blue-500/20 text-blue-400';
      case 'Staff': return 'bg-green-500/20 text-green-400';
      case 'Appointments': return 'bg-purple-500/20 text-purple-400';
      case 'Reports': return 'bg-amber-500/20 text-amber-400';
      case 'AI': return 'bg-orange-500/20 text-orange-400';
      case 'Sales': return 'bg-cyan-500/20 text-cyan-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, typeof permissions>);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
        <div key={category} className="glass-card p-6 rounded-2xl border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            {getPermissionIcon(category)}
            <h3 className="text-lg font-bold text-white">{category} Permissions</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${getCategoryColor(category)}`}>
              {categoryPermissions.length} permissions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryPermissions.map((permission) => (
              <div
                key={permission.id}
                className="p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-white">{permission.name}</h4>
                  <code className="text-xs text-primary bg-primary/20 px-2 py-1 rounded">
                    {permission.id}
                  </code>
                </div>
                <p className="text-sm text-white/60">{permission.description}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  );
}
