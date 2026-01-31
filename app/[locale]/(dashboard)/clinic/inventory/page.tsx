'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  TrendingUp, 
  Edit2, 
  Trash2,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock_quantity: number;
  min_stock_level: number;
  cost_price: number;
  sale_price: number;
  created_at: string;
  image_url?: string;
}

export default function InventoryManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const supabase = useMemo(() => createClient(), []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory_products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts((data as unknown as Product[]) || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockProducts = products.filter(p => p.stock_quantity <= p.min_stock_level);
  const totalValue = products.reduce((acc, curr) => acc + (curr.stock_quantity * curr.cost_price), 0);
  const categories = ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10 pb-20 font-sans"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-[0.3em]"
          >
            <Package className="w-4 h-4" />
            Supply Chain Intelligence
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-white uppercase tracking-tight"
          >
            Inventory <span className="text-primary text-glow">Control</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            Real-time asset tracking and clinical supply optimization.
          </motion.p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-[0.1em] shadow-premium hover:brightness-110 transition-all active:scale-95 text-xs"
        >
          <Plus className="w-4 h-4 stroke-[3px]" />
          <span>Register New Product</span>
        </motion.button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Asset Inventory', value: products.length.toString(), icon: Package, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Low Stock Nodes', value: lowStockProducts.length.toString(), icon: AlertTriangle, color: lowStockProducts.length > 0 ? 'text-rose-400' : 'text-emerald-400', bg: lowStockProducts.length > 0 ? 'bg-rose-500/10' : 'bg-emerald-500/10' },
          { label: 'Consolidated Value', value: '฿' + totalValue.toLocaleString(), icon: BarChart3, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Categories', value: (categories.length - 1).toString(), icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        ].map((stat, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            whileHover={{ y: -5 }}
            className="glass-card p-6 rounded-3xl border border-white/5 flex items-center gap-5 group overflow-hidden relative"
          >
            <div className="absolute -top-2 -right-2 opacity-5 group-hover:opacity-10 transition-opacity">
              <stat.icon className="w-16 h-16 text-white" />
            </div>
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform", stat.bg, stat.color)}>
              <stat.icon className="w-7 h-7" />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-white">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Low Stock Alert */}
      <AnimatePresence>
        {lowStockProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-premium p-6 rounded-[32px] border border-rose-500/30 bg-rose-500/5 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 via-transparent to-transparent" />
            <div className="flex items-start gap-6 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/20 flex items-center justify-center text-rose-400 shadow-lg">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-lg font-black text-rose-400 uppercase tracking-tight">Critical Depletion Alert</h3>
                  <p className="text-rose-300/60 text-sm font-light italic">
                    The following assets have reached critical minimum thresholds and require immediate replenishment.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {lowStockProducts.slice(0, 5).map(product => (
                    <motion.span 
                      key={product.id} 
                      whileHover={{ scale: 1.05 }}
                      className="px-4 py-2 bg-white/5 border border-rose-500/20 text-rose-300 text-[10px] font-black uppercase tracking-widest rounded-xl backdrop-blur-md"
                    >
                      {product.name} ({product.stock_quantity} unit{product.stock_quantity > 1 ? 's' : ''})
                    </motion.span>
                  ))}
                  {lowStockProducts.length > 5 && (
                    <span className="px-4 py-2 bg-white/5 border border-white/10 text-muted-foreground text-[10px] font-black uppercase tracking-widest rounded-xl">
                      +{lowStockProducts.length - 5} More Nodes
                    </span>
                  )}
                </div>
              </div>
              <button className="px-6 py-3 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:brightness-110 transition-all active:scale-95">
                Bulk Order
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative flex-1 group"
        >
          <div className="absolute inset-0 bg-primary/10 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-3xl" />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search products by name, SKU, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-3xl py-4 pl-14 pr-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all shadow-inner backdrop-blur-md relative z-10"
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex gap-4"
        >
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-6 py-4 bg-white/5 border border-white/10 rounded-[24px] text-xs font-black uppercase tracking-widest text-white focus:outline-none focus:border-primary/50 transition-all backdrop-blur-md shadow-sm min-w-[200px]"
          >
            {categories.map(category => (
              <option key={category} value={category} className="bg-[#121212] text-white">
                {category === 'all' ? 'All Operational Nodes' : category.toUpperCase()}
              </option>
            ))}
          </select>
          
          <button className="p-4 bg-white/5 border border-white/10 rounded-2xl text-muted-foreground hover:text-white transition-all group">
            <BarChart3 className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        </motion.div>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <Package className="absolute inset-0 m-auto w-6 h-6 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground animate-pulse font-bold uppercase tracking-[0.3em] text-[10px]">Accessing Supply Chain Nodes...</p>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-premium rounded-[40px] overflow-hidden border border-white/5 shadow-2xl relative"
        >
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.03]">
                  <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Asset Intelligence</th>
                  <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Serial SKU</th>
                  <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Stock Level</th>
                  <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Unit Cost</th>
                  <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Market Val</th>
                  <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Total Eq.</th>
                  <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product, i) => {
                    const isLowStock = product.stock_quantity <= product.min_stock_level;
                    const totalValue = product.stock_quantity * product.cost_price;

                    return (
                      <motion.tr 
                        key={product.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + i * 0.03 }}
                        className="group hover:bg-white/[0.05] transition-all relative overflow-hidden"
                      >
                        <td className="px-8 py-6 relative">
                          <div className="absolute top-0 left-0 w-1 h-full bg-primary/0 group-hover:bg-primary transition-all" />
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500 shadow-sm">
                              <Package className="w-7 h-7" />
                            </div>
                            <div className="flex flex-col space-y-1">
                              <span className="text-base font-black text-white group-hover:text-primary transition-colors tracking-tight">{product.name}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-primary/40" />
                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{product.category}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-[11px] text-white/40 font-mono bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 group-hover:border-white/10 transition-colors uppercase">{product.sku || 'N/A'}</span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2.5">
                              <span className={cn("text-lg font-black tracking-tighter tabular-nums", isLowStock ? "text-rose-400" : "text-white")}>
                                {product.stock_quantity}
                              </span>
                              {isLowStock && <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}><AlertTriangle className="w-4 h-4 text-rose-400" /></motion.div>}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1 w-16 bg-white/5 rounded-full overflow-hidden">
                                <div className={cn("h-full rounded-full", isLowStock ? 'bg-rose-500' : 'bg-emerald-500')} style={{ width: `${Math.min(100, (product.stock_quantity / (product.min_stock_level * 2)) * 100)}%` }} />
                              </div>
                              <span className="text-[9px] text-muted-foreground uppercase font-black">Min: {product.min_stock_level}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-sm text-white/60 font-medium tabular-nums">
                          ฿{product.cost_price?.toLocaleString() || '0'}
                        </td>
                        <td className="px-8 py-6 text-sm text-emerald-400/80 font-black tabular-nums">
                          ฿{product.sale_price?.toLocaleString() || '0'}
                        </td>
                        <td className="px-8 py-6 text-lg font-black text-white tracking-tight tabular-nums">
                          ฿{totalValue.toLocaleString()}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <motion.button 
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-3 text-white/30 hover:text-white transition-all rounded-xl hover:bg-white/10 border border-transparent hover:border-white/5 shadow-sm"
                            >
                              <Edit2 className="w-4 h-4" />
                            </motion.button>
                            <motion.button 
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-3 text-rose-500/30 hover:text-rose-400 transition-all rounded-xl hover:bg-rose-500/10 border border-transparent hover:border-rose-500/10 shadow-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-8 py-32 text-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
                      <div className="flex flex-col items-center justify-center space-y-6 relative z-10">
                        <div className="w-20 h-20 rounded-[32px] bg-white/5 border border-white/5 flex items-center justify-center text-white/10 animate-float">
                          <Package className="w-10 h-10" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-xl font-black text-white/40 uppercase tracking-widest">Inventory Node Empty</p>
                          <p className="text-sm text-muted-foreground font-light max-w-sm mx-auto italic">No operational assets detected within the selected parameters. Initialize new registry to begin tracking.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
