'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Question, 
  Book, 
  ChatCircle, 
  PlayCircle, 
  CaretRight, 
  Lightning, 
  Shield, 
  MagnifyingGlass, 
  ShoppingCart,
  ArrowLeft,
  Lifebuoy,
  Info,
  Compass,
  Headset,
  ArrowsClockwise
} from '@phosphor-icons/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
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
      icon: Lightning,
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
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-card border border-border rounded-[40px] p-10 shadow-premium relative z-10 my-8 overflow-hidden group"
          >
            {/* Background Decor */}
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
              <Compass className="w-64 h-64 text-primary" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-10 relative z-10">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                  <Lifebuoy weight="duotone" className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground tracking-tight uppercase">Intelligence Center</h2>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Documentation node: {role.replace('_', ' ')}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all"
              >
                <X weight="bold" className="w-6 h-6" />
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-10 relative z-10 group">
              <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-2xl" />
              <MagnifyingGlass weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
              <input 
                type="text"
                placeholder="Query clinical manual or protocol nodes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-5 py-4 bg-secondary/50 border border-border rounded-2xl text-sm text-foreground focus:outline-none focus:border-primary transition-all shadow-inner"
              />
            </div>

            {/* Guides Grid */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {guides.map((guide, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-6 bg-secondary/30 border border-border/50 rounded-[28px] hover:border-primary/30 hover:bg-secondary/50 transition-all text-left group/guide relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover/guide:scale-110 transition-transform">
                      <guide.icon weight="fill" className="w-16 h-16" />
                    </div>
                    <div className={cn("w-12 h-12 rounded-xl bg-card border border-border/50 flex items-center justify-center mb-5 group-hover/guide:scale-110 transition-transform shadow-sm", guide.color)}>
                      <guide.icon weight="duotone" className="w-6 h-6" />
                    </div>
                    <h4 className="text-base font-bold text-foreground mb-1 group-hover/guide:text-primary transition-colors">{guide.title}</h4>
                    <p className="text-[11px] text-muted-foreground font-medium leading-relaxed italic opacity-80">{guide.desc}</p>
                  </motion.button>
                ))}
              </div>

              {/* Support Node */}
              <Card className="border-primary/20 bg-primary/[0.02] relative overflow-hidden group/support rounded-[32px]">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/5 blur-[60px] rounded-full group-hover/support:bg-primary/10 transition-all duration-700" />
                <CardContent className="p-8 relative z-10">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                        <Headset weight="duotone" className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-lg font-black text-foreground uppercase tracking-tight">Direct Human Protocol</h4>
                        <p className="text-[11px] text-muted-foreground font-medium italic">Establish secure link with clinical architects for complex node orchestration.</p>
                      </div>
                    </div>
                    <Button className="w-full md:w-auto px-10 py-6 rounded-2xl shadow-premium text-xs font-black uppercase tracking-widest gap-3">
                      Initialize Link
                      <CaretRight weight="bold" className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-10 pt-6 border-t border-border/50 flex items-center justify-center gap-3 text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.4em] relative z-10">
              <Lightning weight="fill" className="w-4 h-4" />
              Neural Architecture Suite v2.5
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}