'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  PaperPlaneTilt, 
  Sparkle, 
  User, 
  Robot,
  ClockCounterClockwise,
  Info
} from '@phosphor-icons/react';
import { useState, useEffect, SVGProps } from 'react';
import { cn } from '@/lib/utils';

// Format time consistently to avoid hydration mismatch
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export default function ChatAdvisor() {
  const [isClient, setIsClient] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', content: 'สวัสดีครับ ผม BN-Aura AI Advisor ยินดีที่ได้บริการครับ วันนี้มีเคสลูกค้าท่านไหนให้ผมช่วยวิเคราะห์ข้อมูลหรือแนะนำโปรแกรมการรักษาไหมครับ?' },
  ]);
  const [input, setInput] = useState('');
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;
    
    const newMsg = { id: Date.now(), role: 'user', content: input };
    setMessages(prev => [...prev, newMsg]);
    setInput('');

    // Simulate AI thinking
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        role: 'assistant', 
        content: 'ผมได้รับข้อมูลแล้วครับ กำลังประมวลผลความสอดคล้องระหว่างผลการสแกนผิวและประวัติหัตถการเดิมของลูกค้าครู่หนึ่งครับ...' 
      }]);
    }, 1000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-[calc(100vh-160px)] flex flex-col space-y-8 pb-6 font-sans"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20 shadow-premium">
            <Robot className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]"
            >
              <Sparkle className="w-3 h-3 animate-glow-pulse" />
              Cognitive Reasoning Node
            </motion.div>
            <h1 className="text-3xl font-heading font-bold text-white uppercase tracking-tight">AI Chat <span className="text-primary text-glow">Advisor</span></h1>
          </div>
        </div>
        <div className="flex gap-3">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 bg-white/5 border border-white/10 rounded-2xl text-muted-foreground hover:text-white transition-all shadow-sm group"
          >
            <ClockCounterClockwise className="w-5 h-5 group-hover:rotate-[-10deg] transition-transform" />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 bg-white/5 border border-white/10 rounded-2xl text-muted-foreground hover:text-white transition-all shadow-sm group"
          >
            <Info className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </motion.button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8 overflow-hidden">
        {/* Chat Interface */}
        <div className="lg:col-span-3 glass-premium rounded-[48px] border border-white/10 flex flex-col overflow-hidden relative shadow-2xl">
          <div className="absolute inset-0 bg-chat-pattern opacity-[0.03] pointer-events-none" />
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar relative z-10">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
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
                      "w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center border transition-all duration-500 shadow-sm",
                      msg.role === 'user' 
                        ? "bg-primary text-primary-foreground border-primary/20" 
                        : "bg-white/5 text-primary border-white/10"
                    )}>
                      {msg.role === 'user' ? <User className="w-5 h-5" /> : <Robot className="w-5 h-5" />}
                    </div>
                    <div className={cn(
                      "p-5 rounded-[28px] text-sm leading-relaxed shadow-lg backdrop-blur-md transition-all duration-500",
                      msg.role === 'user' 
                        ? "bg-primary text-primary-foreground font-medium rounded-tr-none shadow-[0_0_20px_rgba(var(--primary),0.15)]" 
                        : "bg-white/5 text-white/90 border border-white/10 rounded-tl-none hover:bg-white/[0.08]"
                    )}>
                      {msg.content}
                      <p className={cn(
                        "text-[9px] mt-2 opacity-40 font-bold uppercase tracking-widest",
                        msg.role === 'user' ? "text-right" : "text-left"
                      )}>
                        {isClient ? formatTime(msg.id) : '--:--'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Input Area */}
          <div className="p-8 bg-white/[0.03] border-t border-white/10 backdrop-blur-xl relative z-20">
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/10 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-[24px]" />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Inquire about clinical cases or treatment optimization..."
                className="w-full bg-white/5 border border-white/10 rounded-[24px] py-5 pl-8 pr-20 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all shadow-inner relative z-10"
              />
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleSend}
                disabled={!input.trim()}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-premium hover:brightness-110 disabled:opacity-30 disabled:grayscale transition-all z-20"
              >
                <PaperPlaneTilt className="w-5 h-5 stroke-[3px]" />
              </motion.button>
            </div>
            <div className="mt-4 flex items-center justify-center gap-3 opacity-40">
              <Shield className="w-3 h-3 text-emerald-400" />
              <p className="text-[9px] text-center text-muted-foreground font-black tracking-[0.2em] uppercase">
                Secure Neural Encryption Enabled • Clinical Verification Required
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar Info/Status */}
        <div className="hidden lg:flex flex-col gap-8">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-premium p-8 rounded-[40px] border border-white/10 space-y-8 relative overflow-hidden group"
          >
            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-primary/5 blur-[50px] rounded-full group-hover:bg-primary/10 transition-all" />
            
            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3 relative z-10">
              <Activity className="w-4 h-4 text-primary" />
              Active Context
            </h3>
            
            <div className="space-y-6 relative z-10">
              <div className="p-5 bg-primary/10 rounded-3xl border border-primary/20 backdrop-blur-md group-hover:bg-primary/20 transition-all duration-500">
                <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-2">Subject Focus</p>
                <p className="text-base font-black text-white tracking-tight">Nattaya R. <span className="text-[10px] text-muted-foreground ml-1">ID: NR-2026</span></p>
              </div>
              
              <div className="space-y-4">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Historical Sequence</p>
                <div className="space-y-3">
                  {[
                    "Analysis complete (91%)",
                    "Previous: Pico Rejuvenation"
                  ].map((activity, i) => (
                    <div key={i} className="flex gap-3 items-center group/item">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover/item:scale-150 transition-transform" />
                      <span className="text-[11px] text-white/60 font-medium">{activity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card p-8 rounded-[40px] border border-white/10 space-y-6"
          >
            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Neural Prompts</h3>
            <div className="flex flex-wrap gap-2.5">
              {['Compare Scans', 
                'Optimize Protocol', 
                'Neural Reasoning', 
                'Financial Logic'
              ].map((tag) => (
                <motion.button 
                  key={tag} 
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black text-white/60 hover:text-white hover:border-primary/30 transition-all uppercase tracking-widest"
                >
                  {tag}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function Shield(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </svg>
  );
}

function Activity(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
