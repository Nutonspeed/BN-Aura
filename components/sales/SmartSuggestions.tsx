'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingBag,
  Clock,
  Warning,
  CheckCircle
} from '@phosphor-icons/react';
import { CustomerContext } from '@/lib/ai/salesCoach';

interface SmartSuggestionsProps {
  customerContext: CustomerContext;
  currentTreatments: string[];
}

interface UpsellRecommendation {
  product: string;
  reason: string;
  timing: string;
  priority: 'high' | 'medium' | 'low';
}

export default function SmartSuggestions({ 
  customerContext, 
  currentTreatments 
}: SmartSuggestionsProps) {
  const [recommendations, setRecommendations] = useState<UpsellRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/sales-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_upsell',
          context: customerContext,
          data: { currentTreatments }
        })
      });

      const result = await response.json();
      if (result.success && result.recommendations.recommendations) {
        setRecommendations(result.recommendations.recommendations);
        setExpanded(true);
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToOffer = (recommendation: UpsellRecommendation) => {
    console.log('Adding to offer:', recommendation);
    // TODO: Integrate with POS system or create customer offer
  };

  const handleMarkAsDone = (index: number) => {
    setRecommendations(prev => prev.filter((_, i) => i !== index));
  };

  const handleDismiss = (index: number) => {
    setRecommendations(prev => prev.filter((_, i) => i !== index));
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Warning className="w-4 h-4 text-red-500" />;
      case 'medium':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-500/30 bg-red-500/5';
      case 'medium':
        return 'border-yellow-500/30 bg-yellow-500/5';
      case 'low':
        return 'border-green-500/30 bg-green-500/5';
      default:
        return 'border-border bg-muted/20';
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">คำแนะนำการเพิ่มยอดขายโดย AI</h3>
          </div>
          <button
            onClick={fetchRecommendations}
            disabled={loading}
            className="text-sm px-3 py-1 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors disabled:opacity-50"
          >
            {loading ? 'กำลังวิเคราะห์...' : 'ขอคำแนะนำ'}
          </button>
        </div>
      </div>

      {/* Recommendations List */}
      {expanded && recommendations.length > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="p-4 space-y-3"
        >
          {recommendations.map((rec, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 border rounded-xl ${getPriorityColor(rec.priority)}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getPriorityIcon(rec.priority)}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-foreground">{rec.product}</h4>
                    <span className="text-xs px-2 py-1 bg-background/50 rounded-full text-muted-foreground">
                      {rec.timing === 'now' ? '⚡ ทันที' : 
                       rec.timing === 'after_treatment' ? '🕐 หลังการรับบริการ' : 
                       '📅 ติดตามผล'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{rec.reason}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <button 
                      onClick={() => handleAddToOffer(rec)}
                      className="flex-1 text-xs px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                    >
                      + เพิ่มในข้อเสนอ
                    </button>
                    <button 
                      onClick={() => handleMarkAsDone(index)}
                      className="text-xs px-3 py-2 bg-emerald-500/10 text-emerald-600 rounded-lg hover:bg-emerald-500/20 transition-colors font-medium"
                    >
                      ✓ เสร็จสิ้น
                    </button>
                    <button 
                      onClick={() => handleDismiss(index)}
                      className="text-xs px-3 py-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {expanded && recommendations.length === 0 && !loading && (
        <div className="p-8 text-center text-muted-foreground">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">ไม่พบคำแนะนำเพิ่มเติมในขณะนี้</p>
        </div>
      )}
    </div>
  );
}