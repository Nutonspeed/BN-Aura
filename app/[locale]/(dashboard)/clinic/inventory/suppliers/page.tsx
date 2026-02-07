'use client';

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
  ArrowRight,
  ArrowsClockwise,
  IdentificationBadge,
  Archive,
  WarningCircle,
  Globe,
  Briefcase,
  ClockCounterClockwise,
  ShieldCheck
} from '@phosphor-icons/react';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { cn } from '@/lib/utils';
import { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { useRouter } from '@/i18n/routing';
import SupplierModal from '@/components/SupplierModal';
import { Link } from '@/i18n/routing';
import { motion, AnimatePresence } from 'framer-motion';

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

export default function SupplierManagementContent() {
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
      className="space-y-8 pb-20 font-sans"
    >
      <Breadcrumb />

      <SupplierModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchSuppliers}
        supplier={selectedSupplier}
      />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]"
          >
            <Truck weight="duotone" className="w-4 h-4" />
            External Resource Matrix
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-foreground tracking-tight uppercase"
          >
            Supplier <span className="text-primary">Network</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            Orchestrating clinical acquisition nodes, material pipelines, and vendor telemetry.
          </motion.p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-secondary/50 border border-border/50 p-1.5 rounded-[24px] shadow-inner mr-2">
            {[
              { id: 'main', label: 'Vault', icon: Archive, href: '/clinic/inventory' },
              { id: 'orders', label: 'Orders', icon: Truck, href: '/clinic/inventory/orders' },
              { id: 'alerts', label: 'Alerts', icon: WarningCircle, href: '/clinic/inventory/alerts' },
              { id: 'suppliers', label: 'Network', icon: Buildings, href: '/clinic/inventory/suppliers' }
            ].map((node) => (
              <Link key={node.id} href={node.href}>
                <button
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap flex items-center gap-2",
                    node.id === 'suppliers'
                      ? "bg-primary text-primary-foreground border-primary shadow-premium"
                      : "bg-transparent text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <node.icon weight={node.id === 'suppliers' ? "fill" : "bold"} className="w-3.5 h-3.5" />
                  {node.label}
                </button>
              </Link>
            ))}
          </div>
          <Button 
            variant="outline"
            onClick={fetchSuppliers}
            disabled={loading}
            className="gap-2 px-6 py-6 rounded-2xl text-xs font-black uppercase tracking-widest border-border/50 hover:bg-secondary group"
          >
            <ArrowsClockwise weight="bold" className={cn("w-4 h-4", loading && "animate-spin")} />
            Sync Network
          </Button>
          <Button 
            onClick={handleAddSupplier}
            className="gap-2 px-8 py-6 rounded-2xl text-xs font-black uppercase tracking-widest shadow-premium"
          >
            <Plus weight="bold" className="w-4 h-4" />
            Initialize Supplier
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-2">
        <StatCard
          title="Active Connections"
          value={suppliers.length}
          icon={Truck}
          className="p-4"
        />
        <StatCard
          title="Operational Nodes"
          value={suppliers.filter(s => s.is_active).length}
          icon={CheckCircle}
          iconColor="text-emerald-500"
          className="p-4"
        />
        <StatCard
          title="Consolidated Flows"
          value={124}
          icon={ArrowsClockwise}
          iconColor="text-blue-500"
          className="p-4"
        />
        <StatCard
          title="Network Reliability"
          value={99.4}
          suffix="%"
          decimals={1}
          icon={ShieldCheck}
          iconColor="text-primary"
          className="p-4"
        />
      </div>

      {/* Search & Filters */}
      <div className="px-2">
        <Card className="p-6 rounded-[32px] border-border/50 shadow-card">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative flex-1 group">
              <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-xl" />
              <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Query supplier designation, contact identity, or neural mail node..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-2xl py-3.5 pl-12 pr-4 text-sm text-foreground focus:outline-none focus:border-primary transition-all shadow-inner relative z-10"
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Supplier Grid */}
      <div className="px-2">
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center gap-4">
            <SpinnerGap className="w-10 h-10 text-primary animate-spin" />
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Synchronizing Acquisition Matrix...</p>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <Card variant="ghost" className="py-32 border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-6 opacity-40 rounded-[40px]">
            <Buildings weight="duotone" className="w-16 h-16 text-muted-foreground" />
            <p className="text-sm font-black uppercase tracking-widest text-center">Zero Supplier Clusters Detected</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredSuppliers.map((s, i) => (
                <motion.div
                  key={s.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="h-full border-border/50 hover:border-primary/30 transition-all group overflow-hidden flex flex-col rounded-[40px]">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                      <Truck className="w-32 h-32 text-primary" />
                    </div>

                    <CardHeader className="pb-4 bg-secondary/30 border-b border-border/50 p-8">
                      <div className="flex justify-between items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-card border border-border flex items-center justify-center text-primary group-hover:bg-primary/10 transition-all duration-500 shadow-inner">
                          <Buildings weight="duotone" className="w-7 h-7" />
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEditSupplier(s)}
                            className="h-10 w-10 p-0 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all"
                          >
                            <PencilSimple weight="bold" className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteSupplier(s.id)}
                            className="h-10 w-10 p-0 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/5 border border-transparent hover:border-rose-500/20 transition-all"
                          >
                            <Trash weight="bold" className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-8 flex-1 flex flex-col justify-between space-y-8 relative z-10">
                      <div className="space-y-6">
                        <div>
                          <Badge variant={s.is_active ? 'success' : 'secondary'} size="sm" className="font-black uppercase text-[8px] tracking-widest px-3 mb-2">
                            {s.is_active ? 'OPERATIONAL' : 'DEACTIVATED'}
                          </Badge>
                          <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors uppercase tracking-tight truncate">{s.name}</h3>
                          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-60">POC: {s.contact_name || 'ANONYMOUS_NODE'}</p>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-3 bg-secondary/20 rounded-2xl border border-border/50 group-hover:border-primary/20 transition-all">
                            <EnvelopeSimple weight="duotone" className="w-4 h-4 text-primary/60 shrink-0" />
                            <p className="text-xs text-foreground/70 font-medium truncate italic">{s.email || 'NO_MAIL_NODE'}</p>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-secondary/20 rounded-2xl border border-border/50 group-hover:border-primary/20 transition-all">
                            <Phone weight="duotone" className="w-4 h-4 text-primary/60 shrink-0" />
                            <p className="text-xs text-foreground/70 font-bold tabular-nums">{s.phone || 'NO_COMM_LINK'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-border/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ClockCounterClockwise weight="bold" className="w-3.5 h-3.5 text-primary/60" />
                          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Est: {new Date(s.created_at).toLocaleDateString()}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => router.push(`/clinic/inventory/suppliers/orders?supplierId=${s.id}`)}
                          className="text-primary font-black uppercase text-[9px] tracking-[0.2em] gap-2 hover:bg-primary/5 px-4 py-2 rounded-xl"
                        >
                          PO Logs <ArrowRight weight="bold" className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
