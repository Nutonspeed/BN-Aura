'use client';

import { Megaphone, PaperPlaneTilt, Clock, Broadcast, Plus, Info, CaretRight, Trash, PencilSimple, Globe, ShieldCheck, SpinnerGap, Pulse, X, CheckCircle, WarningCircle, UserList } from '@phosphor-icons/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { BroadcastProvider, useBroadcastContext } from './context';
import BroadcastHeader from './components/BroadcastHeader';
import ComposeMessage from './components/ComposeMessage';
import MessagesList from './components/MessagesList';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { motion } from 'framer-motion';

function BroadcastContent() {
  const { goBack } = useBackNavigation();
  const { fetchMessages, fetchClinics } = useBroadcastContext();

  useEffect(() => {
    fetchMessages();
    fetchClinics();
  }, [fetchMessages, fetchClinics]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10 pb-20 font-sans"
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
            <Broadcast weight="duotone" className="w-4 h-4" />
            Neural Broadcast Node
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-foreground tracking-tight uppercase"
          >
            Global <span className="text-primary">Broadcast</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            Orchestrating system-wide transmissions and cross-cluster communications.
          </motion.p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" className="gap-2 px-6 py-6 rounded-2xl text-xs font-black uppercase tracking-widest border-border/50">
            <UserList weight="bold" className="w-4 h-4" />
            Recipients Cluster
          </Button>
          <Button className="gap-2 px-8 py-6 rounded-2xl text-xs font-black uppercase tracking-widest shadow-premium">
            <Pulse weight="bold" className="w-4 h-4" />
            Active Channels
          </Button>
        </div>
      </div>

      {/* Stats Summary - Mini version */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-2">
        {[
          { label: 'Dispatch Velocity', value: '1.2ms', icon: Pulse, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Network Reach', value: '24 Nodes', icon: Globe, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Success Quota', value: '99.9%', icon: CheckCircle, color: 'text-blue-500', bg: 'bg-blue-500/10' }
        ].map((stat, i) => (
          <Card key={i} className="p-6 border-border/50 hover:border-primary/30 transition-all group overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform">
              <stat.icon weight="fill" className="w-16 h-16 text-primary" />
            </div>
            <div className="flex items-center gap-5 relative z-10">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border border-border/50 shadow-inner", stat.bg, stat.color)}>
                <stat.icon weight="duotone" className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                <p className="text-xl font-black text-foreground">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 px-2">
        <div className="lg:col-span-2 space-y-10">
          {/* Compose Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xl font-black text-foreground uppercase tracking-tight flex items-center gap-3">
                <PaperPlaneTilt weight="bold" className="w-5 h-5 text-primary" />
                Transmission Uplink
              </h3>
              <Badge variant="ghost" className="bg-primary/5 text-primary border-none font-black text-[10px] tracking-widest uppercase px-4 py-1.5">New Payload</Badge>
            </div>
            <Card className="rounded-[40px] border-primary/20 shadow-premium overflow-hidden">
              <CardContent className="p-8">
                <ComposeMessage />
              </CardContent>
            </Card>
          </div>

          {/* History Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xl font-black text-foreground uppercase tracking-tight flex items-center gap-3">
                <Clock weight="bold" className="w-5 h-5 text-primary" />
                Transmission Registry
              </h3>
              <Badge variant="ghost" className="bg-secondary text-muted-foreground border-none font-black text-[10px] tracking-widest uppercase px-4 py-1.5">Historical Node</Badge>
            </div>
            <MessagesList />
          </div>
        </div>

        {/* Sidebar Info/Status */}
        <div className="space-y-8">
          <Card className="p-8 rounded-[40px] border-border shadow-card relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 blur-[60px] rounded-full group-hover:bg-primary/20 transition-all duration-700" />
            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-3 mb-6 relative z-10">
              <Info weight="duotone" className="w-5 h-5" />
              Protocol Brief
            </h4>
            <div className="space-y-4 relative z-10">
              <p className="text-xs text-muted-foreground font-medium leading-relaxed italic border-l-2 border-primary/20 pl-4">
                Broadcast payloads are synchronized across all connected clinical nodes in the selected cluster.
              </p>
              <div className="pt-4 space-y-3">
                <div className="flex items-center gap-3 text-[10px] font-black text-foreground uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Real-time Synchronization
                </div>
                <div className="flex items-center gap-3 text-[10px] font-black text-foreground uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Multi-cluster Support
                </div>
                <div className="flex items-center gap-3 text-[10px] font-black text-foreground uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  End-to-End Encryption
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-8 rounded-[40px] border-rose-500/10 bg-rose-500/[0.02] space-y-4 group">
            <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-[0.3em] flex items-center gap-3">
              <ShieldCheck weight="duotone" className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Safety Override
            </h4>
            <p className="text-xs text-muted-foreground italic font-medium leading-relaxed">
              Verify transmission payload content before final execution. Operations cannot be reversed once distributed to the cluster.
            </p>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

export default function BroadcastPage() {
  return (
    <BroadcastProvider>
      <BroadcastContent />
    </BroadcastProvider>
  );
}
