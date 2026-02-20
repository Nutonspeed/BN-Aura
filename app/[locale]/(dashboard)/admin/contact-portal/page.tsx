'use client';

import { 
  ChatCircle,
  Users,
  EnvelopeSimple,
  Phone,
  Clock,
  Funnel,
  MagnifyingGlass,
  ArrowUpRight,
  CaretRight,
  Info,
  ShieldCheck,
  Pulse,
  CheckCircle,
  WarningCircle,
  UserList,
  Headset,
  Broadcast
} from '@phosphor-icons/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ContactPortalPage() {
  const { goBack } = useBackNavigation();
  const [activeTab, setActiveTab] = useState('messages');

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
            <Headset weight="duotone" className="w-4 h-4" />
            Communication Hub
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-foreground tracking-tight uppercase"
          >
            Contact <span className="text-primary">Portal</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            จัดการช่องทางติดต่อลูกค้าและการสนับสนุนคลินิก
          </motion.p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" className="gap-2 px-6 py-6 rounded-2xl text-xs font-black uppercase tracking-widest border-border/50">
            <UserList weight="bold" className="w-4 h-4" />
            Active Channels
          </Button>
          <Button className="gap-2 px-8 py-6 rounded-2xl text-xs font-black uppercase tracking-widest shadow-premium">
            <ChatCircle weight="bold" className="w-4 h-4" />
            Initialize Link
          </Button>
        </div>
      </div>

      {/* Stats Summary - Mini version */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-2">
        {[
          { label: 'Unread Payload', value: '12', icon: ChatCircle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
          { label: 'Dispatch Today', value: '45', icon: Pulse, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Cycle Resolve', value: '128', icon: CheckCircle, color: 'text-primary', bg: 'bg-primary/10' }
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

      {/* Navigation & Tab Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-2 bg-secondary/50 p-1.5 rounded-[24px] border border-border/50 w-full sm:w-auto">
          {[
            { id: 'messages', label: 'Inbound Stream', icon: ChatCircle },
            { id: 'contacts', label: 'Identity Registry', icon: Users },
            { id: 'support', label: 'Clinical Support', icon: Headset }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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

        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-xl" />
            <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Query identity..."
              className="bg-secondary/50 border border-border/50 rounded-2xl py-2.5 pl-11 pr-6 text-[10px] font-black uppercase tracking-widest text-foreground focus:outline-none focus:border-primary transition-all w-48 shadow-inner relative z-10"
            />
          </div>
          <Button variant="outline" size="sm" className="p-3 border-border/50 rounded-xl hover:bg-secondary transition-all">
            <Funnel weight="bold" className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content Node */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="px-2"
        >
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Quick Actions/Filter */}
            <div className="lg:col-span-1 space-y-8">
              <Card className="p-8 rounded-[40px] border-border shadow-card relative overflow-hidden group">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 blur-[60px] rounded-full group-hover:bg-primary/20 transition-all duration-700" />
                <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-3 mb-6 relative z-10">
                  <Info weight="duotone" className="w-5 h-5" />
                  Protocol Brief
                </h4>
                <div className="space-y-4 relative z-10">
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed italic border-l-2 border-primary/20 pl-4">
                    Monitor inbound intelligence streams and clinical support nodes across the entire network.
                  </p>
                  <div className="pt-4 space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      <span>Network Load</span>
                      <span className="text-emerald-500">Nominal</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden p-0.5 border border-border/50">
                      <div className="h-full w-[24%] bg-primary rounded-full shadow-glow-sm" />
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-8 rounded-[40px] border-primary/10 bg-primary/[0.02] space-y-6 group overflow-hidden">
                <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-3 relative z-10">
                  <Pulse weight="duotone" className="w-5 h-5" />
                  Fast-track Sync
                </h4>
                <div className="space-y-3 relative z-10">
                  <Button variant="outline" className="w-full justify-between px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-border/50 hover:bg-secondary group/btn">
                    Scan Registry <CaretRight weight="bold" className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                  <Button variant="outline" className="w-full justify-between px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-border/50 hover:bg-secondary group/btn">
                    Export Ledger <CaretRight weight="bold" className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </Card>
            </div>

            {/* Content Body Placeholder */}
            <div className="lg:col-span-3">
              <Card className="rounded-[40px] border-border shadow-premium overflow-hidden h-full min-h-[600px] flex items-center justify-center relative group">
                <div className="absolute inset-0 bg-scanner-grid opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none" />
                <div className="relative z-10 text-center space-y-8 p-10">
                  <div className="w-24 h-24 rounded-[48px] bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto shadow-glow-sm group-hover:scale-110 transition-transform duration-700">
                    <ChatCircle weight="duotone" className="w-10 h-10 text-primary animate-pulse" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Portal Node Alpha</h3>
                    <p className="text-sm text-muted-foreground font-medium max-w-sm mx-auto leading-relaxed italic">
                      Communication infrastructure is active. Identity synchronization and multi-channel protocol stream will manifest in this terminal node.
                    </p>
                  </div>
                  <Button className="px-10 py-6 rounded-2xl text-xs font-black uppercase tracking-widest shadow-premium gap-3">
                    Establish Link
                    <ArrowUpRight weight="bold" className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
