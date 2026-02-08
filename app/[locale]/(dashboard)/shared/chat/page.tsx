'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PaperPlaneTilt,
  ChatCircle,
  User,
  Users,
  MagnifyingGlass,
  DotsThreeVertical,
  Phone,
  VideoCamera,
  ArrowLeft,
  Monitor,
  Lightning,
  CheckCircle,
  Clock,
  Plus,
  Funnel,
  IdentificationCard,
  Icon,
  SpinnerGap
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import Breadcrumb from '@/components/ui/Breadcrumb';

interface ChatSession {
  id: string;
  customer_id: string;
  sales_staff_id: string;
  customer_name: string;
  sales_name: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

interface Message {
  id: string;
  content: string;
  sender_type: 'customer' | 'sales';
  sender_id: string;
  created_at: string;
  is_read: boolean;
}

// Format time consistently to avoid hydration mismatch
function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
}

export default function SharedChatPage() {
  const { user, getUserRole } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const userRole = getUserRole();
  const isCustomer = ['customer', 'free_user', 'free_customer', 'premium_customer'].includes(userRole);
  const isSales = userRole === 'sales_staff';

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (user) {
      fetchChatSessions();
    }
  }, [user]);

  useEffect(() => {
    if (selectedSession) {
      fetchMessages(selectedSession.customer_id);
    }
  }, [selectedSession]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/chat?action=sessions');
      if (response.ok) {
        const data = await response.json();
        const rawSessions = data.data?.sessions || data.sessions || [];
        setSessions(rawSessions.map((s: any) => ({
          id: s.id || s.customerId || '',
          customer_id: s.customer_id || s.customerId || '',
          sales_staff_id: s.sales_staff_id || s.salesStaffId || '',
          customer_name: s.customer_name || s.customerName || 'Unknown',
          sales_name: s.sales_name || s.salesName || 'Advisor',
          last_message: s.last_message || s.lastMessage || '',
          last_message_at: s.last_message_at || s.lastActivity || new Date().toISOString(),
          unread_count: s.unread_count || s.unreadCount || 0
        })));
      }
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (customerId: string) => {
    try {
      const response = await fetch(`/api/chat?action=history&customerId=${customerId}`);
      if (response.ok) {
        const data = await response.json();
        const rawMessages = data.data?.messages || data.messages || [];
        setMessages(rawMessages.map((m: any) => ({
          id: m.id,
          content: m.messageText || m.content || '',
          sender_type: m.senderType || m.sender_type,
          sender_id: m.senderType === 'customer' ? m.customerId : m.salesStaffId || m.sender_id,
          created_at: m.createdAt || m.created_at,
          is_read: m.isRead ?? m.is_read ?? false
        })));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedSession) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender_type: isCustomer ? 'customer' : 'sales',
      sender_id: user?.id || '',
      created_at: new Date().toISOString(),
      is_read: false
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInput('');

    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedSession.customer_id,
          messageText: input,
          messageType: 'text'
        })
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const filteredSessions = sessions.filter(session => 
    (session.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (session.sales_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getOtherPartyName = (session: ChatSession) => {
    if (isCustomer) return session.sales_name || 'My Sales Advisor';
    return session.customer_name || 'Customer';
  };

  if (!isClient) {
    return (
      <div className="h-[calc(100vh-160px)] flex flex-col items-center justify-center space-y-6">
        <SpinnerGap className="w-12 h-12 text-primary animate-spin" />
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] animate-pulse">Initializing Neural Link...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-[calc(100vh-120px)] flex flex-col space-y-6 pb-4 font-sans"
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
            <ChatCircle weight="duotone" className="w-4 h-4" />
            Neural Communication Node
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-foreground tracking-tight uppercase"
          >
            Global <span className="text-primary">Chat</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            {isCustomer ? 'กำลังเชื่อมต่อกับที่ปรึกษาคลินิกของคุณ' : 'กำลังจัดการข้อมูลการสนทนาและข้อมูลลูกค้า'}
          </motion.p>
        </div>
      </div>

      {/* Main Chat Interface Matrix */}
      <div className="flex-1 flex overflow-hidden rounded-[40px] border border-border/50 shadow-premium bg-card relative">
        <div className="absolute inset-0 bg-scanner-grid opacity-[0.02] pointer-events-none" />
        
        {/* Sessions List Hub */}
        <div className={cn(
          "w-full md:w-96 border-r border-border/50 flex flex-col bg-secondary/10 relative z-10",
          selectedSession && "hidden md:flex"
        )}>
          {/* Registry Search */}
          <div className="p-6 border-b border-border/50">
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-2xl" />
              <MagnifyingGlass weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Query identity nodes..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-card border border-border/50 rounded-2xl py-3 pl-11 pr-4 text-xs font-black uppercase tracking-widest text-foreground focus:outline-none focus:border-primary transition-all shadow-inner relative z-10"
              />
            </div>
          </div>

          {/* Session Registry */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
            {loading ? (
              <div className="py-20 flex flex-col items-center gap-4 opacity-40">
                <SpinnerGap className="w-8 h-8 text-primary animate-spin" />
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Syncing Matrix...</p>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="py-20 text-center opacity-40 space-y-4">
                <ChatCircle weight="duotone" className="w-12 h-12 mx-auto mb-3" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Registry Nominal</p>
              </div>
            ) : (
              filteredSessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className={cn(
                    "w-full p-5 flex items-start gap-4 rounded-[28px] transition-all duration-500 group relative overflow-hidden border border-transparent",
                    selectedSession?.id === session.id 
                      ? "bg-primary/10 border-primary/20 shadow-sm" 
                      : "hover:bg-card hover:border-border/50 shadow-none"
                  )}
                >
                  <div className="w-12 h-12 rounded-2xl bg-secondary border border-border/50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-inner">
                    <User weight="duotone" className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0 text-left relative z-10">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-black text-foreground truncate uppercase tracking-tight">
                        {getOtherPartyName(session)}
                      </span>
                      <span className="text-[9px] font-bold text-muted-foreground tabular-nums uppercase">
                        {formatDate(session.last_message_at)}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-medium italic truncate opacity-80 leading-relaxed">
                      {session.last_message || 'Awaiting transmission...'}
                    </p>
                  </div>
                  {session.unread_count > 0 && (
                    <span className="w-5 h-5 rounded-full bg-primary text-[9px] font-black flex items-center justify-center text-primary-foreground shadow-glow-sm relative z-10">
                      {session.unread_count}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Terminal Chat Node Area */}
        <div className={cn(
          "flex-1 flex flex-col bg-card/50 relative z-10",
          !selectedSession && "hidden md:flex"
        )}>
          {selectedSession ? (
            <>
              {/* Node Header */}
              <div className="p-6 border-b border-border/50 flex items-center gap-5 bg-secondary/10 backdrop-blur-md">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedSession(null)}
                  className="md:hidden p-3 h-11 w-11 rounded-xl hover:bg-card border-border/50"
                >
                  <ArrowLeft weight="bold" className="w-5 h-5" />
                </Button>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                  <User weight="duotone" className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-black text-foreground uppercase tracking-tight truncate">
                      {getOtherPartyName(selectedSession)}
                    </h3>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                  </div>
                  <div className="flex items-center gap-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                    <Badge variant="ghost" className="bg-primary/5 text-primary border-none text-[8px] px-2 py-0.5 tracking-tighter uppercase">LINK_ESTABLISHED</Badge>
                    <span>ID: {selectedSession.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <Button variant="outline" size="sm" className="h-11 w-11 p-0 rounded-2xl border-border/50 hover:bg-secondary">
                    <Phone weight="bold" className="w-4.5 h-4.5 text-muted-foreground hover:text-primary transition-colors" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-11 w-11 p-0 rounded-2xl border-border/50 hover:bg-secondary">
                    <DotsThreeVertical weight="bold" className="w-4.5 h-4.5 text-muted-foreground hover:text-primary transition-colors" />
                  </Button>
                </div>
              </div>

              {/* Message Matrix Stream */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-6">
                <AnimatePresence mode="popLayout">
                  {messages.map((msg, i) => {
                    const isOwnMessage = (isCustomer && msg.sender_type === 'customer') || 
                                         (!isCustomer && msg.sender_type === 'sales');
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className={cn(
                          "flex group/msg",
                          isOwnMessage ? "justify-end" : "justify-start"
                        )}
                      >
                        <div className={cn(
                          "max-w-[70%] space-y-2",
                          isOwnMessage ? "items-end" : "items-start"
                        )}>
                          <div className={cn(
                            "rounded-[28px] px-6 py-4 shadow-card transition-all relative overflow-hidden",
                            isOwnMessage 
                              ? "bg-primary text-primary-foreground rounded-br-sm shadow-glow-sm" 
                              : "bg-secondary/50 border border-border/50 text-foreground rounded-bl-sm shadow-inner"
                          )}>
                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/msg:opacity-100 transition-opacity" />
                            <p className="text-sm font-medium leading-relaxed relative z-10">{msg.content}</p>
                          </div>
                          <div className={cn(
                            "flex items-center gap-3 px-2 text-[9px] font-black uppercase tracking-[0.2em] opacity-40 group-hover/msg:opacity-100 transition-opacity",
                            isOwnMessage ? "justify-end" : "justify-start"
                          )}>
                            <Clock weight="bold" className="w-3 h-3" />
                            <span>{formatTime(msg.created_at)}</span>
                            {isOwnMessage && msg.is_read && (
                              <CheckCircle weight="fill" className="w-3 h-3 text-emerald-500" />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Payload Transmission Interface */}
              <div className="p-6 border-t border-border/50 bg-secondary/10">
                <div className="flex gap-4 relative">
                  <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 focus-within:opacity-100 transition-opacity rounded-3xl" />
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Compose neural payload..."
                    className="flex-1 bg-card border border-border/50 rounded-[24px] py-4 px-8 text-sm font-bold text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary transition-all shadow-inner relative z-10"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="h-[52px] w-[52px] p-0 rounded-2xl shadow-premium shrink-0 relative z-10 group/send"
                  >
                    <PaperPlaneTilt weight="bold" className="w-5 h-5 group-hover/send:-rotate-12 group-hover/send:scale-110 transition-all" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-10">
              <div className="text-center space-y-8 opacity-40">
                <div className="w-24 h-24 rounded-[48px] bg-secondary border border-border flex items-center justify-center mx-auto shadow-inner group">
                  <ChatCircle weight="duotone" className="w-12 h-12 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-black text-foreground uppercase tracking-widest">Select Protocol</h3>
                  <p className="text-sm text-muted-foreground font-medium max-w-xs mx-auto leading-relaxed italic">
                    Choose a conversation from the identity hub to establish a secure communication uplink.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}