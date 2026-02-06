'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChatCircle, 
  PaperPlaneTilt, 
  User, 
  Clock, 
  MagnifyingGlass, 
  Plus, 
  ArrowLeft,
  ChatCircleText,
  Phone,
  CheckCircle,
  DotsThreeVertical,
  Paperclip
} from '@phosphor-icons/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  customer_phone: string;
  customer?: { full_name: string };
  status: string;
  unread_count: number;
  last_message_at: string;
  messages: { id: string; content: string; direction: string; created_at: string }[];
}

export default function SMSPage() {
  const { goBack } = useBackNavigation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sms');
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!message.trim() || !selected) return;
    await fetch('/api/sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: selected.id, content: message })
    });
    setMessage('');
    fetchData();
  };

  const formatTime = (d: string) => new Date(d).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-[calc(100vh-140px)] -m-8 flex flex-col font-sans overflow-hidden"
    >
      <div className="p-8 pb-4 flex-shrink-0">
        <Breadcrumb />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mt-6">
          <div className="space-y-1">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]"
            >
              <ChatCircleText weight="duotone" className="w-4 h-4" />
              Communication Node
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl font-heading font-bold text-foreground tracking-tight"
            >
              Short Message <span className="text-primary">Service</span>
            </motion.h1>
          </div>
          
          <Button className="gap-2 shadow-premium px-8">
            <Plus weight="bold" className="w-4 h-4" />
            New Transmission
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden border-t border-border/50">
        {/* Conversations List */}
        <div className="w-96 border-r border-border/50 bg-card/30 flex flex-col flex-shrink-0">
          <div className="p-6 space-y-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-xl" />
              <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search identity node..." 
                className="w-full pl-11 pr-4 py-3 bg-secondary/50 border border-border rounded-2xl text-sm text-foreground focus:outline-none focus:border-primary transition-all shadow-inner relative z-10"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-3 space-y-1">
            {loading ? (
              <div className="py-20 flex flex-col items-center gap-4">
                <SpinnerGap className="w-8 h-8 text-primary animate-spin" />
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Syncing Nodes...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="py-20 text-center opacity-30 flex flex-col items-center gap-4">
                <ChatCircleText weight="duotone" className="w-12 h-12" />
                <p className="text-[10px] font-black uppercase tracking-widest">No Active Links</p>
              </div>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setSelected(conv)}
                  className={cn(
                    "w-full p-4 rounded-[24px] transition-all flex items-start gap-4 text-left group",
                    selected?.id === conv.id 
                      ? "bg-primary text-white shadow-premium" 
                      : "hover:bg-secondary/50 text-foreground"
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shadow-sm transition-colors",
                      selected?.id === conv.id ? "bg-white/20" : "bg-primary/10 text-primary group-hover:bg-primary/20"
                    )}>
                      {conv.customer?.full_name?.charAt(0) || <User weight="duotone" />}
                    </div>
                    {conv.unread_count > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-card ring-2 ring-rose-500/20">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex justify-between items-center mb-1">
                      <p className={cn("font-bold text-sm truncate tracking-tight", selected?.id === conv.id ? "text-white" : "text-foreground")}>
                        {conv.customer?.full_name || conv.customer_phone}
                      </p>
                      <span className={cn("text-[10px] font-medium opacity-60 tabular-nums", selected?.id === conv.id ? "text-white" : "text-muted-foreground")}>
                        {conv.last_message_at ? formatTime(conv.last_message_at) : ''}
                      </span>
                    </div>
                    <p className={cn("text-xs truncate", selected?.id === conv.id ? "text-white/80" : "text-muted-foreground")}>
                      {conv.messages?.[0]?.content || 'No signal transmitted...'}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div 
                key={selected.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col h-full"
              >
                {/* Chat Header */}
                <div className="p-6 bg-card border-b border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                      <User weight="duotone" className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground tracking-tight leading-none mb-1">{selected.customer?.full_name || 'Anonymous Node'}</p>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{selected.customer_phone}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground">
                      <Phone weight="bold" className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground">
                      <DotsThreeVertical weight="bold" className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-[radial-gradient(circle_at_center,var(--primary)_0%,transparent_100%)] bg-[length:100%_100%] bg-no-repeat bg-fixed opacity-[0.03] pointer-events-none absolute inset-0" />
                <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar relative z-10">
                  {selected.messages?.map((msg, idx) => (
                    <motion.div 
                      key={msg.id} 
                      initial={{ opacity: 0, x: msg.direction === 'outbound' ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={cn("flex", msg.direction === 'outbound' ? 'justify-end' : 'justify-start')}
                    >
                      <div className={cn(
                        "max-w-[70%] group relative",
                        msg.direction === 'outbound' ? 'items-end' : 'items-start'
                      )}>
                        <div className={cn(
                          "px-5 py-3.5 rounded-[24px] text-sm font-medium shadow-sm transition-all duration-300",
                          msg.direction === 'outbound' 
                            ? 'bg-primary text-white rounded-tr-none hover:shadow-premium' 
                            : 'bg-card border border-border/50 text-foreground rounded-tl-none hover:border-primary/30'
                        )}>
                          <p className="leading-relaxed">{msg.content}</p>
                        </div>
                        <div className={cn(
                          "mt-1.5 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest px-1",
                          msg.direction === 'outbound' ? 'justify-end text-primary/60' : 'text-muted-foreground/60'
                        )}>
                          {formatTime(msg.created_at)}
                          {msg.direction === 'outbound' && <CheckCircle weight="fill" className="w-3 h-3" />}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Input Area */}
                <div className="p-6 bg-card border-t border-border/50 relative z-10">
                  <div className="flex items-end gap-3 bg-secondary/50 border border-border/50 p-2 rounded-[28px] focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/5 transition-all">
                    <Button variant="ghost" size="sm" className="p-3 rounded-full text-muted-foreground hover:text-primary mb-0.5">
                      <Plus weight="bold" className="w-5 h-5" />
                    </Button>
                    <textarea
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      rows={1}
                      placeholder="Input clinical transmission..."
                      className="flex-1 bg-transparent border-none focus:ring-0 py-3.5 px-2 text-sm font-medium text-foreground placeholder:text-muted-foreground/40 resize-none max-h-32 custom-scrollbar"
                    />
                    <Button 
                      onClick={sendMessage} 
                      disabled={!message.trim()}
                      className="p-3.5 bg-primary text-white rounded-full shadow-premium mb-0.5 disabled:opacity-50 disabled:grayscale transition-all hover:scale-105 active:scale-95"
                    >
                      <PaperPlaneTilt weight="fill" className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center space-y-6 text-center opacity-30">
                <div className="w-24 h-24 rounded-[40px] bg-secondary border border-border flex items-center justify-center text-muted-foreground">
                  <ChatCircleText weight="duotone" className="w-12 h-12" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-black text-foreground uppercase tracking-[0.2em]">Zero Signal Detected</h4>
                  <p className="text-sm font-medium text-muted-foreground italic">Select a node from the registry to initialize communication.</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
