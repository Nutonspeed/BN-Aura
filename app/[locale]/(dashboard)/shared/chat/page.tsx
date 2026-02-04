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
  ArrowLeft
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';

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
  const isOwnerOrAdmin = ['clinic_owner', 'clinic_admin'].includes(userRole);

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
      fetchMessages(selectedSession.id);
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
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat?action=history&sessionId=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
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
          action: 'send',
          sessionId: selectedSession.id,
          content: input
        })
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const filteredSessions = sessions.filter(session => 
    session.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.sales_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getOtherPartyName = (session: ChatSession) => {
    if (isCustomer) return session.sales_name || 'My Sales Advisor';
    return session.customer_name || 'Customer';
  };

  if (!isClient) {
    return (
      <div className="h-[calc(100vh-160px)] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-[calc(100vh-160px)] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">
              {isCustomer ? 'Chat with Your Advisor' : 'Customer Messages'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {isCustomer ? 'Direct line to your sales representative' : `${sessions.length} conversations`}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sessions List */}
        <div className={cn(
          "w-full md:w-80 border-r border-white/10 flex flex-col bg-white/[0.02]",
          selectedSession && "hidden md:flex"
        )}>
          {/* Search */}
          <div className="p-3 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>

          {/* Sessions */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">
                Loading conversations...
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No conversations yet</p>
              </div>
            ) : (
              filteredSessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className={cn(
                    "w-full p-4 flex items-start gap-3 hover:bg-white/5 transition-colors border-b border-white/5",
                    selectedSession?.id === session.id && "bg-primary/10"
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white truncate">
                        {getOtherPartyName(session)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDate(session.last_message_at)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                      {session.last_message || 'No messages yet'}
                    </p>
                  </div>
                  {session.unread_count > 0 && (
                    <span className="w-5 h-5 rounded-full bg-primary text-[10px] font-bold flex items-center justify-center text-primary-foreground">
                      {session.unread_count}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={cn(
          "flex-1 flex flex-col",
          !selectedSession && "hidden md:flex"
        )}>
          {selectedSession ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-white/10 flex items-center gap-3">
                <button
                  onClick={() => setSelectedSession(null)}
                  className="md:hidden p-2 hover:bg-white/5 rounded-lg"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-white">
                    {getOtherPartyName(selectedSession)}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {isCustomer ? 'Your dedicated advisor' : 'Customer'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-white/5 rounded-lg text-muted-foreground">
                    <Phone className="w-5 h-5" />
                  </button>
                  <button className="p-2 hover:bg-white/5 rounded-lg text-muted-foreground">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence mode="popLayout">
                  {messages.map((msg) => {
                    const isOwnMessage = (isCustomer && msg.sender_type === 'customer') || 
                                         (isSales && msg.sender_type === 'sales');
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "flex",
                          isOwnMessage ? "justify-end" : "justify-start"
                        )}
                      >
                        <div className={cn(
                          "max-w-[75%] rounded-2xl px-4 py-3",
                          isOwnMessage 
                            ? "bg-primary text-primary-foreground rounded-br-sm" 
                            : "bg-white/10 text-white rounded-bl-sm"
                        )}>
                          <p className="text-sm">{msg.content}</p>
                          <p className={cn(
                            "text-[10px] mt-1",
                            isOwnMessage ? "text-primary-foreground/60" : "text-muted-foreground"
                          )}>
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-white/10">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="px-4 bg-primary text-primary-foreground rounded-xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-medium text-white mb-2">Select a conversation</h3>
                <p className="text-sm">Choose a conversation from the list to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
