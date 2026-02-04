'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatCircle, PaperPlaneTilt, User, MagnifyingGlass, Circle, Sparkle } from '@phosphor-icons/react';

interface Message {
  id: string;
  senderType: 'customer' | 'sales';
  messageText: string;
  messageType: 'text' | 'image' | 'treatment_recommendation';
  createdAt: string;
}

interface ChatSession {
  customerId: string;
  customerName: string;
  unreadCount: number;
  lastActivity: string;
  messages: Message[];
}

export default function ChatCenter({ salesId }: { salesId: string }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await fetch(`/api/chat?action=sessions&salesId=${salesId}`);
        const data = await res.json();
        if (data.success) {
          setSessions(data.data.sessions);
        }
      } catch (error) {
        console.error('Error fetching chat sessions:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchSessions();
  }, [salesId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeSession) return;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: activeSession.customerId,
          salesId: salesId,
          senderType: 'sales',
          messageText: newMessage,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const sentMessage = data.data.message;
        setActiveSession(prev => prev ? {
          ...prev,
          messages: [...prev.messages, sentMessage]
        } : null);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const filteredSessions = sessions.filter(s => 
    s.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="glass-card h-[600px] rounded-[40px] border border-white/10 overflow-hidden flex flex-col lg:flex-row">
      {/* Sidebar: Chat List */}
      <div className="w-full lg:w-80 border-r border-white/10 flex flex-col bg-white/5">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Intelligence Chat
            </h3>
            {sessions.reduce((acc, s) => acc + s.unreadCount, 0) > 0 && (
              <span className="bg-primary text-primary-foreground text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                NEW
              </span>
            )}
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-xs animate-pulse">Scanning channels...</div>
          ) : filteredSessions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-xs italic">No active channels found.</div>
          ) : (
            filteredSessions.map((session) => (
              <button
                key={session.customerId}
                onClick={() => setActiveSession(session)}
                className={`w-full p-4 flex items-center gap-3 transition-all border-b border-white/5 hover:bg-white/10 ${
                  activeSession?.customerId === session.customerId ? 'bg-white/10 border-l-4 border-l-primary' : ''
                }`}
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                    <User className="w-5 h-5" />
                  </div>
                  <Circle className="absolute bottom-0 right-0 w-3 h-3 text-emerald-500 fill-emerald-500 border-2 border-[#121212] rounded-full" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-bold text-white truncate">{session.customerName}</p>
                    <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                      {new Date(session.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate font-light">
                    {session.messages[session.messages.length - 1]?.messageText || 'Start conversation...'}
                  </p>
                </div>
                {session.unreadCount > 0 && (
                  <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center text-[9px] font-black text-primary-foreground">
                    {session.unreadCount}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-gradient-to-b from-transparent to-white/5">
        <AnimatePresence mode="wait">
          {activeSession ? (
            <motion.div
              key={activeSession.customerId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col"
            >
              {/* Chat Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{activeSession.customerName}</h4>
                    <p className="text-[9px] text-emerald-400 uppercase tracking-widest font-black flex items-center gap-1">
                      <Circle className="w-1.5 h-1.5 fill-emerald-400" />
                      Encrypted Channel
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 bg-white/5 border border-white/10 rounded-lg text-primary hover:bg-primary/10 transition-all tooltip" title="Send AI Recommendation">
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar bg-chat-pattern">
                {activeSession.messages.map((msg, idx) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`flex ${msg.senderType === 'sales' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      msg.senderType === 'sales' 
                        ? 'bg-primary text-primary-foreground rounded-tr-none shadow-premium' 
                        : 'bg-white/10 text-white rounded-tl-none border border-white/10 backdrop-blur-md'
                    }`}>
                      {msg.messageType === 'treatment_recommendation' && (
                        <div className="mb-2 p-2 bg-black/20 rounded-lg border border-white/10 flex items-center gap-2">
                          <Sparkles className="w-3 h-3 text-primary-foreground" />
                          <span className="text-[10px] font-black uppercase">Clinical Insight</span>
                        </div>
                      )}
                      <p className="font-light leading-relaxed">{msg.messageText}</p>
                      <p className={`text-[9px] mt-1 opacity-60 font-medium ${msg.senderType === 'sales' ? 'text-right' : 'text-left'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 bg-white/5 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type clinical advice..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="p-3 bg-primary text-primary-foreground rounded-xl shadow-premium hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4">
              <div className="w-20 h-20 rounded-[30px] bg-primary/5 border border-primary/10 flex items-center justify-center text-primary/40 animate-pulse">
                <MessageSquare className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-bold text-white uppercase tracking-tight">Select a Channel</h4>
                <p className="text-sm text-muted-foreground max-w-xs font-light">
                  Choose a customer conversation to start providing personalized aesthetic intelligence.
                </p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
