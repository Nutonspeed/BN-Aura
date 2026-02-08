'use client';

import { 
  SpinnerGap,
  ShieldCheck,
  Users,
  Key,
  Plus,
  ArrowLeft,
  Lock,
  IdentificationBadge,
  Pulse,
  Monitor,
  Gear,
  X,
  ArrowsClockwise
} from '@phosphor-icons/react';
import { PermissionsProvider, usePermissionsContext } from './context';
import RolesGrid from './components/RolesGrid';
import UsersTable from './components/UsersTable';
import PermissionsList from './components/PermissionsList';
import { Role } from './types';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function PermissionsContent() {
  const { goBack } = useBackNavigation();
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
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <SpinnerGap className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse text-xs uppercase tracking-widest text-center">
          กำลังประมวลผลข้อมูลสิทธิ์การใช้งาน...
        </p>
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
            <ShieldCheck weight="duotone" className="w-4 h-4" />
            Authority Management Node
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-foreground tracking-tight uppercase"
          >
            Roles & <span className="text-primary">Permissions</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            Orchestrating system access levels, clinical role definitions, and identity security.
          </motion.p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            onClick={handleCreateRole}
            className="gap-3 shadow-premium px-8 py-6 rounded-2xl text-xs font-black uppercase tracking-widest"
          >
            <Plus weight="bold" className="w-4 h-4" />
            Initialize Role Node
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-2">
        <div className="flex bg-secondary/50 border border-border/50 p-1.5 rounded-[24px] w-full sm:w-auto shadow-inner">
          {[
            { id: 'roles', label: 'Identity Roles', icon: ShieldCheck },
            { id: 'users', label: 'Active Users', icon: Users },
            { id: 'permissions', label: 'Permission Matrix', icon: Key }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {}} // Active tab handled by context via component internal links or props if needed
              className={cn(
                "flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest border whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground border-primary shadow-premium"
                  : "bg-transparent text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground"
              )}
            >
              <tab.icon weight={activeTab === tab.id ? "fill" : "bold"} className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
        
        <Badge variant="ghost" className="bg-primary/5 text-primary border-none font-black text-[10px] tracking-widest uppercase px-4 py-2">
          Secure Authority Hub
        </Badge>
      </div>

      {/* Content Hub */}
      <div className="px-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'roles' && (
              <RolesGrid onEditRole={handleEditRole} />
            )}

            {activeTab === 'users' && (
              <Card className="rounded-[40px] border-border/50 overflow-hidden shadow-premium">
                <CardHeader className="p-8 border-b border-border/50 bg-secondary/30">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                      <ShieldCheck weight="duotone" className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black uppercase tracking-tight">Identity Registry</CardTitle>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black mt-0.5">Assigned roles and access status</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <UsersTable />
                </CardContent>
              </Card>
            )}

            {activeTab === 'permissions' && (
              <PermissionsList />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
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
