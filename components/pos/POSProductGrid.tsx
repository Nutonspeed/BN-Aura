'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Package, BriefcaseMedical, Tag, Plus, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <div className="flex flex-col h-full space-y-6">
      {/* Tabs & Search */}
      <div className="space-y-4">
        <div className="flex p-1 bg-white/5 border border-white/10 rounded-2xl">
          <button
            onClick={() => { setActiveTab('TREATMENT'); setSelectedCategory('all'); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              activeTab === 'TREATMENT' ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-white"
            )}
          >
            <BriefcaseMedical className="w-4 h-4" />
            Treatments
          </button>
          <button
            onClick={() => { setActiveTab('PRODUCT'); setSelectedCategory('all'); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              activeTab === 'PRODUCT' ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-white"
            )}
          >
            <Package className="w-4 h-4" />
            Products
          </button>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder={`Search ${activeTab.toLowerCase()}s...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-all backdrop-blur-md"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-primary/50 appearance-none min-w-[120px]"
          >
            {categories.map(cat => (
              <option key={cat} value={cat} className="bg-[#0A0A0A]">{cat.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectItem(item, activeTab)}
              className="group relative flex flex-col p-4 bg-white/5 border border-white/10 rounded-3xl hover:border-primary/40 transition-all text-left overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <Plus className="w-4 h-4 stroke-[3px]" />
                </div>
              </div>

              <div className="mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                  {activeTab === 'TREATMENT' ? <BriefcaseMedical className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                </div>
              </div>

              <div className="flex-1 space-y-1">
                <h4 className="text-sm font-black text-white group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                  {activeTab === 'TREATMENT' 
                    ? (typeof item.names === 'object' ? (item.names.th || item.names.en) : item.names)
                    : item.name}
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{item.category}</span>
                  {activeTab === 'PRODUCT' && (
                    <span className={cn(
                      "text-[9px] font-bold px-1.5 py-0.5 rounded-md",
                      item.stock_quantity > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                    )}>
                      {item.stock_quantity}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5">
                <p className="text-lg font-black text-white tracking-tighter tabular-nums">
                  {displayPrice(activeTab === 'TREATMENT' ? item.price_min : item.sale_price)}
                </p>
              </div>
            </motion.button>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-30 py-20">
            <Search className="w-12 h-12 mb-4" />
            <p className="text-sm font-black uppercase tracking-[0.2em]">No Matches Found</p>
          </div>
        )}
      </div>
    </div>
  );
}
