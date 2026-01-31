'use client';

import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  User,
  MoreHorizontal,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AppointmentPage() {
  const appointments = [
    {
      id: 1,
      time: '09:00 AM',
      customer: 'Thanaporn S.',
      service: 'Pico Rejuvenation',
      status: 'Confirmed',
      doctor: 'Dr. Sarah'
    },
    {
      id: 2,
      time: '10:30 AM',
      customer: 'Kitti P.',
      service: 'Botox Wrinkle',
      status: 'Pending',
      doctor: 'Dr. Sarah'
    },
    {
      id: 3,
      time: '01:00 PM',
      customer: 'Nattaya R.',
      service: 'HIFU Ultra Lift',
      status: 'Confirmed',
      doctor: 'Dr. Sarah'
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10 pb-20 font-sans"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-[0.3em]"
          >
            <Calendar className="w-4 h-4" />
            Temporal Orchestration
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-white uppercase tracking-tight"
          >
            Appointment <span className="text-primary text-glow">Calendar</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            Scheduling clinical transformations and cognitive consultations.
          </motion.p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-[0.1em] shadow-premium hover:brightness-110 transition-all active:scale-95 text-xs"
        >
          <Plus className="w-4 h-4 stroke-[3px]" />
          <span>New Appointment Node</span>
        </motion.button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
        {/* Simple Calendar Sidebar */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-premium p-8 rounded-[40px] border border-white/10 space-y-8 h-fit relative overflow-hidden group"
        >
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-primary/10 blur-[50px] rounded-full group-hover:bg-primary/20 transition-all duration-700" />
          
          <div className="flex items-center justify-between border-b border-white/5 pb-6 relative z-10">
            <h3 className="text-lg font-black text-white uppercase tracking-tight">January 2026</h3>
            <div className="flex gap-2">
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-muted-foreground hover:text-white transition-all"><ChevronLeft className="w-4 h-4" /></motion.button>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-muted-foreground hover:text-white transition-all"><ChevronRight className="w-4 h-4" /></motion.button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-2 text-center relative z-10">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
              <span key={day} className="text-[10px] font-black text-muted-foreground py-2 opacity-40 uppercase tracking-widest">{day}</span>
            ))}
            {Array.from({ length: 31 }).map((_, i) => (
              <motion.button 
                key={i} 
                whileHover={{ scale: 1.1 }}
                className={cn(
                  "aspect-square text-[11px] font-bold rounded-xl flex items-center justify-center transition-all border",
                  i + 1 === 30 
                    ? "bg-primary text-primary-foreground border-primary shadow-[0_0_15px_rgba(var(--primary),0.4)]" 
                    : "text-white/60 border-transparent hover:bg-white/5 hover:border-white/10"
                )}
              >
                {i + 1}
              </motion.button>
            ))}
          </div>

          <div className="pt-8 border-t border-white/5 space-y-6 relative z-10">
            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Asset Status</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between px-4 py-3 bg-white/5 rounded-2xl border border-white/5 group hover:border-emerald-500/30 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
                  <span className="text-[11px] font-black text-white uppercase tracking-widest">Room 101</span>
                </div>
                <span className="text-[9px] font-bold text-emerald-400 opacity-60">Operational</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 bg-white/5 rounded-2xl border border-white/5 group hover:border-primary/30 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.6)] animate-pulse" />
                  <span className="text-[11px] font-black text-white uppercase tracking-widest">Laser Suite A</span>
                </div>
                <span className="text-[9px] font-bold text-primary opacity-60">Reserved</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Schedule List */}
        <div className="xl:col-span-3 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-3 text-muted-foreground overflow-x-auto pb-4 scrollbar-hide"
          >
            {['All Cycles', 'Validated', 'Awaiting', 'Exceptions', 'Executed'].map((tab, i) => (
              <button 
                key={tab} 
                className={cn(
                  "px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all border",
                  i === 0 
                    ? "bg-primary/10 text-primary border-primary/30 shadow-sm" 
                    : "bg-white/5 border-white/5 hover:bg-white/10 hover:text-white"
                )}
              >
                {tab}
              </button>
            ))}
          </motion.div>

          <div className="space-y-5">
            {appointments.map((apt, i) => (
              <motion.div
                key={apt.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                whileHover={{ x: 5 }}
                className="glass-premium p-8 rounded-[40px] border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-8 hover:border-primary/30 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-primary/0 group-hover:bg-primary transition-all" />
                
                <div className="flex items-center gap-8">
                  <div className="w-24 text-center space-y-1">
                    <p className="text-lg font-black text-white group-hover:text-primary transition-colors tracking-tighter">{apt.time}</p>
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Start Phase</p>
                  </div>
                  
                  <div className="h-14 w-px bg-white/10 hidden md:block" />

                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover:bg-primary/10 transition-all duration-500">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <h3 className="text-xl font-black text-white tracking-tight">{apt.customer}</h3>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{apt.service}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-8 lg:gap-12">
                  <div className="flex flex-col items-end space-y-1">
                    <div className="flex items-center gap-2 text-sm font-black text-white/80">
                      <Clock className="w-4 h-4 text-primary/60" />
                      <span className="tabular-nums">45m</span>
                    </div>
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Cycle Period</span>
                  </div>

                  <div className={cn(
                    "px-5 py-2 rounded-full border text-[10px] font-black uppercase tracking-[0.2em] shadow-sm transition-all duration-500",
                    apt.status === 'Confirmed' 
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                      : "bg-amber-500/10 border-amber-500/20 text-amber-400 group-hover:bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                  )}>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-1.5 h-1.5 rounded-full", apt.status === 'Confirmed' ? "bg-emerald-400 animate-pulse" : "bg-amber-400")} />
                      {apt.status}
                    </div>
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-3 bg-white/5 border border-white/5 rounded-2xl text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all shadow-sm group/btn"
                  >
                    <MoreHorizontal className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
