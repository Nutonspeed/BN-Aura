'use client';

import { 
  PaperPlaneTilt,
  Sparkle,
  User,
  Robot,
  ClockCounterClockwise,
  Info,
  Pulse,
  ShieldCheck,
  Lightning,
  Monitor,
  ChatCircleText,
  IdentificationBadge,
  ArrowLeft,
  X
} from '@phosphor-icons/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo, SVGProps } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Format time consistently to avoid hydration mismatch
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export default function ChatAdvisor() {
  const { goBack } = useBackNavigation();
  const [isClient, setIsClient] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', content: 'สวัสดีครับ ผม BN-Aura AI Advisor ยินดีที่ได้บริการครับ วันนี้มีเคสลูกค้าท่านไหนให้ผมช่วยวิเคราะห์ข้อมูลหรือแนะนำโปรแกรมการรักษาไหมครับ?' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input.trim();
    const newMsg = { id: Date.now(), role: 'user', content: userMsg };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/business-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'query', query: userMsg }),
      });
      const data = await res.json();

      if (data.success && data.insight) {
        const aiResponse = typeof data.insight === 'string'
          ? data.insight
          : data.insight.answer || data.insight.summary || JSON.stringify(data.insight);
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          role: 'assistant',
          content: aiResponse,
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          role: 'assistant',
          content: data.error || 'ขออภัยครับ ไม่สามารถประมวลผลได้ในขณะนี้',
        }]);
      }
    } catch (e) {
      console.error('AI chat error:', e);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่ครับ',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-[calc(100vh-120px)] flex flex-col space-y-8 pb-6 font-sans"
    >
      <Breadcrumb />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-premium">
            <Robot weight="duotone" className="w-9 h-9" />
          </div>
          <div className="space-y-1">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]"
            >
              <Sparkle weight="bold" className="w-3 h-3 animate-pulse" />
              โหนดการให้เหตุผลทางประสาท
            </motion.div>
            <h1 className="text-3xl font-heading font-bold text-foreground uppercase tracking-tight">AI แชท <span className="text-primary">ที่ปรึกษา</span></h1>
          </div>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline"
            className="p-3 h-12 w-12 border-border/50 rounded-2xl hover:bg-secondary group"
          >
            <ClockCounterClockwise weight="bold" className="w-5 h-5 group-hover:rotate-[-10deg] transition-transform" />
          </Button>
          <Button 
            variant="outline"
            className="p-3 h-12 w-12 border-border/50 rounded-2xl hover:bg-secondary group"
          >
            <Info weight="bold" className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </Button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8 overflow-hidden px-2">
        {/* Chat Interface Node */}
        <Card className="lg:col-span-3 rounded-[48px] border-border/50 flex flex-col overflow-hidden relative shadow-premium bg-secondary/10">
          <div className="absolute inset-0 bg-scanner-grid opacity-[0.02] pointer-events-none" />
          
          {/* Messages Neural Area */}
          <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar relative z-10">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className={cn(
                    "flex w-full",
                    msg.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div className={cn(
                    "flex gap-5 max-w-[85%]",
                    msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                  )}>
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center border transition-all duration-500 shadow-inner",
                      msg.role === 'user' 
                        ? "bg-primary text-primary-foreground border-primary/20" 
                        : "bg-card text-primary border-border/50"
                    )}>
                      {msg.role === 'user' ? <User weight="duotone" className="w-6 h-6" /> : <Robot weight="duotone" className="w-6 h-6" />}
                    </div>
                    <div className={cn(
                      "p-6 rounded-[32px] text-sm leading-relaxed shadow-premium transition-all duration-500",
                      msg.role === 'user' 
                        ? "bg-primary text-primary-foreground font-bold rounded-tr-none" 
                        : "bg-card border border-border/50 text-foreground rounded-tl-none hover:border-primary/20"
                    )}>
                      {msg.content}
                      <p className={cn(
                        "text-[9px] mt-3 opacity-40 font-black uppercase tracking-widest",
                        msg.role === 'user' ? "text-right" : "text-left"
                      )}>
                        {isClient ? formatTime(msg.id) : '--:--'} • SYNC_OK
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Input Transmission Area */}
          <div className="p-8 bg-secondary/30 border-t border-border/50 backdrop-blur-xl relative z-20">
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/5 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-[32px]" />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="สอบถามเกี่ยวกับเคสทางคลินิกหรือโปรโตคอลการรักษา..."
                className="w-full bg-card border border-border/50 rounded-[32px] py-6 pl-10 pr-24 text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary transition-all shadow-inner relative z-10 font-bold"
              />
              <Button 
                onClick={handleSend}
                disabled={!input.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 rounded-2xl shadow-premium hover:scale-105 disabled:opacity-30 transition-all z-20"
              >
                <PaperPlaneTilt weight="bold" className="w-6 h-6" />
              </Button>
            </div>
            <div className="mt-6 flex items-center justify-center gap-3 opacity-40">
              <ShieldCheck weight="fill" className="w-3.5 h-3.5 text-emerald-500" />
              <p className="text-[9px] text-center text-muted-foreground font-black tracking-[0.3em] uppercase">
                การเข้ารหัส Neural ที่ปลอดภัยกำลังทำงาน • การตรวจสอบทางคลินิกแบบ End-to-End
              </p>
            </div>
          </div>
        </Card>

        {/* Sidebar Context Hub */}
        <div className="hidden lg:flex flex-col gap-8">
          <Card className="rounded-[40px] border-border/50 shadow-premium overflow-hidden group">
            <CardHeader className="p-8 border-b border-border/50 bg-secondary/30">
              <CardTitle className="text-xs font-black uppercase tracking-[0.3em] flex items-center gap-3 text-primary">
                <Pulse weight="duotone" className="w-5 h-5" />
                บริบทที่ใช้งาน
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8 relative overflow-hidden">
              <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-primary/5 blur-[50px] rounded-full group-hover:bg-primary/10 transition-all" />
              
              <div className="space-y-6 relative z-10">
                <div className="p-6 bg-primary/5 rounded-[32px] border border-primary/10 shadow-inner group-hover:border-primary/20 transition-all duration-500">
                  <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-2">โฟกัสโหนดหลัก</p>
                  <p className="text-base font-black text-foreground tracking-tight uppercase">ศูนย์ข้อมูลตัวตน <span className="text-[10px] text-muted-foreground ml-1">#SYNC-2026</span></p>
                </div>
                
                <div className="space-y-4">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">ประวัติการส่งข้อมูล</p>
                  <div className="space-y-3">
                    {[
                      "การวิเคราะห์ Neural (91%)",
                      "โปรโตคอล: Pico Rejuvenation"
                    ].map((activity, i) => (
                      <div key={i} className="flex gap-3 items-center group/item">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover/item:scale-150 transition-transform shadow-[0_0_8px_rgba(var(--primary),0.4)]" />
                        <span className="text-[11px] text-muted-foreground font-black uppercase tracking-widest">{activity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[40px] border-border/50 shadow-premium p-8 space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform">
              <Lightning weight="fill" className="w-24 h-24 text-primary" />
            </div>
            <h3 className="text-xs font-black text-foreground uppercase tracking-[0.2em] relative z-10">ลิงก์ Prompt Neural</h3>
            <div className="flex flex-wrap gap-2.5 relative z-10">
              {['เปรียบเทียบโหนด', 
                'เพิ่มประสิทธิภาพ Delta', 
                'ตรรกะ Neural', 
                'การวิเคราะห์ทางการเงิน'
              ].map((tag) => (
                <button 
                  key={tag} 
                  className="px-4 py-2.5 rounded-xl bg-secondary border border-border/50 text-[9px] font-black text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all uppercase tracking-widest shadow-sm active:scale-95"
                >
                  {tag}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
