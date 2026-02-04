'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Question, Book, ChatCircle, PlayCircle, CaretRight, Lightning, Shield, MagnifyingGlass, ShoppingCart } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: string;
}

export default function HelpModal({ isOpen, onClose, role }: HelpModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const guides = [
    {
      title: "Point of Sale (POS)",
      desc: "Learn how to process treatments, products, and QR PromptPay settlements.",
      icon: ShoppingCart,
      color: "text-primary"
    },
    {
      title: "Clinical Orchestration",
      desc: "Managing patient journeys, treatment protocols, and daily staff queues.",
      icon: Book,
      color: "text-blue-400"
    },
    {
      title: "AI Skin Intelligence",
      desc: "How to use neural mapping, AR simulation, and evolution deltas.",
      icon: Zap,
      color: "text-amber-400"
    },
    {
      title: "Resource Scaling",
      desc: "Managing subscription tiers, AI quotas, and regional branch clusters.",
      icon: Shield,
      color: "text-emerald-400"
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-[40px] p-10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight text-glow">Intelligence Center</h3>
                  <p className="text-sm text-muted-foreground italic font-light tracking-tight">Accessing documentation node for {role.replace('_', ' ')}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl transition-colors text-muted-foreground hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input 
                type="text"
                placeholder="Query system manual..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-all shadow-inner"
              />
            </div>

            {/* Guides Grid */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {guides.map((guide, i) => (
                  <button
                    key={i}
                    className="p-6 bg-white/5 border border-white/5 rounded-3xl hover:border-primary/30 transition-all text-left group"
                  >
                    <div className={cn("w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform", guide.color)}>
                      <guide.icon className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1 group-hover:text-primary transition-colors">{guide.title}</h4>
                    <p className="text-[10px] text-muted-foreground font-light leading-relaxed italic">{guide.desc}</p>
                  </button>
                ))}
              </div>

              {/* Support Node */}
              <div className="p-8 bg-primary/5 border border-primary/20 rounded-[32px] mt-6 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 blur-[50px] rounded-full group-hover:bg-primary/20 transition-all duration-700" />
                <div className="space-y-2 relative z-10">
                  <h4 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-primary" />
                    Direct Human Support
                  </h4>
                  <p className="text-[10px] text-muted-foreground font-light italic">Connect with an system architect for complex orchestration needs.</p>
                </div>
                <button className="px-6 py-3 bg-primary text-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-widest shadow-premium hover:brightness-110 transition-all active:scale-95 relative z-10">
                  Initialize Link
                </button>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-2 text-[8px] font-black text-white/10 uppercase tracking-[0.3em]">
              <Zap className="w-3 h-3" />
              Neural Support System 2.0
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
