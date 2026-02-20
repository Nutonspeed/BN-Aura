'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkle,
  TrendUp,
  ChatCircle,
  Lightbulb,
  Target,
  WarningCircle,
  ShoppingCart,
  PaperPlaneTilt,
  ArrowRight,
  Star,
  Lightning,
  Clock
} from '@phosphor-icons/react';
import { CustomerContext, SalesCoachResponse } from '@/lib/ai/salesCoach';
import { conversationManager } from '@/lib/conversations/conversationManager';
import { createClient } from '@/lib/supabase/client';

interface AICoachPanelProps {
  customerContext: CustomerContext;
  currentConversation: string;
  onSuggestionApply?: (suggestion: string) => void;
}

interface ObjectionResponse {
  objectionType: string;
  response: string;
  alternativeApproach: string;
}

interface UpsellItem {
  product: string;
  reason: string;
  timing: string;
  priority: 'high' | 'medium' | 'low';
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
  
  // Objection handling state
  const [objectionInput, setObjectionInput] = useState('');
  const [objectionLoading, setObjectionLoading] = useState(false);
  const [objectionResponse, setObjectionResponse] = useState<ObjectionResponse | null>(null);
  
  // Upsell state
  const [upsellItems, setUpsellItems] = useState<UpsellItem[]>([]);
  const [upsellLoading, setUpsellLoading] = useState(false);
  
  // Active tab
  const [activeTab, setActiveTab] = useState<'advice' | 'objection' | 'upsell'>('advice');
  
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
        customerContext.name,
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

  const handleObjection = async () => {
    if (!objectionInput.trim()) return;
    setObjectionLoading(true);
    try {
      const response = await fetch('/api/ai/sales-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'handle_objection',
          context: customerContext,
          data: { objection: objectionInput }
        })
      });

      const result = await response.json();
      if (result.success) {
        setObjectionResponse(result.response);
        
        // Track objection in conversation
        if (conversationId) {
          await conversationManager.trackObjection(conversationId, objectionInput);
          await conversationManager.addMessage(conversationId, {
            role: 'customer',
            content: objectionInput,
            metadata: { objectionType: result.response.objectionType }
          });
          await conversationManager.addMessage(conversationId, {
            role: 'ai_coach',
            content: result.response.response,
          });
        }
      }
    } catch (error) {
      console.error('Failed to handle objection:', error);
    } finally {
      setObjectionLoading(false);
    }
  };

  const fetchUpsell = async () => {
    setUpsellLoading(true);
    try {
      const response = await fetch('/api/ai/sales-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_upsell',
          context: customerContext,
          data: { currentTreatments: customerContext.previousTreatments || [] }
        })
      });

      const result = await response.json();
      if (result.success && result.recommendations?.recommendations) {
        setUpsellItems(result.recommendations.recommendations);
        
        // Track discussed products
        if (conversationId) {
          for (const item of result.recommendations.recommendations) {
            await conversationManager.trackProduct(conversationId, item.product);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch upsell:', error);
    } finally {
      setUpsellLoading(false);
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

  // Auto-fetch upsell when tab switches
  useEffect(() => {
    if (activeTab === 'upsell' && upsellItems.length === 0 && !upsellLoading) {
      fetchUpsell();
    }
  }, [activeTab]);

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
              <h3 className="font-bold text-foreground">ผู้ช่วยฝ่ายขาย AI</h3>
              <p className="text-xs text-muted-foreground">ระบบช่วยแนะนำการขายอัจฉริยะ</p>
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

      {/* โอกาสในการปิดยอดขาย Meter */}
      {dealProbability !== null && (
        <div className="p-4 border-b border-border bg-gradient-to-br from-background to-muted/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground flex items-center gap-2">
              <Target className="w-4 h-4" />
              โอกาสในการปิดยอดขาย
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

      {/* Tab Navigation */}
      <div className="flex border-b border-border">
        {[
          { id: 'advice' as const, label: 'คำแนะนำ', icon: Lightbulb },
          { id: 'objection' as const, label: 'ข้อโต้แย้ง', icon: WarningCircle },
          { id: 'upsell' as const, label: 'การเสนอขายเพิ่มเติม', icon: ShoppingCart },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              activeTab === tab.id
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4 max-h-[400px] overflow-y-auto space-y-4">
        {/* === ADVICE TAB === */}
        {activeTab === 'advice' && (
          <>
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
                  {/* คำแนะนำหลัก */}
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

                  {/* หัวข้อการสนทนาที่แนะนำ */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                      <ChatCircle className="w-4 h-4 text-primary" />
                      หัวข้อการสนทนาที่แนะนำ
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

                  {/* กลยุทธ์การปิดการขาย */}
                  <div className="p-3 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl">
                    <div className="flex items-start gap-2">
                      <Target className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-sm text-foreground mb-1">กลยุทธ์การปิดการขาย</h4>
                        <p className="text-sm text-foreground/90">{advice.closingTechnique}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">เริ่มการสนทนาเพื่อรับคำแนะนำจากผู้ช่วย AI</p>
              </div>
            )}
          </>
        )}

        {/* === OBJECTION TAB === */}
        {activeTab === 'objection' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                ข้อโต้แย้งของลูกค้า
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={objectionInput}
                  onChange={e => setObjectionInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleObjection()}
                  placeholder="เช่น แพงเกินไป, ต้องคิดดูก่อน..."
                  className="flex-1 px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  onClick={handleObjection}
                  disabled={objectionLoading || !objectionInput.trim()}
                  className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:brightness-110 transition disabled:opacity-50"
                >
                  {objectionLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <PaperPlaneTilt className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Quick objection buttons */}
            <div className="flex flex-wrap gap-1.5">
              {['ราคาแพงเกินไป', 'ต้องคิดดูก่อน', 'ไม่แน่ใจว่าได้ผล', 'ไม่มีเวลา'].map(obj => (
                <button
                  key={obj}
                  onClick={() => { setObjectionInput(obj); }}
                  className="text-[10px] px-2 py-1 bg-muted/50 border border-border rounded-full text-muted-foreground hover:text-foreground hover:border-primary/30 transition"
                >
                  {obj}
                </button>
              ))}
            </div>

            {/* ข้อโต้แย้ง Response */}
            {objectionResponse && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                    {objectionResponse.objectionType}
                  </span>
                </div>

                <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl">
                  <div className="flex items-start gap-2">
                    <ChatCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-xs text-foreground mb-1">คำตอบที่แนะนำ</h4>
                      <p className="text-sm text-foreground/90">{objectionResponse.response}</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-muted/30 border border-border rounded-xl">
                  <div className="flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-xs text-foreground mb-1">วิธีการอื่น</h4>
                      <p className="text-sm text-foreground/80">{objectionResponse.alternativeApproach}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onSuggestionApply?.(objectionResponse.response)}
                  className="w-full py-2 text-xs font-bold text-primary hover:bg-primary/5 rounded-lg transition"
                >
                  ใช้คำตอบนี้
                </button>
              </motion.div>
            )}
          </div>
        )}

        {/* === UPSELL TAB === */}
        {activeTab === 'upsell' && (
          <div className="space-y-3">
            {upsellLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : upsellItems.length > 0 ? (
              upsellItems.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 bg-muted/30 border border-border rounded-xl hover:border-primary/30 transition"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <ShoppingCart className="w-4 h-4 text-primary" />
                      {item.product}
                    </h4>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                      item.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                      item.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {item.priority}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/80 mb-2">{item.reason}</p>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>ช่วงเวลาที่แนะนำ: {item.timing === 'now' ? 'นำเสนอทันที' : item.timing === 'after_treatment' ? 'หลังการรักษา' : 'ติดตามผล'}</span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">ยังไม่มีข้อมูลการเสนอขายเพิ่มเติม</p>
                <button
                  onClick={fetchUpsell}
                  className="mt-3 text-xs text-primary hover:underline"
                >
                  รับคำแนะนำใหม่
                </button>
              </div>
            )}

            {upsellItems.length > 0 && (
              <button
                onClick={fetchUpsell}
                disabled={upsellLoading}
                className="w-full py-2 text-xs font-bold text-primary hover:bg-primary/5 rounded-lg transition disabled:opacity-50"
              >
                <Lightning className="w-3.5 h-3.5 inline mr-1" />
                อัปเดตคำแนะนำ
              </button>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t border-border bg-muted/30">
        <button
          onClick={activeTab === 'advice' ? fetchAdvice : activeTab === 'upsell' ? fetchUpsell : handleObjection}
          disabled={loading || objectionLoading || upsellLoading}
          className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Sparkle className="w-4 h-4" />
          {loading || objectionLoading || upsellLoading ? 'กำลังวิเคราะห์...' : 
           activeTab === 'advice' ? 'รับคำแนะนำใหม่' :
           activeTab === 'objection' ? 'จัดการข้อโต้แย้ง' : 'รับไอเดียการเสนอขายเพิ่ม'}
        </button>
      </div>
    </motion.div>
  );
}
