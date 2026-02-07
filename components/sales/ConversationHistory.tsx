'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChatCircle,
  Clock,
  TrendUp,
  X,
  CaretRight
} from '@phosphor-icons/react';
import { conversationManager, Conversation } from '@/lib/conversations/conversationManager';
import { cn } from '@/lib/utils';

interface ConversationHistoryProps {
  customerId: string;
  onSelectConversation?: (conversation: Conversation) => void;
}

export default function ConversationHistory({ 
  customerId, 
  onSelectConversation 
}: ConversationHistoryProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    loadConversations();
  }, [customerId]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const history = await conversationManager.getConversationHistory(customerId, 10);
      setConversations(history);
    } catch (err) {
      console.error('Failed to load conversation history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (conv: Conversation) => {
    setSelectedId(conv.id);
    if (onSelectConversation) {
      onSelectConversation(conv);
    }
  };

  const getProbabilityColor = (probability: number | null) => {
    if (!probability) return 'text-muted-foreground';
    if (probability >= 70) return 'text-emerald-400';
    if (probability >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      abandoned: 'bg-red-500/10 text-red-400 border-red-500/20'
    };
    
    const labels = {
      active: 'กำลังดำเนินการ',
      completed: 'สำเร็จ',
      abandoned: 'ยกเลิก'
    };

    return (
      <span className={cn(
        'px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border',
        styles[status as keyof typeof styles] || styles.active
      )}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="glass-card p-6 rounded-[32px] border border-white/10 space-y-4">
        <div className="flex items-center gap-3">
          <ChatCircle className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Conversation History
          </h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="glass-card p-6 rounded-[32px] border border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <ChatCircle className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Conversation History
          </h3>
        </div>
        <div className="text-center py-8 opacity-50">
          <ChatCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-xs text-muted-foreground">
            ยังไม่มีประวัติการสนทนา
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 rounded-[32px] border border-white/10 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ChatCircle className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Conversation History
          </h3>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {conversations.length} การสนทนา
        </span>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {conversations.map((conv, idx) => (
            <motion.div
              key={conv.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => handleSelect(conv)}
              className={cn(
                'p-4 rounded-2xl border cursor-pointer transition-all group',
                selectedId === conv.id
                  ? 'bg-primary/10 border-primary/40'
                  : 'bg-white/5 border-white/10 hover:border-primary/30 hover:bg-white/10'
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(conv.status)}
                    <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
                      {new Date(conv.created_at).toLocaleDateString('th-TH', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-white font-medium line-clamp-2">
                    {conv.summary || `${(conv.messages || []).length} ข้อความ`}
                  </p>
                </div>
                <CaretRight className={cn(
                  'w-4 h-4 text-muted-foreground transition-all',
                  selectedId === conv.id ? 'text-primary rotate-90' : 'group-hover:text-white group-hover:translate-x-1'
                )} />
              </div>

              <div className="flex items-center gap-4 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-primary/60" />
                  <span className="text-muted-foreground">
                    {(conv.messages || []).length} ข้อความ
                  </span>
                </div>
                {conv.deal_probability !== null && (
                  <div className="flex items-center gap-1.5">
                    <TrendUp className="w-3 h-3 text-primary/60" />
                    <span className={cn('font-bold', getProbabilityColor(conv.deal_probability))}>
                      {conv.deal_probability}%
                    </span>
                  </div>
                )}
              </div>

              {conv.objections_handled && conv.objections_handled.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1.5">
                    ข้อโต้แย้งที่จัดการแล้ว
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {conv.objections_handled.slice(0, 3).map((obj, i) => (
                      <span 
                        key={i}
                        className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-lg text-[9px] text-white"
                      >
                        {obj}
                      </span>
                    ))}
                    {conv.objections_handled.length > 3 && (
                      <span className="text-[9px] text-muted-foreground">
                        +{conv.objections_handled.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}