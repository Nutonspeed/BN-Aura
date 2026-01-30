'use client';

import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  User,
  MoreHorizontal
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white text-glow">Appointment Calendar</h1>
          <p className="text-muted-foreground font-light text-sm">Schedule and manage patient treatments and consultations.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold shadow-premium hover:brightness-110 transition-all active:scale-95">
          <Plus className="w-4 h-4" />
          <span>New Appointment</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Simple Calendar Sidebar */}
        <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-6 h-fit">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h3 className="text-lg font-semibold text-white">January 2026</h3>
            <div className="flex gap-2">
              <button className="p-1.5 hover:bg-white/5 rounded-lg text-muted-foreground"><ChevronLeft className="w-4 h-4" /></button>
              <button className="p-1.5 hover:bg-white/5 rounded-lg text-muted-foreground"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
              <span key={day} className="text-[10px] font-bold text-muted-foreground py-2">{day}</span>
            ))}
            {Array.from({ length: 31 }).map((_, i) => (
              <button 
                key={i} 
                className={cn(
                  "aspect-square text-xs rounded-lg flex items-center justify-center transition-all",
                  i + 1 === 30 ? "bg-primary text-primary-foreground font-bold shadow-premium" : "text-white/60 hover:bg-white/5"
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-white/5 space-y-4">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Resources</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs text-white">Room 101 (Active)</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/5">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-xs text-white">Laser Suite A</span>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule List */}
        <div className="xl:col-span-3 space-y-6">
          <div className="flex items-center gap-4 text-muted-foreground overflow-x-auto pb-2 scrollbar-hide">
            {['All', 'Confirmed', 'Pending', 'Cancelled', 'Completed'].map((tab, i) => (
              <button 
                key={tab} 
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                  i === 0 ? "bg-white/10 text-white border border-white/10" : "hover:text-white"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {appointments.map((apt, i) => (
              <motion.div
                key={apt.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-6 rounded-3xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-primary/30 transition-all group"
              >
                <div className="flex items-center gap-6">
                  <div className="w-20 text-center">
                    <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{apt.time}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">Start Time</p>
                  </div>
                  
                  <div className="h-12 w-px bg-white/5" />

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      <h3 className="font-bold text-white">{apt.customer}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground font-light">{apt.service}</p>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="hidden sm:flex flex-col items-end">
                    <div className="flex items-center gap-1.5 text-xs text-white/70">
                      <Clock className="w-3.5 h-3.5" />
                      <span>45 mins</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-light">Duration</span>
                  </div>

                  <div className={cn(
                    "px-3 py-1.5 rounded-xl border text-xs font-bold uppercase tracking-wider",
                    apt.status === 'Confirmed' 
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                      : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                  )}>
                    {apt.status}
                  </div>

                  <button className="p-2 text-muted-foreground hover:text-white transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
