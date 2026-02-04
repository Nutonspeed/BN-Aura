'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkle, TrendUp, ChatCircle, Lightbulb, Target, WarningCircle } from '@phosphor-icons/react';
import { CustomerContext, SalesCoachResponse } from '@/lib/ai/salesCoach';
import { conversationManager } from '@/lib/conversations/conversationManager';
import { createClient } from '@/lib/supabase/client';

interface AICoachPanelProps {
  customerContext: CustomerContext;
  currentConversation: string;
  onSuggestionApply?: (suggestion: string) => void;
}

export default function AICoachPanel({ 
  customerContext, 
  currentConversation,
  onSuggestionApply 
}: AICoachPanelProps) {
  const [advice, setAdvice] = useState<SalesCoachResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [dealProbability, setDealProbability] = useState<number | null>(null);
  const [showPanel, setShowPanel] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [clinicId, setClinicId] = useState<string>('');
  
  const supabase = createClient();

  // Initialize or resume conversation
  useEffect(() => {
    async function initConversation() {
      if (!customerContext) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUserId(user.id);
      const clinic = user.user_metadata?.clinic_id || '';
      setClinicId(clinic);
      
      // Try to get active conversation
      const activeConv = await conversationManager.getActiveConversation(
        customerContext.name, // Using name as customer ID for demo
        user.id
      );
      
      if (activeConv) {
        setConversationId(activeConv.id);
        if (activeConv.deal_probability) {
          setDealProbability(activeConv.deal_probability);
        }
      } else {
        // Start new conversation
        const newConvId = await conversationManager.startConversation({
          customerId: customerContext.name,
          salesStaffId: user.id,
          clinicId: clinic,
          type: 'ai_coach'
        });
        setConversationId(newConvId);
      }
    }
    
    initConversation();
  }, [customerContext, supabase]);

  // Auto-refresh advice when conversation changes
  useEffect(() => {
    if (currentConversation.length > 50) {
      fetchAdvice();
    }
  }, [currentConversation]);

  const fetchAdvice = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/sales-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_advice',
          context: customerContext,
          data: { conversation: currentConversation }
        })
      });

      const result = await response.json();
      if (result.success) {
        setAdvice(result.advice);
        
        // Save AI suggestion to conversation
        if (conversationId) {
          await conversationManager.addMessage(conversationId, {
            role: 'ai_coach',
            content: result.advice.suggestion,
            metadata: {
              confidence: result.advice.confidence,
              talkingPoints: result.advice.talkingPoints,
              closingTechnique: result.advice.closingTechnique
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch AI advice:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProbability = async () => {
    try {
      const response = await fetch('/api/ai/sales-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'calculate_probability',
          context: customerContext,
          data: {
            conversationMetrics: {
              duration: 10,
              questionsAsked: 3,
              objections: 1,
              positiveSignals: 2
            }
          }
        })
      });

      const result = await response.json();
      if (result.success) {
        const probability = result.probability.probability;
        setDealProbability(probability);
        
        // Update conversation with deal probability
        if (conversationId) {
          await conversationManager.updateDealProbability(conversationId, probability);
        }
      }
    } catch (error) {
      console.error('Failed to calculate probability:', error);
    }
  };

  useEffect(() => {
    calculateProbability();
  }, [customerContext]);

  if (!showPanel) {
    return (
      <motion.button
        onClick={() => setShowPanel(true)}
        className="fixed bottom-6 right-6 p-4 bg-primary text-primary-foreground rounded-full shadow-premium hover:scale-110 transition-transform z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Sparkle className="w-6 h-6" />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="fixed right-6 top-24 w-96 bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-premium overflow-hidden z-40"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/20 to-primary/10 p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Sparkle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">AI Sales Coach</h3>
              <p className="text-xs text-muted-foreground">Real-time Assistance</p>
            </div>
          </div>
          <button
            onClick={() => setShowPanel(false)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Deal Probability Meter */}
      {dealProbability !== null && (
        <div className="p-4 border-b border-border bg-gradient-to-br from-background to-muted/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground flex items-center gap-2">
              <Target className="w-4 h-4" />
              โอกาสปิดการขาย
            </span>
            <span className={`text-2xl font-bold ${
              dealProbability >= 70 ? 'text-green-500' :
              dealProbability >= 40 ? 'text-yellow-500' :
              'text-red-500'
            }`}>
              {dealProbability}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${dealProbability}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full ${
                dealProbability >= 70 ? 'bg-green-500' :
                dealProbability >= 40 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
            />
          </div>
        </div>
      )}

      {/* AI Advice Content */}
      <div className="p-4 max-h-[500px] overflow-y-auto space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : advice ? (
          <AnimatePresence mode="wait">
            <motion.div
              key="advice"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Main Suggestion */}
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl">
                <div className="flex items-start gap-2 mb-2">
                  <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-foreground mb-1">คำแนะนำหลัก</h4>
                    <p className="text-sm text-foreground/90">{advice.suggestion}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <TrendUp className="w-3 h-3" />
                  <span>ความมั่นใจ: {advice.confidence}%</span>
                </div>
              </div>

              {/* Talking Points */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <ChatCircle className="w-4 h-4 text-primary" />
                  จุดขายสำคัญ
                </h4>
                {advice.talkingPoints.map((point, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-2 p-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => onSuggestionApply?.(point)}
                  >
                    <span className="text-primary font-bold text-sm">{index + 1}.</span>
                    <span className="text-sm text-foreground/80">{point}</span>
                  </motion.div>
                ))}
              </div>

              {/* Closing Technique */}
              <div className="p-3 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl">
                <div className="flex items-start gap-2">
                  <Target className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm text-foreground mb-1">เทคนิคปิดการขาย</h4>
                    <p className="text-sm text-foreground/90">{advice.closingTechnique}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">เริ่มสนทนากับลูกค้าเพื่อรับคำแนะนำจาก AI</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t border-border bg-muted/30">
        <button
          onClick={fetchAdvice}
          disabled={loading}
          className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Sparkle className="w-4 h-4" />
          {loading ? 'กำลังวิเคราะห์...' : 'รับคำแนะนำใหม่'}
        </button>
      </div>
    </motion.div>
  );
}
