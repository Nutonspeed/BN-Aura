'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Users, Buildings, Gear, ChartBar, Lock, PencilSimple, Trash, MagnifyingGlass, Funnel, Pulse, IdentificationBadge, Sparkle, Icon } from '@phosphor-icons/react';
import { usePermissionsContext } from '../context';
import { Role } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
      className="space-y-8"
    >
      {/* Search & Intelligence Controls */}
      <Card className="p-6 rounded-[32px] border-border/50 shadow-card relative overflow-hidden group">
        <div className="flex flex-col md:flex-row gap-6 relative z-10">
          <div className="relative flex-1 group/input">
            <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity rounded-xl" />
            <MagnifyingGlass weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors relative z-10" />
            <input
              type="text"
              placeholder="Query protocol role designation or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-secondary/50 border border-border rounded-2xl text-foreground focus:outline-none focus:border-primary transition-all shadow-inner relative z-10 font-bold"
            />
          </div>
          <Button variant="outline" className="gap-2 px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border-border/50 hover:bg-secondary shrink-0">
            <Funnel weight="bold" className="w-4 h-4" />
            Registry Filter
          </Button>
        </div>
      </Card>

      {/* Roles Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredRoles.map((role, idx) => (
          <motion.div
            key={role.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className="h-full border-border/50 hover:border-primary/30 transition-all group/role overflow-hidden flex flex-col shadow-card hover:shadow-premium">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover/role:scale-110 transition-transform duration-700 pointer-events-none">
                <Shield weight="fill" className="w-32 h-32 text-primary" />
              </div>

              <CardHeader className="pb-4 relative z-10">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-secondary border border-border/50 flex items-center justify-center text-primary group-hover/role:bg-primary/10 group-hover/role:border-primary/20 transition-all duration-500 shadow-inner">
                      {getRoleIcon(role.id)}
                    </div>
                    <div>
                      <h3 className="font-black text-foreground uppercase tracking-tight group-hover/role:text-primary transition-colors">{role.name}</h3>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-0.5 opacity-60">
                        {role.userCount} Active Nodes
                      </p>
                    </div>
                  </div>
                  
                  {!role.isSystem && (
                    <div className="flex gap-1 opacity-0 group-hover/role:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditRole(role)}
                        className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                      >
                        <PencilSimple weight="bold" className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-all"
                      >
                        <Trash weight="bold" className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-6 relative z-10 flex flex-col justify-between">
                <p className="text-xs text-muted-foreground font-medium italic leading-relaxed line-clamp-2 opacity-80">{role.description}</p>

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-t border-border/30 pt-4">
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Protocol Capacity</span>
                    <span className="text-[10px] font-bold text-primary tabular-nums">
                      {role.permissions.length === 1 && role.permissions[0] === '*' 
                        ? 'GLOBAL_ACCESS' 
                        : `${role.permissions.length} NODES_AUTHORIZED`}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5">
                    {role.permissions.slice(0, 3).map((permission, index) => (
                      <Badge
                        key={index}
                        variant="ghost"
                        className="px-2.5 py-1 bg-secondary/50 border border-border/50 text-foreground font-black text-[8px] uppercase tracking-tighter"
                      >
                        {permission === '*' ? 'GLOBAL' : permission.split(':')[0].toUpperCase()}
                      </Badge>
                    ))}
                    {role.permissions.length > 3 && (
                      <Badge variant="ghost" className="px-2.5 py-1 bg-primary/5 text-primary border-none font-black text-[8px] tracking-widest">
                        +{role.permissions.length - 3} MORE
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
