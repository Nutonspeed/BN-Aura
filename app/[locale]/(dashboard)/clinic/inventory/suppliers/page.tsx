'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Buildings, 
  Plus, 
  MagnifyingGlass, 
  User, 
  EnvelopeSimple, 
  Phone, 
  MapPin, 
  PencilSimple, 
  Trash, 
  DotsThreeVertical, 
  SpinnerGap,
  CheckCircle,
  Clock,
  SquaresFour,
  Truck,
  Package,
  ArrowRight
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import SupplierModal from '@/components/SupplierModal';

interface Supplier {
  id: string;
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  is_active: boolean;
  created_at: string;
}

function SupplierManagementContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | undefined>(undefined);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/suppliers');
      const result = await res.json();
      if (result.success) {
        setSuppliers(result.data || []);
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleAddSupplier = () => {
    setSelectedSupplier(undefined);
    setIsModalOpen(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm('Are you sure you want to terminate this supplier node? This will affect material acquisition history.')) return;
    
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        fetchSuppliers();
      }
    } catch (err) {
      console.error('Error deleting supplier:', err);
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10 pb-20 font-sans"
    >
      <SupplierModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchSuppliers}
        supplier={selectedSupplier}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]">
            <Truck className="w-4 h-4" />
            Supply Chain Intelligence
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tight">Supplier <span className="text-primary text-glow">Network</span></h1>
          <p className="text-muted-foreground font-light text-sm italic">Managing clinical acquisition nodes and vendor telemetry.</p>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAddSupplier}
          className="flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-[0.1em] shadow-premium hover:brightness-110 transition-all active:scale-95 text-xs"
        >
          <Plus className="w-4 h-4 stroke-[3px]" />
          <span>Register New Supplier</span>
        </motion.button>
      </div>

      {/* Search & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/10 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-3xl" />
            <MagnifyingGlass className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Filter by company name, contact, or neural mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-3xl py-4 pl-14 pr-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all shadow-inner backdrop-blur-md relative z-10"
            />
          </div>
        </div>
        <div className="glass-premium p-6 rounded-3xl border border-white/5 flex items-center justify-between group overflow-hidden relative">
          <div className="absolute -top-2 -right-2 opacity-5 group-hover:opacity-10 transition-opacity">
            <Buildings className="w-16 h-16 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Active Links</p>
            <p className="text-3xl font-black text-white tracking-tighter">{suppliers.length}</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-premium group-hover:scale-110 transition-transform">
            <Truck className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* Supplier Grid */}
      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center space-y-6">
          <SpinnerGap className="w-12 h-12 text-primary animate-spin" />
          <p className="text-muted-foreground animate-pulse font-bold uppercase tracking-[0.3em] text-[10px]">Syncing Acquisition Grid...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredSuppliers.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8 }}
              className="glass-premium p-8 rounded-[40px] border border-white/10 flex flex-col justify-between group hover:border-primary/40 transition-all duration-500 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-5 transition-opacity duration-700 pointer-events-none">
                <Truck className="w-24 h-24 text-primary" />
              </div>

              <div className="space-y-6 relative z-10">
                <div className="flex justify-between items-start">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500 shadow-sm">
                    <Buildings className="w-7 h-7" />
                  </div>
                  <div className="flex gap-2">
                    <motion.button 
                      whileHover={{ scale: 1.1 }} 
                      whileTap={{ scale: 0.9 }} 
                      onClick={() => handleEditSupplier(s)}
                      className="p-2.5 bg-white/5 rounded-xl text-white/30 hover:text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/10"
                    >
                      <PencilSimple className="w-4 h-4" />
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.1, rotate: 5 }} 
                      whileTap={{ scale: 0.9 }} 
                      onClick={() => handleDeleteSupplier(s.id)}
                      className="p-2.5 bg-white/5 rounded-xl text-rose-500/30 hover:text-rose-400 hover:bg-rose-500/10 transition-all border border-transparent hover:border-rose-500/10"
                    >
                      <Trash className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border",
                      s.is_active ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                    )}>
                      {s.is_active ? 'Operational' : 'Deactivated'}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white group-hover:text-primary transition-colors tracking-tight leading-tight">
                    {s.name}
                  </h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-1">POC: {s.contact_name || 'N/A'}</p>
                </div>

                <div className="space-y-3">
                  {s.email && (
                    <div className="flex items-center gap-3">
                      <EnvelopeSimple className="w-4 h-4 text-primary/60 shrink-0" />
                      <p className="text-xs text-white/60 font-medium truncate">{s.email}</p>
                    </div>
                  )}
                  {s.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-primary/60 shrink-0" />
                      <p className="text-xs text-white/60 font-medium tabular-nums">{s.phone}</p>
                    </div>
                  )}
                  {s.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-primary/60 mt-0.5 shrink-0" />
                      <p className="text-xs text-muted-foreground font-light leading-relaxed line-clamp-2 italic">{s.address}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-between relative z-10">
                <button 
                  onClick={() => router.push(`/clinic/inventory/suppliers/orders?supplierId=${s.id}`)}
                  className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest hover:gap-3 transition-all"
                >
                  View Purchase Orders
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-3 bg-white/5 rounded-2xl text-white/40 hover:text-white hover:bg-white/10 transition-all border border-transparent shadow-sm"
                >
                  <DotsThreeVertical className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>
          ))}

          {filteredSuppliers.length === 0 && !loading && (
            <div className="col-span-full py-32 text-center relative overflow-hidden glass-card rounded-[48px] border border-white/5">
              <div className="flex flex-col items-center justify-center space-y-6 relative z-10 opacity-30">
                <Buildings className="w-16 h-16" />
                <p className="text-sm font-black uppercase tracking-widest">No Supplier Clusters Detected</p>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function SupplierManagementPage() {
  return (
    <Suspense fallback={
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-6">
        <SpinnerGap className="w-12 h-12 text-primary animate-spin" />
        <p className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Initializing Acquisition Interface...</p>
      </div>
    }>
      <SupplierManagementContent />
    </Suspense>
  );
}
