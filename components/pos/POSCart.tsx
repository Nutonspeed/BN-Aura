'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Trash, User, CaretRight, Minus, Plus, CreditCard, Receipt } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export interface CartItem {
  id: string;
  item_id: string;
  item_type: 'PRODUCT' | 'TREATMENT';
  item_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  discount: number;
}

interface POSCartProps {
  items: CartItem[];
  customer: any | null;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onSelectCustomer: () => void;
  onCheckout: () => void;
  loading?: boolean;
  currency?: string;
  formatPrice?: (amount: number) => string;
}

export default function POSCart({ 
  items, 
  customer, 
  onUpdateQuantity, 
  onRemoveItem, 
  onSelectCustomer, 
  onCheckout,
  loading,
  currency = 'THB',
  formatPrice
}: POSCartProps) {
  const subtotal = items.reduce((acc, item) => acc + item.total, 0);
  const total = subtotal; // For now, simple total

  const defaultFormatPrice = (amount: number) => `฿${amount.toLocaleString()}`;
  const displayPrice = formatPrice || defaultFormatPrice;

  return (
    <div className="flex flex-col h-full bg-card border-l border-border w-full max-w-[400px]">
      {/* Header */}
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Current Bill</h3>
        </div>
        <span className="px-3 py-1 rounded-full bg-secondary border border-border text-xs font-medium text-muted-foreground">
          {items.length} Items
        </span>
      </div>

      {/* Customer Selection */}
      <div className="p-6 border-b border-border">
        <button 
          onClick={onSelectCustomer}
          className={cn(
            "w-full flex items-center justify-between p-4 rounded-[24px] border transition-all",
            customer 
              ? "bg-primary/10 border-primary/30 group hover:border-primary/50" 
              : "bg-secondary border-border hover:border-primary/30 border-dashed"
          )}
        >
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
              customer ? "bg-primary text-primary-foreground" : "bg-white/5 text-muted-foreground"
            )}>
              <User className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className={cn(
                "text-[10px] font-black uppercase tracking-widest mb-0.5",
                customer ? "text-primary" : "text-muted-foreground"
              )}>
                Patient Identity
              </p>
              <p className="text-sm font-semibold text-foreground truncate max-w-[180px]">
                {customer ? customer.full_name : 'Select or Link Patient'}
              </p>
            </div>
          </div>
          <CaretRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <AnimatePresence initial={false}>
          {items.length > 0 ? (
            <div className="space-y-4">
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="group relative bg-secondary border border-border rounded-xl p-4 hover:border-primary/30 transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="space-y-0.5 max-w-[70%]">
                      <h4 className="text-sm font-semibold text-foreground line-clamp-1">{item.item_name}</h4>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{item.item_type}</p>
                    </div>
                    <button 
                      onClick={() => onRemoveItem(item.id)}
                      className="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-rose-500/40 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 bg-black/40 border border-white/5 rounded-xl p-1">
                      <button 
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="p-1.5 hover:text-primary transition-colors text-white/40"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-foreground tabular-nums">{item.quantity}</span>
                      <button 
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        className="p-1.5 hover:text-primary transition-colors text-white/40"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-sm font-bold text-foreground tabular-nums">
                      {displayPrice(item.total)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-20 py-20 text-center">
              <ShoppingCart className="w-16 h-16 mb-4 stroke-[1px]" />
              <p className="text-xs font-black uppercase tracking-[0.3em]">Empty Cart Node</p>
              <p className="text-[10px] font-light mt-2 max-w-[150px]">Select treatments or products to begin orchestration.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer - Checkout */}
      <div className="p-8 bg-white/[0.02] border-t border-white/10 space-y-6">
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase tracking-widest">
            <span>Operational Subtotal</span>
            <span className="tabular-nums">{displayPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase tracking-widest">
            <span>Protocol Discounts</span>
            <span className="text-emerald-400 tabular-nums">-{displayPrice(0)}</span>
          </div>
          <div className="pt-3 border-t border-white/5 flex justify-between items-center">
            <span className="text-sm font-black text-white uppercase tracking-[0.2em]">Total Value</span>
            <span className="text-3xl font-black text-primary tracking-tighter text-glow tabular-nums">
              {displayPrice(total)}
            </span>
          </div>
        </div>

        <button
          disabled={items.length === 0 || !customer || loading}
          onClick={onCheckout}
          className="w-full group relative flex items-center justify-center gap-3 py-5 bg-primary text-primary-foreground rounded-[24px] font-black uppercase tracking-[0.2em] shadow-premium hover:brightness-110 disabled:opacity-20 disabled:grayscale transition-all overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
          <CreditCard className="w-5 h-5" />
          <span>Execute Transaction</span>
        </button>
        
        <div className="flex items-center justify-center gap-2 text-white/20 hover:text-white/40 transition-colors cursor-default">
          <Receipt className="w-3 h-3" />
          <span className="text-[9px] font-black uppercase tracking-widest">Neural Receipt System 1.0</span>
        </div>
      </div>
    </div>
  );
}
