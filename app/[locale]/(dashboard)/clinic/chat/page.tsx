'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Sparkles, 
  User, 
  Bot,
  History,
  Info
} from 'lucide-react';
import { useState, SVGProps } from 'react';
import { cn } from '@/lib/utils';

export default function ChatAdvisor() {
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', content: 'สวัสดีครับ ผม BN-Aura AI Advisor ยินดีที่ได้บริการครับ วันนี้มีเคสลูกค้าท่านไหนให้ผมช่วยวิเคราะห์ข้อมูลหรือแนะนำโปรแกรมการรักษาไหมครับ?' },
  ]);
  const [input, setInput] = useState('');

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
    <div className="h-[calc(100vh-160px)] flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Bot className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-white">AI Chat Advisor</h1>
            <p className="text-muted-foreground font-light text-sm flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-primary" /> Powered by Gemini 1.5 Pro
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-muted-foreground hover:text-white transition-all">
            <History className="w-5 h-5" />
          </button>
          <button className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-muted-foreground hover:text-white transition-all">
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-hidden">
        {/* Chat Interface */}
        <div className="lg:col-span-3 glass-card rounded-3xl border border-white/10 flex flex-col overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={cn(
                    "flex w-full",
                    msg.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div className={cn(
                    "flex gap-3 max-w-[80%]",
                    msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                  )}>
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center",
                      msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-white/10 text-primary"
                    )}>
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={cn(
                      "p-4 rounded-2xl text-sm leading-relaxed",
                      msg.role === 'user' 
                        ? "bg-primary text-primary-foreground font-medium rounded-tr-none" 
                        : "bg-white/5 text-white/90 border border-white/5 rounded-tl-none"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Input Area */}
          <div className="p-6 bg-white/[0.02] border-t border-white/5">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="ถามข้อมูลเคสลูกค้า หรือขอคำแนะนำการเลือกทรีตเมนต์..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-14 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-inner"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-premium hover:brightness-110 disabled:opacity-50 transition-all active:scale-95"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="mt-3 text-[10px] text-center text-muted-foreground font-light tracking-wider uppercase">
              AI recommendations should be verified by a medical professional.
            </p>
          </div>
        </div>

        {/* Sidebar Info/Status */}
        <div className="hidden lg:flex flex-col gap-6">
          <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> Active Context
            </h3>
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
              <p className="text-xs text-muted-foreground mb-1">Current Customer</p>
              <p className="text-sm font-bold text-white">Nattaya R. (NR)</p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Recent Activity</p>
              <div className="text-xs text-white/60 space-y-2">
                <div className="flex gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary mt-1.5" />
                  <span>Skin Analysis completed (Score: 91%)</span>
                </div>
                <div className="flex gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary mt-1.5" />
                  <span>Previous treatment: Pico Rejuvenation</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white">Suggested Topics</h3>
            <div className="flex flex-wrap gap-2">
              {['Compare with last scan', 'Optimize treatment', 'Explain results', 'Create proposal'].map(tag => (
                <button key={tag} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] text-white/70 hover:bg-white/10 hover:text-white transition-all">
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
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
