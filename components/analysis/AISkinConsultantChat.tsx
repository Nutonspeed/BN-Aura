'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface QuickAction {
  id: string;
  labelThai: string;
  action: string;
}

interface AISkinConsultantChatProps {
  customerId?: string;
  skinScore?: number;
  skinAge?: number;
  concerns?: string[];
  onBookAppointment?: () => void;
  onViewAnalysis?: () => void;
}

const SUGGESTED_QUESTIONS = [
  'สิวรักษายังไงดี?',
  'ฝ้าหายได้ไหม?',
  'ริ้วรอยลดได้ยังไง?',
  'รูขุมขนกว้างแก้ได้ไหม?',
  'ราคา Treatment เท่าไหร่?',
  'นัดปรึกษาได้ไหม?',
];

export default function AISkinConsultantChat({
  customerId,
  skinScore,
  skinAge,
  concerns = [],
  onBookAppointment,
  onViewAnalysis,
}: AISkinConsultantChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize session
  useEffect(() => {
    initSession();
  }, []);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initSession = async () => {
    try {
      const response = await fetch('/api/analysis/consultant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          customerId: customerId || 'GUEST',
          context: { skinScore, skinAge, concerns },
        }),
      });
      const data = await response.json();
      if (data.success) {
        setSessionId(data.data.sessionId);
        setMessages(data.data.messages.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
        })));
      }
    } catch (error) {
      console.error('Init session error:', error);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/analysis/consultant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          sessionId,
          message: text,
        }),
      });
      const data = await response.json();
      
      if (data.success && data.data.response) {
        const assistantMessage: Message = {
          id: data.data.response.message.id,
          role: 'assistant',
          content: data.data.response.message.content,
          timestamp: data.data.response.message.timestamp,
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Send message error:', error);
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'ขออภัยค่ะ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-purple-500/10 to-pink-500/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-white text-lg">🤖</span>
          </div>
          <div>
            <h3 className="font-semibold">Aura AI Consultant</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              พร้อมให้คำปรึกษา 24/7
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-3',
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-muted rounded-bl-sm'
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className={cn(
                'text-xs mt-1',
                message.role === 'user' ? 'text-primary-foreground/60' : 'text-muted-foreground'
              )}>
                {new Date(message.timestamp).toLocaleTimeString('th-TH', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-muted-foreground mb-2">💡 คำถามยอดนิยม:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                className="px-3 py-1 text-xs bg-purple-500/10 text-purple-300 rounded-full hover:bg-purple-500/20 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="px-4 pb-2 flex gap-2">
        <Button 
          size="sm" 
          variant="outline" 
          className="text-xs"
          onClick={onBookAppointment}
        >
          📅 นัดหมาย
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          className="text-xs"
          onClick={onViewAnalysis}
        >
          📊 ดูผลวิเคราะห์
        </Button>
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="พิมพ์คำถามของคุณ..."
            className="flex-1 px-4 py-2 bg-muted rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isLoading}
          />
          <Button
            size="sm"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="rounded-full px-4"
          >
            ➤
          </Button>
        </div>
      </div>
    </Card>
  );
}
