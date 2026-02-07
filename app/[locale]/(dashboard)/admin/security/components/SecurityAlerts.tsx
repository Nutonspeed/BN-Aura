'use client';

import { motion } from 'framer-motion';
import { 
  Warning,
  XCircle,
  Info,
  Pulse,
  ShieldCheck,
  Clock,
  CaretRight,
  ShieldWarning
} from '@phosphor-icons/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SecurityAlert {
  id: string;
  type: 'brute_force' | 'unusual_access' | 'data_breach' | 'malware' | 'phishing';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedUsers: number;
  timestamp: string;
  status: 'active' | 'investigating' | 'resolved';
}

interface SecurityAlertsProps {
  alerts: SecurityAlert[];
  onAlertClick?: (alert: SecurityAlert) => void;
}

export default function SecurityAlerts({ alerts, onAlertClick }: SecurityAlertsProps) {
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return <Badge variant="destructive" size="sm" className="font-black text-[8px] tracking-widest px-2.5 py-1 uppercase shadow-sm">CRITICAL_NODE</Badge>;
      case 'high': return <Badge variant="warning" size="sm" className="font-black text-[8px] tracking-widest px-2.5 py-1 uppercase shadow-sm">HIGH_ALERT</Badge>;
      case 'medium': return <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-none font-black text-[8px] tracking-widest px-2.5 py-1 uppercase">MEDIUM_VAL</Badge>;
      default: return <Badge variant="ghost" className="bg-primary/5 text-primary border-none font-black text-[8px] tracking-widest px-2.5 py-1 uppercase">NORMAL_SYNC</Badge>;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'JUST NOW';
    if (minutes < 60) return `${minutes}M AGO`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}H AGO`;
    const days = Math.floor(hours / 24);
    return `${days}D AGO`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="rounded-[40px] border-border/50 shadow-premium overflow-hidden group">
        <CardHeader className="p-8 border-b border-border/50 bg-secondary/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <ShieldWarning weight="fill" className="w-48 h-48 text-primary" />
          </div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm transition-all group-hover:bg-primary/20">
                <Warning weight="duotone" className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-black uppercase tracking-tight">Security Alerts</CardTitle>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Real-time anomaly detection nodes</p>
              </div>
            </div>
            <Badge variant="destructive" size="sm" className="font-black text-[10px] tracking-widest px-4 py-1.5 shadow-glow-sm">
              {alerts.filter(a => a.status === 'active').length} ACTIVE_PAYLOADS
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="p-8 md:p-10 space-y-4 relative z-10">
          {alerts.length === 0 ? (
            <div className="text-center py-12 bg-secondary/20 border-2 border-dashed border-border/50 rounded-[32px] opacity-40">
              <Pulse weight="duotone" className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
              <p className="text-xs font-black uppercase tracking-[0.2em]">Matrix Status: Nominal</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert, idx) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => onAlertClick?.(alert)}
                  className="p-6 bg-secondary/30 rounded-[32px] border border-border/50 hover:border-primary/30 transition-all group/alert cursor-pointer relative overflow-hidden shadow-inner"
                >
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/alert:opacity-100 transition-opacity" />
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                        {getSeverityBadge(alert.severity)}
                        <Badge variant={alert.status === 'active' ? 'destructive' : 'secondary'} className="font-black text-[8px] uppercase tracking-widest px-2 py-0.5">
                          {alert.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="text-base font-black text-foreground uppercase tracking-tight group-hover/alert:text-primary transition-colors">{alert.title}</h4>
                        <p className="text-[11px] text-muted-foreground font-medium italic leading-relaxed mt-1">{alert.description}</p>
                      </div>
                      <div className="flex items-center gap-6 text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                        <div className="flex items-center gap-2">
                          <Clock weight="bold" className="w-3 h-3" />
                          <span>{formatTime(alert.timestamp)}</span>
                        </div>
                        <div className="flex items-center gap-2 border-l border-border/50 pl-6">
                          <Pulse weight="bold" className="w-3 h-3" />
                          <span>{alert.affectedUsers} Affected Nodes</span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-10 w-10 p-0 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all self-end md:self-center border border-transparent hover:border-primary/20"
                    >
                      <CaretRight weight="bold" className="w-4 h-4 group-hover/alert:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}