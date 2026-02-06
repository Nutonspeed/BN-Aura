'use client';

import { MagnifyingGlass, Package, FirstAidKit, Tag, Plus, Funnel, Archive, Sparkle, Coin, Monitor, IdentificationBadge } from '@phosphor-icons/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface POSProductGridProps {
  products: any[];
  treatments: any[];
  onSelectItem: (item: any, type: 'PRODUCT' | 'TREATMENT') => void;
  currency?: string;
  formatPrice?: (amount: number) => string;
}

export default function POSProductGrid({ products, treatments, onSelectItem, currency = 'THB', formatPrice }: POSProductGridProps) {
  const [activeTab, setActiveTab] = useState<'PRODUCT' | 'TREATMENT'>('TREATMENT');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const defaultFormatPrice = (amount: number) => `฿${amount.toLocaleString()}`;
  const displayPrice = formatPrice || defaultFormatPrice;

  const categories = ['all', ...Array.from(new Set(
    (activeTab === 'PRODUCT' ? products : treatments).map(item => item.category).filter(Boolean)
  ))];

  const filteredItems = (activeTab === 'PRODUCT' ? products : treatments).filter(item => {
    const nameStr = activeTab === 'TREATMENT' 
      ? (typeof item.names === 'object' ? (item.names.th || item.names.en) : item.names)
      : item.name;
    
    const matchesSearch = nameStr?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col h-full space-y-8 font-sans">
      {/* Search & Intelligence Controls */}
      <div className="space-y-6 px-2">
        <div className="flex p-1.5 bg-secondary/50 border border-border/50 rounded-[24px] shadow-inner">
          <button
            onClick={() => { setActiveTab('TREATMENT'); setSelectedCategory('all'); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-3 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border",
              activeTab === 'TREATMENT' 
                ? "bg-primary text-primary-foreground border-primary shadow-premium" 
                : "bg-transparent text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground"
            )}
          >
            <FirstAidKit weight={activeTab === 'TREATMENT' ? "fill" : "bold"} className="w-4 h-4" />
            Clinical Protocols
          </button>
          <button
            onClick={() => { setActiveTab('PRODUCT'); setSelectedCategory('all'); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-3 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border",
              activeTab === 'PRODUCT' 
                ? "bg-primary text-primary-foreground border-primary shadow-premium" 
                : "bg-transparent text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground"
            )}
          >
            <Package weight={activeTab === 'PRODUCT' ? "fill" : "bold"} className="w-4 h-4" />
            Inventory Assets
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-2xl" />
            <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder={`Search clinical ${activeTab.toLowerCase()} registry...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-secondary/50 border border-border rounded-2xl py-4 pl-12 pr-4 text-sm text-foreground focus:outline-none focus:border-primary transition-all shadow-inner relative z-10 font-bold"
            />
          </div>
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full md:w-56 bg-secondary/50 border border-border rounded-2xl py-4 px-6 text-xs font-black uppercase tracking-widest text-foreground focus:border-primary outline-none transition-all appearance-none font-bold"
            >
              {categories.map(cat => (
                <option key={cat} value={cat} className="bg-card">
                  {cat === 'all' ? 'All Clusters' : cat.toUpperCase()}
                </option>
              ))}
            </select>
            <Funnel weight="bold" className="absolute right-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Grid Matrix */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar px-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 pb-10">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, i) => {
              const nameStr = activeTab === 'TREATMENT' 
                ? (typeof item.names === 'object' ? (item.names.th || item.names.en) : item.names)
                : item.name;
              
              return (
                <motion.button
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.02 }}
                  whileHover={{ y: -5 }}
                  onClick={() => onSelectItem(item, activeTab)}
                  className="group relative flex flex-col bg-card border border-border/50 rounded-[32px] hover:border-primary/30 transition-all text-left overflow-hidden shadow-premium"
                >
                  <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                    <Sparkle className="w-32 h-32 text-primary" />
                  </div>

                  <div className="p-6 space-y-6 relative z-10 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl bg-secondary border border-border flex items-center justify-center text-primary group-hover:bg-primary/10 transition-all duration-500 shadow-inner",
                        )}>
                          {activeTab === 'TREATMENT' ? <FirstAidKit weight="duotone" className="w-6 h-6" /> : <Package weight="duotone" className="w-6 h-6" />}
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-premium">
                            <Plus weight="bold" className="w-5 h-5" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="ghost" size="sm" className="bg-primary/5 text-primary border-none font-black text-[8px] tracking-widest uppercase px-2">
                            {item.category}
                          </Badge>
                          {activeTab === 'PRODUCT' && (
                            <Badge 
                              variant={item.stock_quantity > 0 ? 'success' : 'destructive'} 
                              size="sm"
                              className="font-black text-[8px] tracking-widest uppercase px-2"
                            >
                              {item.stock_quantity > 0 ? `Stock: ${item.stock_quantity}` : 'DEPLETED'}
                            </Badge>
                          )}
                        </div>
                        <h4 className="text-base font-black text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight uppercase tracking-tight">
                          {nameStr}
                        </h4>
                      </div>
                    </div>

                    <div className="mt-8 pt-5 border-t border-border/30">
                      <p className="text-2xl font-black text-foreground tabular-nums tracking-tighter">
                        {displayPrice(activeTab === 'TREATMENT' ? item.price_min : item.sale_price)}
                      </p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredItems.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-20 py-32 text-center">
            <div className="w-20 h-20 rounded-[40px] bg-secondary flex items-center justify-center text-muted-foreground shadow-inner mb-6">
              <MagnifyingGlass weight="duotone" className="w-10 h-10" />
            </div>
            <p className="text-sm font-black uppercase tracking-[0.3em]">Zero protocol nodes detected in sector.</p>
          </div>
        )}
      </div>
    </div>
  );
}