'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChatCircle, 
  PaperPlaneTilt, 
  X, 
  User, 
  Sparkle,
  Circle,
  SpinnerGap
} from '@phosphor-icons/react';

interface Message {
  id: string;
  senderType: 'customer' | 'sales';
  messageText: string;
  messageType: 'text' | 'image' | 'treatment_recommendation';
  createdAt: string;
}

export default function DirectChat({ 
  customerId, 
  salesId, 
  salesName,
  isOpen,
  onClose 
}: { 
  customerId: string; 
  salesId: string;
  salesName: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/chat?action=history&customerId=${customerId}&salesId=${salesId}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.data.messages);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    } finally {
      setLoading(false);
    }
  }, [customerId, salesId]);

  useEffect(() => {
    if (isOpen) {
      fetchChatHistory();
    }
  }, [isOpen, fetchChatHistory]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const text = newMessage;
    setNewMessage('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          salesId,
          senderType: 'customer',
          messageText: text,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, data.data.message]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />

          {/* Chat Window */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-6 right-6 w-full max-w-[400px] h-[600px] bg-[#121212] border border-white/10 rounded-[40px] shadow-2xl z-[70] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{salesName}</h4>
                  <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-black flex items-center gap-1">
                    <Circle className="w-1.5 h-1.5 fill-emerald-400" />
                    Your Personal Advisor
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center space-y-2 opacity-50">
                  <SpinnerGap className="w-6 h-6 animate-spin text-primary" />
                  <p className="text-[10px] uppercase tracking-widest">Securing Channel...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                  <ChatCircle className="w-12 h-12" />
                  <p className="text-xs font-light max-w-[200px]">Start a conversation with your advisor for personalized insights.</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`flex ${msg.senderType === 'customer' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                      msg.senderType === 'customer'
                        ? 'bg-primary text-primary-foreground rounded-tr-none shadow-premium'
                        : 'bg-white/10 text-white rounded-tl-none border border-white/10'
                    }`}>
                      {msg.messageType === 'treatment_recommendation' && (
                        <div className="mb-2 p-2 bg-black/20 rounded-lg border border-white/10 flex items-center gap-2">
                          <Sparkle className="w-3.5 h-3.5 text-primary" />
                          <span className="text-[10px] font-black uppercase tracking-tighter text-primary">Advisor Suggestion</span>
                        </div>
                      )}
                      <p className="font-light leading-relaxed">{msg.messageText}</p>
                      <p className="text-[9px] mt-1 opacity-50 text-right">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white/5 border-t border-white/10">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ask your advisor..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="p-3 bg-primary text-primary-foreground rounded-2xl shadow-premium hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all"
                >
                  <PaperPlaneTilt className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
