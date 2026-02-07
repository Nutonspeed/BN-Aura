'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield,
  Users,
  Buildings,
  Gear,
  ChartBar,
  Lock,
  PencilSimple,
  Eye,
  X,
  IdentificationCard,
  CheckCircle,
  WarningCircle,
  Monitor,
  ShieldCheck,
  Pulse,
  CaretDown
} from '@phosphor-icons/react';
import { usePermissionsContext } from '../context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
    console.log('Editing user:', user);
  };

  const getRoleBadge = (roleId: string) => {
    switch (roleId) {
      case 'super_admin': 
        return <Badge variant="destructive" size="sm" className="font-black text-[8px] tracking-widest px-2 py-0.5 gap-1.5"><Shield weight="bold" className="w-3 h-3" /> SUPER_ADMIN</Badge>;
      case 'clinic_owner': 
        return <Badge variant="ghost" size="sm" className="bg-purple-500/10 text-purple-500 border-none font-black text-[8px] tracking-widest px-2 py-0.5 gap-1.5"><Buildings weight="bold" className="w-3 h-3" /> OWNER</Badge>;
      case 'clinic_admin': 
        return <Badge variant="primary" size="sm" className="font-black text-[8px] tracking-widest px-2 py-0.5 gap-1.5"><Users weight="bold" className="w-3 h-3" /> ADMIN</Badge>;
      case 'clinic_staff': 
        return <Badge variant="success" size="sm" className="font-black text-[8px] tracking-widest px-2 py-0.5 gap-1.5"><Gear weight="bold" className="w-3 h-3" /> STAFF</Badge>;
      case 'sales_staff': 
        return <Badge variant="warning" size="sm" className="font-black text-[8px] tracking-widest px-2 py-0.5 gap-1.5"><ChartBar weight="bold" className="w-3 h-3" /> SALES</Badge>;
      default: 
        return <Badge variant="secondary" size="sm" className="font-black text-[8px] tracking-widest px-2 py-0.5 gap-1.5"><Lock weight="bold" className="w-3 h-3" /> GUEST</Badge>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="rounded-[40px] border-border/50 shadow-premium overflow-hidden group">
        <CardHeader className="p-8 border-b border-border/50 bg-secondary/30 relative">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <ShieldCheck weight="fill" className="w-48 h-48 text-primary" />
          </div>
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
              <ShieldCheck weight="duotone" className="w-7 h-7" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black uppercase tracking-tight">Identity Access Hub</CardTitle>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-black mt-1">Global permission & role orchestration registry</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-secondary/20 border-b border-border/30">
                  <th className="px-8 py-5 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">Identity Node</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">Protocol Tier</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">Cluster Link</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">Custom Nodes</th>
                  <th className="px-8 py-5 text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest">Oversight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {users.map((user) => (
                  <tr key={user.userId} className="hover:bg-primary/[0.02] transition-colors group/row">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-secondary border border-border/50 flex items-center justify-center text-primary group-hover/row:bg-primary/10 transition-all shadow-inner">
                          <span className="text-sm font-black">{typeof user.userName === 'string' ? user.userName.charAt(0).toUpperCase() : '?'}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-foreground truncate uppercase tracking-tight">
                            {typeof user.userName === 'string' ? user.userName : String(user.userName || 'Unknown')}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-medium truncate italic">
                            {typeof user.email === 'string' ? user.email : String(user.email || 'Unknown')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {getRoleBadge(user.currentRole)}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Buildings weight="bold" className="w-3.5 h-3.5 opacity-40" />
                        <span className="text-xs font-bold uppercase tracking-tight">
                          {typeof user.clinicName === 'string' ? user.clinicName : String(user.clinicName || 'STANDALONE_NODE')}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-wrap gap-1.5">
                        {user.customPermissions && Array.isArray(user.customPermissions) && user.customPermissions.length > 0 ? (
                          user.customPermissions.map((permission, index) => (
                            <Badge
                              key={index}
                              variant="ghost"
                              className="bg-amber-500/5 text-amber-500 border border-amber-500/10 font-black text-[7px] tracking-tighter px-1.5"
                            >
                              {typeof permission === 'string' ? permission.toUpperCase() : String(permission).toUpperCase()}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-widest italic">Baseline</span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-end gap-2 opacity-40 group-hover/row:opacity-100 transition-opacity">
                        <Button variant="outline" size="sm" className="h-10 w-10 p-0 border-border/50 rounded-xl hover:bg-secondary">
                          <Eye weight="bold" className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-10 w-10 p-0 border-border/50 rounded-xl hover:bg-secondary text-primary"
                          onClick={() => handleEditUser(user)}
                        >
                          <PencilSimple weight="bold" className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Modal Protocol */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-card border border-border rounded-[40px] w-full max-w-md shadow-premium relative overflow-hidden group p-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                <ShieldCheck weight="fill" className="w-48 h-48 text-primary" />
              </div>

              <div className="relative z-10 space-y-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm shadow-inner">
                      <IdentificationCard weight="duotone" className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground tracking-tight uppercase leading-tight">Protocol Update</h3>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Modifying identity clearance node</p>
                    </div>
                  </div>
                  <Button variant="ghost" onClick={() => setEditingUser(null)} className="h-10 w-10 p-0 rounded-xl hover:bg-secondary">
                    <X weight="bold" className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-8">
                  <div className="p-6 bg-secondary/30 rounded-[32px] border border-border/50 shadow-inner group/user">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-card border border-border/50 flex items-center justify-center text-primary text-xl font-black group-hover/user:scale-110 transition-transform">
                        {editingUser.userName?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-bold text-foreground truncate uppercase tracking-tight">{editingUser.userName}</p>
                        <p className="text-[10px] text-muted-foreground font-medium italic truncate">{editingUser.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Assigned Protocol Tier</label>
                    <div className="relative group/input">
                      <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity rounded-xl" />
                      <select
                        className="w-full bg-secondary/30 border border-border rounded-2xl py-4 px-6 text-xs font-black uppercase tracking-widest text-foreground focus:border-primary outline-none transition-all appearance-none shadow-inner relative z-10"
                        value={editingUser.currentRole}
                        onChange={(e) => setEditingUser({...editingUser, currentRole: e.target.value})}
                      >
                        {roles.map((role) => (
                          <option key={role.id} value={role.id} className="bg-card">
                            {role.name.toUpperCase()}
                          </option>
                        ))}
                      </select>
                      <CaretDown weight="bold" className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none z-20" />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setEditingUser(null)}
                      className="flex-1 py-7 rounded-[24px] font-black uppercase tracking-widest text-[10px] border-border/50 hover:bg-secondary"
                    >
                      Abort
                    </Button>
                    <Button
                      className="flex-[2] py-7 rounded-[24px] font-black uppercase tracking-widest text-[10px] shadow-premium gap-3"
                      onClick={async () => {
                        // Keep original save logic
                        try {
                          const response = await fetch('/api/admin/permissions', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              action: 'updateUserRole',
                              userId: editingUser.userId,
                              newRole: editingUser.currentRole,
                              oldRole: users.find(u => u.userId === editingUser.userId)?.currentRole
                            }),
                          });
                          const result = await response.json();
                          if (result.success) {
                            setEditingUser(null);
                          } else {
                            alert('Failed to update user role: ' + result.error);
                          }
                        } catch (error) {
                          alert('Error updating user role');
                        }
                      }}
                    >
                      Commit Protocol
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}