'use client';

import { 
  SpinnerGap,
  Plus,
  X,
  CaretRight,
  DownloadSimple,
  ArrowLeft,
  Lifebuoy,
  WarningCircle,
  CheckCircle,
  ChatCircleText,
  Clock,
  User,
  Buildings,
  Tag,
  ShieldCheck,
  ArrowRight,
  Monitor,
  IdentificationBadge,
  Pulse,
  Briefcase,
  ArrowsClockwise,
  Headset
} from '@phosphor-icons/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/StatCard';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { SupportProvider, useSupportContext } from './context';
import SupportHeader from './components/SupportHeader';
import SupportStats from './components/SupportStats';
import TicketFilters from './components/TicketFilters';
import SupportTicketTable from './components/SupportTicketTable';
import { SupportTicket } from './types';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function SupportContent() {
  const { goBack } = useBackNavigation();
  const { loading, tickets, refreshTickets } = useSupportContext();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    refreshTickets();
  }, [refreshTickets]);

  const handleCreateTicket = () => {
    setShowCreateModal(true);
  };

  const handleViewTicket = (ticket: any) => {
    setSelectedTicket(ticket);
    setShowDetailModal(true);
  };

  const handleEditTicket = (ticket: any) => {
    setSelectedTicket(ticket);
    setShowDetailModal(true);
  };

  if (loading && !selectedTicket) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <SpinnerGap className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse text-xs uppercase tracking-widest text-center">
          กำลังโหลดข้อมูลฝ่ายสนับสนุน...
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-20 font-sans"
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
            ฝ่ายสนับสนุน
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-foreground tracking-tight uppercase"
          >
            ฝ่าย<span className="text-primary">สนับสนุน</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            จัดการตั๋วสนับสนุนและแก้ไขปัญหาของคลินิก
          </motion.p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={refreshTickets}
            disabled={loading}
            className="gap-2 px-6 py-6 rounded-2xl text-xs font-black uppercase tracking-widest border-border/50 hover:bg-secondary group"
          >
            <ArrowsClockwise weight="bold" className={cn("w-4 h-4", loading && "animate-spin")} />
            อัปเดต
          </Button>
          <Button 
            onClick={handleCreateTicket}
            className="gap-3 shadow-premium px-8 py-6 rounded-2xl text-xs font-black uppercase tracking-widest"
          >
            <Plus weight="bold" className="w-4 h-4" />
            สร้างตั๋ว
          </Button>
        </div>
      </div>

      {/* Stats Summary Section */}
      <div className="px-2">
        <SupportStats />
      </div>

      {/* Main Content Node */}
      <div className="px-2 space-y-8">
        <Card className="rounded-[40px] border-border/50 shadow-premium overflow-hidden group">
          <CardHeader className="p-8 border-b border-border/50 bg-secondary/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                <ChatCircleText weight="duotone" className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-black uppercase tracking-tight">รายการตั๋วที่ใช้งาน</CardTitle>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black mt-0.5">ข้อมูลตั๋วสนับสนุนแบบเรียลไทม์</p>
              </div>
            </div>
            <TicketFilters />
          </CardHeader>
          <CardContent className="p-0">
            <SupportTicketTable tickets={[]} onTicketSelect={() => {}} onTicketEdit={() => {}} onTicketDelete={() => {}} />
          </CardContent>
        </Card>
      </div>

      {/* Create Ticket Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card p-8 rounded-[32px] border border-border shadow-premium w-full max-w-2xl max-h-[90vh] overflow-y-auto relative"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <Plus weight="bold" className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">สร้างตั๋วสนับสนุน</h2>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">กรอกรายละเอียดปัญหา</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all"
                >
                  <X weight="bold" className="w-6 h-6" />
                </button>
              </div>
              
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">คลินิกเป้าหมาย</label>
                    <div className="relative group">
                      <Buildings className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within:text-primary" />
                      <select className="w-full bg-secondary/30 border border-border rounded-2xl py-4 pl-12 pr-4 text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-medium appearance-none">
                        <option value="" className="bg-card">เลือกคลินิก</option>
                        <option value="clinic-1" className="bg-card">Bangkok Premium Clinic</option>
                        <option value="clinic-2" className="bg-card">Phuket Beauty Center</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">ระดับความสำคัญ</label>
                    <div className="relative group">
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within:text-primary" />
                      <select className="w-full bg-secondary/30 border border-border rounded-2xl py-4 pl-12 pr-4 text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-medium appearance-none">
                        <option value="low" className="bg-card">ต่ำ (ปกติ)</option>
                        <option value="medium" className="bg-card" selected>ปานกลาง</option>
                        <option value="high" className="bg-card">สูง (เร่งด่วน)</option>
                        <option value="urgent" className="bg-card">ฉุกเฉิน (ทันที)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">หมวดหมู่</label>
                  <select className="w-full bg-secondary/30 border border-border rounded-2xl py-4 px-5 text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-medium appearance-none">
                    <option value="general" className="bg-card" selected>ปรึกษาทั่วไป</option>
                    <option value="technical" className="bg-card">ปัญหาทางเทคนิค</option>
                    <option value="billing" className="bg-card">การเงิน / การเรียกเก็บเงิน</option>
                    <option value="feature_request" className="bg-card">ขอฟีเจอร์ใหม่</option>
                    <option value="bug_report" className="bg-card">แจ้งปัญหา / บั๊ก</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">หัวข้อ</label>
                  <input
                    type="text"
                    className="w-full bg-secondary/30 border border-border rounded-2xl py-4 px-5 text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-medium placeholder:text-muted-foreground/40"
                    placeholder="สรุปปัญหาสั้นๆ"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">รายละเอียด</label>
                  <textarea
                    rows={4}
                    className="w-full bg-secondary/30 border border-border rounded-2xl py-4 px-5 text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-medium placeholder:text-muted-foreground/40"
                    placeholder="อธิบายรายละเอียดปัญหาที่พบ"
                  />
                </div>
              </form>

              <div className="flex flex-col sm:flex-row items-center gap-4 mt-10">
                <Button className="w-full sm:w-auto px-10 py-4 shadow-premium">
                  สร้างตั๋ว
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowCreateModal(false)}
                  className="w-full sm:w-auto text-xs font-black uppercase tracking-widest text-muted-foreground"
                >
                  ยกเลิก
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Ticket Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedTicket && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card p-8 rounded-[32px] border border-border shadow-premium w-full max-w-4xl max-h-[90vh] overflow-y-auto relative"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                    <ChatCircleText weight="duotone" className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">รายละเอียดตั๋ว</h2>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Status: {selectedTicket.status}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all"
                >
                  <X weight="bold" className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-8">
                <div className="flex flex-wrap gap-3">
                  <Badge variant={
                    selectedTicket.priority === 'urgent' ? 'destructive' : 
                    selectedTicket.priority === 'high' ? 'warning' : 'default'
                  } className="font-black uppercase tracking-widest px-4 py-1.5">
                    {selectedTicket.priority} ความสำคัญ
                  </Badge>
                  <Badge variant={
                    selectedTicket.status === 'open' ? 'warning' : 
                    selectedTicket.status === 'resolved' ? 'success' : 'secondary'
                  } className="font-black uppercase tracking-widest px-4 py-1.5">
                    {selectedTicket.status.replace('_', ' ')}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-foreground tracking-tight mb-3">{selectedTicket.subject}</h3>
                  <Card className="bg-secondary/30 border-border/50">
                    <CardContent className="p-6">
                      <p className="text-foreground leading-relaxed font-medium">{selectedTicket.description}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-secondary/50 rounded-3xl border border-border shadow-inner">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">คลินิกต้นทาง</p>
                    <div className="flex items-center gap-2 text-foreground font-bold">
                      <Buildings weight="bold" className="w-4 h-4 text-primary" />
                      <span className="text-sm truncate">{selectedTicket.clinic?.name}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">ผู้แจ้ง</p>
                    <div className="flex items-center gap-2 text-foreground font-bold">
                      <User weight="bold" className="w-4 h-4 text-primary" />
                      <span className="text-sm truncate">{selectedTicket.user?.full_name}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">วันที่แจ้ง</p>
                    <div className="flex items-center gap-2 text-foreground font-bold">
                      <Clock weight="bold" className="w-4 h-4 text-primary" />
                      <span className="text-sm">{new Date(selectedTicket.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">ผู้รับผิดชอบ</p>
                    <div className="flex items-center gap-2 text-foreground font-bold">
                      <Badge variant="ghost" size="sm" className="font-bold">
                        {selectedTicket.assigned_user?.full_name || 'ยังไม่มอบหมาย'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-sm font-black text-foreground uppercase tracking-[0.2em] flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
                    ประวัติการสนทนา
                  </h4>
                  
                  <div className="space-y-4">
                    {/* Initial message */}
                    <div className="p-5 bg-secondary/30 rounded-3xl border border-border/50 relative overflow-hidden">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground">
                            <User weight="bold" className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-foreground text-sm">{selectedTicket.user?.full_name}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium italic">
                          {new Date(selectedTicket.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-foreground/80 text-sm leading-relaxed">{selectedTicket.description}</p>
                    </div>

                    {/* Simulation message */}
                    <div className="p-5 bg-primary/5 rounded-3xl border border-primary/10 relative overflow-hidden ml-8">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/20" />
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                            <ShieldCheck weight="fill" className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-foreground text-sm">ฝ่ายสนับสนุนระบบ</span>
                          <Badge variant="default" size="sm" className="text-[8px] font-black">ADMIN</Badge>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium italic">2 hours ago</span>
                      </div>
                      <p className="text-foreground/80 text-sm leading-relaxed">ได้รับข้อมูลแล้ว กำลังตรวจสอบปัญหาทางเทคนิค</p>
                    </div>
                  </div>

                  {/* Reply form */}
                  <div className="mt-8 p-6 bg-secondary/50 rounded-[32px] border border-border shadow-inner">
                    <textarea
                      rows={3}
                      className="w-full bg-card border border-border rounded-2xl py-4 px-5 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-medium text-sm"
                      placeholder="พิมพ์ข้อความตอบกลับ..."
                    />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                          <input type="checkbox" className="peer sr-only" />
                          <div className="w-5 h-5 bg-card border border-border rounded transition-all peer-checked:bg-primary peer-checked:border-primary" />
                          <CheckCircle weight="fill" className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">บันทึกภายใน (เข้ารหัส)</span>
                      </label>
                      <Button className="px-8 shadow-premium gap-2">
                        ส่งข้อความ
                        <ArrowRight weight="bold" className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function SupportPage() {
  return (
    <SupportProvider>
      <SupportContent />
    </SupportProvider>
  );
}
