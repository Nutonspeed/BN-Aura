'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PaperPlaneTilt, 
  Sparkle, 
  TrendUp, 
  Users, 
  CurrencyDollar, 
  Star, 
  Target,
  ChartBar,
  SpinnerGap
} from '@phosphor-icons/react';
import { BusinessInsight, QUICK_QUESTIONS } from '@/lib/ai/businessAdvisor';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  insight?: BusinessInsight;
  timestamp: Date;
}

export default function AIAdvisorChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'สวัสดีครับ! ผมคือ AI Business Advisor ของคุณ สามารถถามคำถามเกี่ยวกับธุรกิจเป็นภาษาไทยได้เลยครับ',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleQuickQuestion = async (question: string) => {
    await sendMessage(question);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;
    
    await sendMessage(inputValue);
    setInputValue('');
  };

  const sendMessage = async (question: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: question,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await fetch('/api/ai/business-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'query',
          query: question,
          timeframe: 'month'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const result = await response.json();

      if (result.success && result.insight) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: result.insight.answer,
          insight: result.insight,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('AI Chat Error:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'ขออภัยครับ ไม่สามารถประมวลผลคำถามได้ในขณะนี้ กรุณาลองใหม่อีกครั้งครับ',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const getQuickQuestionIcon = (category: string) => {
    switch (category) {
      case 'revenue': return <CurrencyDollar className="w-4 h-4" />;
      case 'customers': return <Users className="w-4 h-4" />;
      case 'treatments': return <Star className="w-4 h-4" />;
      case 'staff': return <Target className="w-4 h-4" />;
      case 'strategy': return <TrendUp className="w-4 h-4" />;
      case 'expenses': return <ChartBar className="w-4 h-4" />;
      default: return <Sparkle className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/20 rounded-xl">
            <Sparkle className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">AI Business Advisor</h3>
            <p className="text-sm text-muted-foreground">ถามคำถามเกี่ยวกับธุรกิจเป็นภาษาไทย</p>
          </div>
        </div>
      </div>

      {/* Quick Questions */}
      <div className="p-4 border-b border-border bg-muted/20">
        <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">คำถามด่วน</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_QUESTIONS.slice(0, 4).map((q, index) => (
            <motion.button
              key={index}
              onClick={() => handleQuickQuestion(q.question)}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-lg text-xs hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-primary group-hover:animate-pulse">
                {getQuickQuestionIcon(q.category)}
              </span>
              <span className="text-foreground/80 group-hover:text-foreground transition-colors">
                {q.question}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-2xl ${
                  message.type === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-foreground'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                
                {/* AI Insight Visualization */}
                {message.insight && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 p-4 bg-background/50 rounded-xl border border-border space-y-3"
                  >
                    {/* Data Display */}
                    {message.insight.data && (
                      <div className="flex items-center gap-4">
                        {message.insight.data.formatted && (
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                              {message.insight.data.formatted}
                            </div>
                            {message.insight.data.change && (
                              <div className={`text-xs ${
                                message.insight.data.trend === 'up' ? 'text-green-500' : 
                                message.insight.data.trend === 'down' ? 'text-red-500' : 
                                'text-muted-foreground'
                              }`}>
                                {message.insight.data.change}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Recommendations */}
                    {message.insight.recommendations && message.insight.recommendations.length > 0 && (
                      <div>
                        <h5 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">
                          คำแนะนำ
                        </h5>
                        <ul className="space-y-1">
                          {message.insight.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start gap-2 text-xs text-muted-foreground">
                              <span className="text-primary">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Confidence Score */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>ความมั่นใจ: {message.insight.confidence}%</span>
                      {message.insight.severity && (
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          message.insight.severity === 'critical' ? 'bg-red-500/20 text-red-500' :
                          message.insight.severity === 'high' ? 'bg-orange-500/20 text-orange-500' :
                          message.insight.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                          'bg-green-500/20 text-green-500'
                        }`}>
                          {message.insight.severity.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </motion.div>
                )}

                <p className="text-xs opacity-50 mt-2">
                  {message.timestamp.toLocaleTimeString('th-TH', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-muted/50 p-4 rounded-2xl flex items-center gap-3">
              <SpinnerGap className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">AI กำลังคิด...</span>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-muted/20">
        <div className="flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={loading}
            placeholder="ถามคำถามเกี่ยวกับธุรกิจ... เช่น 'รายได้เดือนนี้เป็นยังไง?'"
            className="flex-1 px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <motion.button
            type="submit"
            disabled={loading || !inputValue.trim()}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <PaperPlaneTilt className="w-4 h-4" />
          </motion.button>
        </div>
      </form>
    </div>
  );
}
