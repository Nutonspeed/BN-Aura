'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { SpinnerGap } from '@phosphor-icons/react';
import { PermissionsProvider, usePermissionsContext } from './context';
import PermissionsHeader from './components/PermissionsHeader';
import NavigationTabs from './components/NavigationTabs';
import RolesGrid from './components/RolesGrid';
import UsersTable from './components/UsersTable';
import PermissionsList from './components/PermissionsList';
import { Role } from './types';

function PermissionsContent() {
  const { loading, activeTab } = usePermissionsContext();
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const handleCreateRole = () => {
    setEditingRole({
      id: '',
      name: '',
      description: '',
      permissions: [],
      userCount: 0,
      isSystem: false
    });
    setShowCreateRole(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setShowCreateRole(true);
  };

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
      className="space-y-8"
    >
      <PermissionsHeader onCreateRole={handleCreateRole} />
      
      <NavigationTabs />

      {/* Tab Content */}
      {activeTab === 'roles' && (
        <RolesGrid onEditRole={handleEditRole} />
      )}

      {activeTab === 'users' && (
        <UsersTable />
      )}

      {activeTab === 'permissions' && (
        <PermissionsList />
      )}
    </motion.div>
  );
}

export default function PermissionsPage() {
  return (
    <PermissionsProvider>
      <PermissionsContent />
    </PermissionsProvider>
  );
}
