'use client';

import { motion } from 'framer-motion';
import { 
  BriefcaseMedical, 
  Plus, 
  Search, 
  Tag, 
  DollarSign, 
  Zap, 
  Layers,
  Edit2,
  Trash2,
  MoreHorizontal,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Treatment {
  id: string;
  names: { [key: string]: string } | string;
  category: string;
  price_min: number;
  is_active: boolean;
  created_at: string;
}

export default function TreatmentCatalog() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const supabase = useMemo(() => createClient(), []);

  const fetchTreatments = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('treatments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTreatments((data as unknown as Treatment[]) || []);
    } catch (err) {
      console.error('Error fetching treatments:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchTreatments();
  }, [fetchTreatments]);

  const filteredTreatments = treatments.filter(item => {
    const nameStr = typeof item.names === 'object' ? JSON.stringify(item.names) : item.names;
    return (
      nameStr?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white uppercase tracking-tight">Treatment Catalog</h1>
          <p className="text-muted-foreground font-light text-sm italic">Manage your clinic services, pricing, and AI recommendations.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold shadow-premium hover:brightness-110 transition-all active:scale-95">
          <Plus className="w-4 h-4" />
          <span>Add New Treatment</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Total Services', value: treatments.length.toString(), icon: Layers },
          { label: 'Active Services', value: treatments.filter(t => t.is_active).length.toString(), icon: Zap },
          { label: 'Avg. Treatment Price', value: '฿' + (treatments.length ? Math.round(treatments.reduce((acc, curr) => acc + Number(curr.price_min), 0) / treatments.length).toLocaleString() : '0'), icon: DollarSign },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-4 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{stat.label}</p>
              <p className="text-xl font-bold text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input 
          type="text" 
          placeholder="Search treatments by name or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
      </div>

      {/* Grid Layout for Treatments */}
      {loading ? (
        <div className="p-20 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground animate-pulse">Loading treatments...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTreatments.length > 0 ? (
            filteredTreatments.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-6 rounded-3xl border border-white/10 flex flex-col justify-between group hover:border-primary/30 transition-all duration-300"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/50 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                      <BriefcaseMedical className="w-6 h-6" />
                    </div>
                    <div className="flex gap-1">
                      <button className="p-2 text-white/30 hover:text-white transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-white/30 hover:text-rose-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">
                      {typeof item.names === 'object' ? (item.names.th || item.names.en) : item.names}
                    </h3>
                    <p className="text-sm text-muted-foreground font-light">
                      {typeof item.names === 'object' ? item.names.en : ''}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {item.category}
                    </span>
                    <span className={cn(
                      "px-2 py-1 rounded-md border text-[10px] uppercase tracking-wider font-semibold",
                      item.is_active 
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                        : "bg-white/5 border-white/10 text-white/20"
                    )}>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Starting from</p>
                    <p className="text-lg font-bold text-white">฿{Number(item.price_min).toLocaleString()}</p>
                  </div>
                  <button className="p-2 bg-white/5 rounded-xl text-white/50 hover:bg-white/10 hover:text-white transition-all">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full p-20 text-center text-muted-foreground font-light italic">
              No treatments found in the catalog.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
