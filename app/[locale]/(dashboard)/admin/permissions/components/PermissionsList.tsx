'use client';

import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { 
  CaretRight,
  ShieldCheck,
  Pulse,
  Buildings,
  Users,
  CalendarDots,
  ChartBar,
  TrendUp,
  Shield,
  Lock
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { usePermissionsContext } from '../context';

export default function PermissionsList() {
  const { permissions } = usePermissionsContext();

  const getPermissionIcon = (category: string) => {
    switch (category) {
      case 'Clinic': return <Buildings className="w-4 h-4 text-blue-400" />;
      case 'Staff': return <Users className="w-4 h-4 text-green-400" />;
      case 'Appointments': return <CalendarDots className="w-4 h-4 text-purple-400" />;
      case 'Reports': return <ChartBar className="w-4 h-4 text-amber-400" />;
      case 'AI': return <TrendUp className="w-4 h-4 text-orange-400" />;
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
      className="space-y-10"
    >
      {Object.entries(groupedPermissions).map(([category, categoryPermissions], idx) => (
        <Card key={category} className="rounded-[40px] border-border/50 shadow-premium overflow-hidden group">
          <CardContent className="p-8 md:p-10 space-y-10">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm transition-all group-hover:bg-primary/20">
                  {getPermissionIcon(category)}
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight text-foreground">{category} Protocol</h3>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-1">Access control nodes for clinical operations</p>
                </div>
              </div>
              <Badge variant="ghost" className={cn("border-none font-black text-[10px] tracking-[0.2em] px-4 py-2 rounded-full uppercase shadow-sm", getCategoryColor(category))}>
                {categoryPermissions.length} NODES_ENABLED
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              {categoryPermissions.map((permission, pIdx) => (
                <motion.div
                  key={permission.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (idx * 0.1) + (pIdx * 0.05) }}
                  whileHover={{ y: -2 }}
                  className="p-6 bg-secondary/30 rounded-[32px] border border-border/50 hover:border-primary/30 transition-all flex flex-col justify-between group/perm shadow-inner"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <h4 className="font-bold text-foreground group-hover/perm:text-primary transition-colors uppercase tracking-tight leading-tight">{permission.name}</h4>
                      <Badge variant="ghost" className="font-mono text-[9px] text-primary/60 bg-primary/5 border-none px-2 py-0.5 tracking-tighter">
                        {permission.id}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium italic leading-relaxed opacity-80">{permission.description}</p>
                  </div>
                  
                  <div className="pt-5 mt-5 border-t border-border/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                      <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Active Link</span>
                    </div>
                    <CaretRight weight="bold" className="w-3 h-3 text-muted-foreground opacity-0 group-hover/perm:opacity-100 group-hover/perm:translate-x-1 transition-all" />
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Protocol Integrity Node */}
      <Card className="p-8 rounded-[40px] border-primary/10 bg-primary/[0.02] flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group shadow-inner">
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-primary/5 blur-[60px] rounded-full group-hover:bg-primary/10 transition-all duration-700" />
        <div className="w-16 h-16 rounded-[28px] bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner group-hover:scale-110 transition-transform">
          <ShieldCheck weight="duotone" className="w-8 h-8" />
        </div>
        <div className="flex-1 space-y-1 relative z-10 text-center md:text-left">
          <h4 className="text-[10px] font-black text-foreground uppercase tracking-[0.3em]">Protocol Verification Node</h4>
          <p className="text-xs text-muted-foreground font-medium italic leading-relaxed opacity-80">
            System permissions are strictly governed by the clinical orchestration layer. All modifications propagate across 128-bit encrypted neural channels.
          </p>
        </div>
        <Badge variant="success" size="sm" className="font-black text-[9px] tracking-[0.2em] px-5 py-2 rounded-full shadow-sm relative z-10">SECURE_PARITY</Badge>
      </Card>
    </motion.div>
  );
}
