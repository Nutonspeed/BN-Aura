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
  Sparkles,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState, useCallback } from 'react';
import TreatmentModal from '@/components/TreatmentModal';

interface Treatment {
  id: string;
  names: { [key: string]: string } | string;
  category: string;
  price_min: number;
  price_max?: number;
  is_active: boolean;
  created_at: string;
}

export default function TreatmentCatalog() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | undefined>(undefined);

  const fetchTreatments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/treatments');
      const result = await res.json();
      if (result.success) {
        setTreatments(result.data || []);
      }
    } catch (err) {
      console.error('Error fetching treatments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTreatments();
  }, [fetchTreatments]);

  const handleAddTreatment = () => {
    setSelectedTreatment(undefined);
    setIsModalOpen(true);
  };

  const handleEditTreatment = (treatment: Treatment) => {
    setSelectedTreatment(treatment);
    setIsModalOpen(true);
  };

  const handleDeleteTreatment = async (id: string) => {
    if (!confirm('Are you sure you want to terminate this protocol node?')) return;
    
    try {
      const res = await fetch(`/api/treatments/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        fetchTreatments();
      }
    } catch (err) {
      console.error('Error deleting treatment:', err);
    }
  };

  const filteredTreatments = treatments.filter(item => {
    const nameStr = typeof item.names === 'object' ? JSON.stringify(item.names) : item.names;
    return (
      nameStr?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10 pb-20 font-sans"
    >
      <TreatmentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTreatments}
        treatment={selectedTreatment}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-[0.3em]"
          >
            <BriefcaseMedical className="w-4 h-4" />
            Medical Excellence Catalog
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-white uppercase tracking-tight"
          >
            Treatment <span className="text-primary text-glow">Protocol</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            Managing clinical services, unit economics, and AI diagnostic mapping.
          </motion.p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAddTreatment}
          className="flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-[0.1em] shadow-premium hover:brightness-110 transition-all active:scale-95 text-xs"
        >
          <Plus className="w-4 h-4 stroke-[3px]" />
          <span>Authorize New Treatment</span>
        </motion.button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { label: 'Clinical Portfolio', value: treatments.length.toString(), icon: Layers, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Operational Nodes', value: treatments.filter(t => t.is_active).length.toString(), icon: Zap, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Unit Economics (Avg)', value: '฿' + (treatments.length ? Math.round(treatments.reduce((acc, curr) => acc + Number(curr.price_min), 0) / treatments.length).toLocaleString() : '0'), icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
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

      {/* Search & Filter */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="relative group"
      >
        <div className="absolute inset-0 bg-primary/10 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-3xl" />
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-primary transition-colors" />
        <input 
          type="text" 
          placeholder="Filter treatments by clinical designation or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-3xl py-4 pl-14 pr-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all shadow-inner backdrop-blur-md relative z-10"
        />
      </motion.div>

      {/* Grid Layout for Treatments */}
      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <BriefcaseMedical className="absolute inset-0 m-auto w-6 h-6 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground animate-pulse font-bold uppercase tracking-[0.3em] text-[10px]">Syncing Clinical Knowledge Base...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredTreatments.length > 0 ? (
            filteredTreatments.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="glass-premium p-8 rounded-[40px] border border-white/10 flex flex-col justify-between group hover:border-primary/40 transition-all duration-500 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-5 transition-opacity duration-700 pointer-events-none">
                  <Sparkles className="w-24 h-24 text-primary" />
                </div>

                <div className="space-y-6 relative z-10">
                  <div className="flex justify-between items-start">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20 transition-all duration-500 shadow-sm">
                      <BriefcaseMedical className="w-7 h-7" />
                    </div>
                    <div className="flex gap-2">
                      <motion.button 
                        whileHover={{ scale: 1.1 }} 
                        whileTap={{ scale: 0.9 }} 
                        onClick={() => handleEditTreatment(item)}
                        className="p-2.5 bg-white/5 rounded-xl text-white/30 hover:text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/10 shadow-sm"
                      >
                        <Edit2 className="w-4 h-4" />
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.1, rotate: 5 }} 
                        whileTap={{ scale: 0.9 }} 
                        onClick={() => handleDeleteTreatment(item.id)}
                        className="p-2.5 bg-white/5 rounded-xl text-rose-500/30 hover:text-rose-400 hover:bg-rose-500/10 transition-all border border-transparent hover:border-rose-500/10 shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-white group-hover:text-primary transition-colors tracking-tight leading-tight">
                      {typeof item.names === 'object' ? (item.names.th || item.names.en) : item.names}
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-1.5 opacity-60">
                      {typeof item.names === 'object' ? item.names.en : ''}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[9px] uppercase tracking-widest text-muted-foreground font-black flex items-center gap-2 group-hover:border-primary/20 transition-all">
                      <Tag className="w-3 h-3 text-primary/60" />
                      {item.category}
                    </span>
                    <span className={cn(
                      "px-3 py-1.5 rounded-xl border text-[9px] uppercase tracking-widest font-black flex items-center gap-2 transition-all",
                      item.is_active 
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                        : "bg-white/5 border-white/10 text-white/20"
                    )}>
                      <div className={cn("w-1.5 h-1.5 rounded-full", item.is_active ? "bg-emerald-400 animate-pulse" : "bg-white/20")} />
                      {item.is_active ? 'Operational' : 'Deactivated'}
                    </span>
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-between relative z-10">
                  <div className="space-y-1">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] font-black opacity-60">Starting Investment</p>
                    <p className="text-2xl font-black text-white tracking-tighter tabular-nums">฿{Number(item.price_min).toLocaleString()}</p>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-3 bg-white/5 rounded-2xl text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all border border-transparent shadow-sm group/more"
                  >
                    <MoreHorizontal className="w-5 h-5 group-hover/more:scale-110 transition-transform" />
                  </motion.button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-32 text-center relative overflow-hidden glass-card rounded-[48px] border border-white/5">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
              <div className="flex flex-col items-center justify-center space-y-6 relative z-10">
                <div className="w-20 h-20 rounded-[32px] bg-white/5 border border-white/5 flex items-center justify-center text-white/10 animate-float">
                  <BriefcaseMedical className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <p className="text-xl font-black text-white/40 uppercase tracking-widest">Protocol Vault Empty</p>
                  <p className="text-sm text-muted-foreground font-light max-w-sm mx-auto italic">No medical treatments detected within the specified parameters. Register a new clinical protocol to begin mapping.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
