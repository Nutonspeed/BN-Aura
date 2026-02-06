'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Megaphone, Bell, Info, ArrowRight, CaretRight, Trash, PencilSimple, Globe, Lock, ShieldCheck, SpinnerGap, Pulse, X, Clock } from '@phosphor-icons/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { AnnouncementProvider, useAnnouncementContext } from './context';
import AnnouncementsHeader from './components/AnnouncementsHeader';
import AnnouncementForm from './components/AnnouncementForm';
import AnnouncementsList from './components/AnnouncementsList';
import { cn } from '@/lib/utils';

function AnnouncementsContent() {
  const { goBack } = useBackNavigation();
  const { fetchAnnouncements, fetchClinics } = useAnnouncementContext();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
    fetchClinics();
  }, [fetchAnnouncements, fetchClinics]);

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
            <Megaphone weight="duotone" className="w-4 h-4" />
            Global Communications
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-foreground tracking-tight uppercase"
          >
            System <span className="text-primary">Announcements</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            Orchestrating system-wide broadcasts and cluster-level updates.
          </motion.p>
        </div>
        
        {!showForm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button 
              onClick={() => setShowForm(true)}
              className="gap-3 shadow-premium px-8 py-6 rounded-2xl text-xs font-black uppercase tracking-widest"
            >
              <Plus weight="bold" className="w-4 h-4" />
              <span>Initialize Broadcast</span>
            </Button>
          </motion.div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {showForm ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="rounded-[40px] border-primary/20 shadow-premium overflow-hidden">
              <CardHeader className="p-8 border-b border-border/50 bg-primary/5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                    <Plus weight="bold" className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black uppercase tracking-tight text-foreground">Draft Announcement</CardTitle>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black mt-0.5">Initialize transmission parameters</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="h-10 w-10 p-0 rounded-xl hover:bg-secondary">
                  <X weight="bold" className="w-5 h-5" />
                </Button>
              </CardHeader>
              <CardContent className="p-8">
                <AnnouncementForm onClose={() => setShowForm(false)} />
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-10"
          >
            {/* Stats Summary - Mini version */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { label: 'Active Streams', value: '4', icon: Pulse, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { label: 'Pending Dispatch', value: '2', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                { label: 'Total Transmission', value: '128', icon: Globe, color: 'text-primary', bg: 'bg-primary/10' }
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

            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-black text-foreground uppercase tracking-tight flex items-center gap-3">
                  <Bell weight="bold" className="w-5 h-5 text-primary" />
                  Transmission Registry
                </h3>
                <Badge variant="ghost" className="bg-primary/5 text-primary border-none font-black text-[10px] tracking-widest uppercase px-4">Live Hub</Badge>
              </div>
              <AnnouncementsList />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function AnnouncementsPage() {
  return (
    <AnnouncementProvider>
      <AnnouncementsContent />
    </AnnouncementProvider>
  );
}
