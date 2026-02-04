'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fire, TrendUp, Phone, EnvelopeSimple, Clock, X } from '@phosphor-icons/react';
import { PrioritizedLead } from '@/lib/ai/leadPrioritizer';

export default function HotLeadsAlert() {
  const [hotLeads, setHotLeads] = useState<PrioritizedLead[]>([]);
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHotLeads();
    // Refresh every 5 minutes
    const interval = setInterval(fetchHotLeads, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchHotLeads = async () => {
    try {
      const response = await fetch('/api/ai/lead-prioritizer');
      const result = await response.json();
      
      if (result.success && result.alert) {
        setHotLeads(result.alert.leads);
        setCount(result.alert.count);
        setMessage(result.alert.message);
        
        if (result.alert.count > 0) {
          setShowAlert(true);
        }
      }
    } catch (error) {
      console.error('Failed to fetch hot leads:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (!showAlert || count === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4"
      >
        <div className="bg-gradient-to-r from-red-500/20 via-orange-500/20 to-yellow-500/20 backdrop-blur-xl border-2 border-red-500/30 rounded-2xl shadow-premium overflow-hidden">
          {/* Header */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatType: 'loop'
                }}
                className="p-3 bg-red-500/20 rounded-xl"
              >
                <Flame className="w-6 h-6 text-red-500" />
              </motion.div>
              <div>
                <h3 className="font-bold text-lg text-foreground">{message}</h3>
                <p className="text-sm text-muted-foreground">ควรติดตามทันทีเพื่อเพิ่มโอกาสปิดการขาย</p>
              </div>
            </div>
            <button
              onClick={() => setShowAlert(false)}
              className="p-2 hover:bg-background/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Hot Leads List */}
          <div className="px-4 pb-4 space-y-2 max-h-96 overflow-y-auto">
            {hotLeads.slice(0, 5).map((lead, index) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-card/80 backdrop-blur-sm border border-border rounded-xl hover:border-primary/50 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {lead.name}
                      </h4>
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-500 text-xs font-bold rounded-full">
                        {lead.priorityScore}
                      </span>
                    </div>

                    {/* Contact Info */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {lead.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <span className="text-xs">{lead.email}</span>
                        </div>
                      )}
                      {lead.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span className="text-xs">{lead.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Skin Concerns */}
                    {lead.skinAnalysis?.concerns && lead.skinAnalysis.concerns.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {lead.skinAnalysis.concerns.map((concern, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
                          >
                            {concern}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Recommended Action */}
                    <div className="flex items-start gap-2 p-2 bg-primary/5 border border-primary/20 rounded-lg">
                      <TrendingUp className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-foreground/80">{lead.recommendedAction}</p>
                    </div>

                    {/* Best Contact Time */}
                    {lead.bestContactTime && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{lead.bestContactTime}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    <button className="p-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors">
                      <Phone className="w-4 h-4" />
                    </button>
                    <button className="p-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors">
                      <Mail className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* View All Button */}
          {count > 5 && (
            <div className="p-4 border-t border-border bg-muted/30">
              <button className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:brightness-110 transition-all">
                ดู Hot Leads ทั้งหมด ({count})
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
