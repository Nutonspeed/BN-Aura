'use client';

import { 
  CaretLeft,
  CaretRight,
  Plus,
  Clock,
  User,
  DotsThree,
  CalendarDots,
  SpinnerGap,
  Warning,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Pulse,
  IdentificationBadge,
  Briefcase,
  Monitor,
  ArrowsClockwise,
  ArrowRight,
  Sparkle,
  Icon,
  DotsThreeVertical
} from '@phosphor-icons/react';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { cn } from '@/lib/utils';
import { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppointmentModal from '@/components/AppointmentModal';

interface Appointment {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  appointment_type: string;
  customer: {
    id: string;
    full_name: string;
    nickname?: string;
    phone?: string;
  };
  staff: {
    id: string;
    full_name: string;
  };
}

export default function AppointmentPage() {
  const { goBack } = useBackNavigation();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | undefined>(undefined);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const res = await fetch(`/api/appointments?date=${dateStr}`);
      const result = await res.json();
      if (result.success) {
        setAppointments(result.data);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleAddAppointment = () => {
    setSelectedAppointment(undefined);
    setIsModalOpen(true);
  };

  const handleEditAppointment = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setIsModalOpen(true);
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  // Calendar logic
  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const startDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  
  const calendarDays = useMemo(() => {
    const days = [];
    const totalDays = daysInMonth(selectedDate);
    const offset = startDayOfMonth(selectedDate);
    for (let i = 0; i < offset; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) days.push(i);
    return days;
  }, [selectedDate]);

  const stats = useMemo(() => ({
    total: appointments.length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    pending: appointments.filter(a => a.status === 'pending' || a.status === 'scheduled').length,
    completed: appointments.filter(a => a.status === 'completed').length
  }), [appointments]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-20 font-sans"
    >
      <Breadcrumb />
      
      <AppointmentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchAppointments}
        appointment={selectedAppointment}
        selectedDate={selectedDate}
      />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]"
          >
            <CalendarDots weight="duotone" className="w-4 h-4" />
            การจัดการนัดหมาย
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-foreground tracking-tight uppercase"
          >
            ปฏิทิน<span className="text-primary">นัดหมาย</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            จัดการนัดหมายการรักษาและการปรึกษาทางคลินิก
          </motion.p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={fetchAppointments}
            disabled={loading}
            className="gap-2 px-6 py-6 rounded-2xl text-xs font-black uppercase tracking-widest border-border/50 hover:bg-secondary group"
          >
            <ArrowsClockwise weight="bold" className={cn("w-4 h-4", loading && "animate-spin")} />
            อัปเดตตาราง
          </Button>
          <Button 
            onClick={handleAddAppointment}
            className="gap-2 px-8 py-6 rounded-2xl text-xs font-black uppercase tracking-widest shadow-premium"
          >
            <Plus weight="bold" className="w-4 h-4" />
            สร้างนัดหมาย
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-2">
        <StatCard
          title="นัดหมายรายวัน"
          value={stats.total}
          icon={Monitor as Icon}
          className="p-4"
        />
        <StatCard
          title="รอบที่ยืนยันแล้ว"
          value={stats.confirmed}
          icon={CheckCircle as Icon}
          iconColor="text-emerald-500"
          className="p-4"
        />
        <StatCard
          title="รอดำเนินการ"
          value={stats.pending}
          icon={Clock as Icon}
          iconColor="text-amber-500"
          className="p-4"
        />
        <StatCard
          title="นัดหมายที่เสร็จสิ้น"
          value={stats.completed}
          icon={CheckCircle as Icon}
          iconColor="text-primary"
          className="p-4"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-10 px-2">
        {/* Calendar Sidebar */}
        <div className="xl:col-span-1 space-y-8">
          <Card className="rounded-2xl border-border/50 shadow-premium overflow-hidden group">
            <CardHeader className="p-8 border-b border-border/50 bg-secondary/30 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground truncate">
                {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </CardTitle>
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    const d = new Date(selectedDate);
                    d.setMonth(d.getMonth() - 1);
                    setSelectedDate(d);
                  }}
                  className="h-8 w-8 p-0 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary"
                >
                  <CaretLeft weight="bold" className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    const d = new Date(selectedDate);
                    d.setMonth(d.getMonth() + 1);
                    setSelectedDate(d);
                  }}
                  className="h-8 w-8 p-0 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary"
                >
                  <CaretRight weight="bold" className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-7 gap-1 text-center mb-4">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                  <span key={index} className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest py-2">{day}</span>
                ))}
                {calendarDays.map((day, i) => (
                  <button 
                    key={i} 
                    onClick={() => {
                      if (day) {
                        const d = new Date(selectedDate);
                        d.setDate(day);
                        setSelectedDate(d);
                      }
                    }}
                    className={cn(
                      "aspect-square text-[11px] font-black rounded-xl flex items-center justify-center transition-all border",
                      day === selectedDate.getDate() 
                        ? "bg-primary text-white border-primary shadow-premium" 
                        : day 
                          ? "text-foreground hover:bg-secondary border-transparent hover:border-border/50"
                          : "opacity-0 pointer-events-none"
                    )}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="p-8 rounded-2xl border-primary/10 bg-primary/[0.02] space-y-4 group overflow-hidden relative">
            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-primary/5 blur-[50px] rounded-full group-hover:bg-primary/10 transition-all duration-700" />
            <div className="flex items-center gap-3 relative z-10">
              <Sparkle weight="duotone" className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
              <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">ข้อมูลเชิงลึกเวลา</h4>
            </div>
            <p className="text-xs text-muted-foreground italic font-medium leading-relaxed relative z-10">
              ตรวจพบประสิทธิภาพการวินิจฉัยสูงสุดในช่วงบ่าย ประสิทธิภาพการทำงาน +12.4% ในช่วงพีค
            </p>
          </Card>
        </div>

        {/* Schedule List */}
        <div className="xl:col-span-3 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-secondary/30 p-2 rounded-[32px] border border-border/50 shadow-inner">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar px-2">
              {['ทั้งหมด', 'ยืนยันแล้ว', 'กำหนดการ', 'กำลังดำเนินการ', 'เสร็จสิ้น'].map((tab, i) => (
                <button 
                  key={tab} 
                  className={cn(
                    "px-6 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border",
                    i === 0 
                      ? "bg-card text-primary border-border/50 shadow-sm" 
                      : "text-muted-foreground border-transparent hover:bg-card/50 hover:text-foreground"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-6 bg-card border border-border/50 px-6 py-3 rounded-[24px] shadow-premium mr-2">
              <button onClick={() => changeDate(-1)} className="text-muted-foreground hover:text-primary transition-colors active:scale-90"><CaretLeft weight="bold" className="w-4 h-4" /></button>
              <span className="text-[11px] font-black uppercase tracking-widest text-foreground min-w-[140px] text-center">
                {selectedDate.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
              <button onClick={() => changeDate(1)} className="text-muted-foreground hover:text-primary transition-colors active:scale-90"><CaretRight weight="bold" className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {loading ? (
              <div className="py-32 flex flex-col items-center justify-center gap-4">
                <SpinnerGap className="w-10 h-10 text-primary animate-spin" />
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">กำลังโหลดตารางนัดหมาย...</p>
              </div>
            ) : appointments.length === 0 ? (
              <Card variant="ghost" className="py-32 border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-6 opacity-40 rounded-2xl">
                <CalendarDots weight="duotone" className="w-16 h-16 text-muted-foreground" />
                <p className="text-sm font-black uppercase tracking-widest text-center">ไม่พบนัดหมายในรอบนี้</p>
              </Card>
            ) : (
              <AnimatePresence mode="popLayout">
                {appointments.map((apt, i) => (
                  <motion.div
                    key={apt.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="rounded-2xl border-border/50 hover:border-primary/30 transition-all group overflow-hidden bg-card/50">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-primary opacity-0 group-hover:opacity-100 transition-all duration-500" />
                      <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                        <div className="flex items-center gap-10">
                          <div className="w-20 flex flex-col items-center gap-1.5">
                            <p className="text-2xl font-black text-foreground group-hover:text-primary transition-colors tracking-tighter tabular-nums">
                              {apt.start_time.substring(0, 5)}
                            </p>
                            <Badge variant="ghost" className="bg-primary/5 text-primary border-none font-black text-[8px] tracking-widest uppercase px-2">เริ่มรอบ</Badge>
                          </div>
                          
                          <div className="h-14 w-px bg-border/50 hidden md:block" />

                          <div className="flex items-center gap-6 min-w-0">
                            <div className="w-16 h-16 rounded-3xl bg-secondary border border-border flex items-center justify-center text-primary group-hover:bg-primary/10 transition-all duration-500 shadow-inner">
                              <User weight="duotone" className="w-8 h-8" />
                            </div>
                            <div className="space-y-1.5 min-w-0">
                              <h3 className="text-xl font-black text-foreground tracking-tight truncate uppercase">
                                {apt.customer?.full_name} {apt.customer?.nickname ? <span className="text-muted-foreground/40 font-bold ml-1 text-sm">[{apt.customer.nickname.toUpperCase()}]</span> : ''}
                              </h3>
                              <div className="flex flex-wrap items-center gap-3">
                                <Badge variant="ghost" className="bg-secondary text-muted-foreground border-none font-black text-[8px] tracking-widest uppercase px-3 py-1">
                                  {apt.appointment_type}
                                </Badge>
                                <div className="flex items-center gap-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                                  <Clock weight="bold" className="w-3.5 h-3.5 opacity-60" />
                                  60 นาที
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-8 md:gap-12">
                          <div className="flex flex-col md:items-end gap-1.5 min-w-[120px]">
                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em]">ผู้ปฏิบัติงาน</p>
                            <div className="flex items-center gap-2.5">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                              <span className="text-sm font-bold text-foreground uppercase tracking-tight">{apt.staff?.full_name}</span>
                            </div>
                          </div>

                          <Badge variant={apt.status === 'confirmed' || apt.status === 'completed' ? 'success' : 'warning'} className="font-black uppercase tracking-[0.2em] px-6 py-2.5 text-[10px] rounded-full shadow-sm">
                            <div className="flex items-center gap-2.5">
                              <div className={cn("w-1.5 h-1.5 rounded-full", apt.status === 'confirmed' || apt.status === 'completed' ? "bg-emerald-500 animate-pulse" : "bg-amber-500")} />
                              {apt.status}
                            </div>
                          </Badge>

                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditAppointment(apt)}
                              className="h-12 w-12 p-0 rounded-2xl hover:bg-secondary border border-border/50 text-muted-foreground hover:text-foreground transition-all"
                            >
                              <DotsThreeVertical weight="bold" className="w-6 h-6" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}