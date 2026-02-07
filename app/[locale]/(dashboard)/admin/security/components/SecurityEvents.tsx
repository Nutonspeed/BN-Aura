'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Pulse,
  CheckCircle,
  XCircle,
  Warning,
  User,
  Globe,
  Clock,
  MapPin,
  Monitor,
  ShieldCheck,
  Icon
} from '@phosphor-icons/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import ResponsiveTable from '@/components/ui/ResponsiveTable';

interface SecurityEvent {
  id: string;
  type: 'login' | 'password_change' | '2fa_enabled' | 'suspicious' | 'security_alert';
  user: string;
  email: string;
  ip: string;
  location: string;
  timestamp: string;
  status: 'success' | 'failed' | 'warning' | 'critical';
  details: string;
}

interface SecurityEventsProps {
  events: SecurityEvent[];
}

export default function SecurityEvents({ events }: SecurityEventsProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'warning': return <Warning className="w-4 h-4 text-yellow-400" />;
      case 'critical': return <Pulse className="w-4 h-4 text-red-400" />;
      default: return <Pulse className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const columns = [
    {
      header: 'Event Node',
      accessor: (event: SecurityEvent) => (
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm transition-all duration-500",
            event.status === 'critical' ? "bg-rose-500/10 border-rose-500/20 text-rose-500" :
            event.status === 'warning' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
            "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
          )}>
            <Pulse weight="duotone" className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-foreground truncate uppercase tracking-tight leading-tight">{event.type.replace('_', ' ')}</p>
            <p className="text-[10px] text-muted-foreground font-medium truncate italic leading-relaxed opacity-60">{event.details}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Identity origin',
      accessor: (event: SecurityEvent) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground shadow-inner">
            <User weight="bold" className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground truncate">{event.user}</p>
            <p className="text-[9px] text-muted-foreground truncate font-mono uppercase opacity-60">{event.email}</p>
          </div>
        </div>
      )
    },
    {
      header: 'IP Network',
      accessor: (event: SecurityEvent) => (
        <div className="flex items-center gap-2">
          <Monitor weight="duotone" className="w-4 h-4 text-primary/60" />
          <code className="text-[10px] font-mono font-bold text-primary/80">{event.ip}</code>
        </div>
      )
    },
    {
      header: 'Coordinate',
      accessor: (event: SecurityEvent) => (
        <div className="flex items-center gap-2">
          <MapPin weight="bold" className="w-3.5 h-3.5 text-muted-foreground/40" />
          <span className="text-xs font-bold text-foreground uppercase tracking-tight truncate">{event.location}</span>
        </div>
      )
    },
    {
      header: 'Temporal',
      accessor: (event: SecurityEvent) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock weight="bold" className="w-3.5 h-3.5 opacity-40" />
          <span className="text-[10px] font-bold tabular-nums uppercase tracking-widest">{formatTime(event.timestamp)}</span>
        </div>
      )
    },
    {
      header: 'Integrity',
      accessor: (event: SecurityEvent) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(event.status)}
          <span className={cn("text-[9px] font-black uppercase tracking-widest",
            event.status === 'success' ? "text-emerald-500" : 
            event.status === 'failed' || event.status === 'critical' ? "text-rose-500" : 
            "text-amber-500"
          )}>{event.status}</span>
        </div>
      )
    }
  ];

  return (
    <Card className="rounded-[40px] border-border/50 shadow-premium overflow-hidden group">
      <CardHeader className="p-8 border-b border-border/50 bg-secondary/30 relative">
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
          <ShieldCheck weight="fill" className="w-48 h-48 text-primary" />
        </div>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm transition-all group-hover:bg-primary/20">
              <Pulse weight="duotone" className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-black uppercase tracking-tight">Security Event Registry</CardTitle>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-black mt-1">Global audit log of neural identity transmissions</p>
            </div>
          </div>
          <Badge variant="ghost" className="bg-primary/5 text-primary border-none font-black text-[10px] tracking-widest uppercase px-4 py-1.5">
            {events.length} NODES_LOGGED
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ResponsiveTable
          columns={columns}
          data={events}
          rowKey={(e) => e.id}
          emptyMessage="Zero security events detected in current operational matrix."
          mobileCard={(event) => (
            <div className="space-y-5">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl border flex items-center justify-center shadow-inner",
                    event.status === 'critical' ? "bg-rose-500/10 border-rose-500/20 text-rose-500" :
                    event.status === 'warning' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                    "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                  )}>
                    <Pulse weight="duotone" className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-foreground truncate uppercase tracking-tight leading-tight">{event.type.replace('_', ' ')}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={event.status === 'critical' ? 'destructive' : event.status === 'warning' ? 'warning' : 'success'} size="sm" className="font-black text-[7px] tracking-widest px-1.5 py-0.5 uppercase shadow-sm">
                        {event.status}
                      </Badge>
                      <span className="text-[9px] font-mono text-muted-foreground opacity-60">ID-{event.id.slice(0, 4).toUpperCase()}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Temporal Node</p>
                  <p className="text-[10px] font-black text-foreground tabular-nums tracking-widest">{formatTime(event.timestamp)}</p>
                </div>
              </div>
              
              <div className="p-4 bg-secondary/30 rounded-2xl border border-border/50 shadow-inner group-hover/row:border-primary/20 transition-all">
                <p className="text-[10px] text-muted-foreground font-medium italic leading-relaxed">{event.details}</p>
              </div>

              <div className="grid grid-cols-2 gap-6 py-4 border-y border-border/20">
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em]">Identity Origin</p>
                  <p className="text-xs font-bold text-foreground truncate">{event.user}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em]">Coordinate</p>
                  <p className="text-xs font-bold text-foreground truncate uppercase">{event.location}</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-1">
                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  <Monitor weight="bold" className="w-3.5 h-3.5 opacity-40" />
                  IP_{event.ip}
                </div>
                <Badge variant="ghost" className="bg-primary/5 text-primary border-none font-mono text-[8px] px-2 py-0.5 tracking-tighter uppercase">Verified_Node</Badge>
              </div>
            </div>
          )}
        />
      </CardContent>
    </Card>
  );
}
