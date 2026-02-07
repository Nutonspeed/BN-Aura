'use client';

import { 
  FileText,
  Plus,
  MagnifyingGlass,
  Truck,
  CurrencyDollar,
  PencilSimple,
  Trash,
  DotsThreeVertical,
  SpinnerGap,
  CheckCircle,
  Clock,
  SquaresFour,
  CalendarDots,
  WarningCircle,
  CaretLeft,
  User,
  XCircle,
  IdentificationBadge,
  Archive,
  ArrowRight,
  ArrowsClockwise,
  Buildings,
  Receipt
} from '@phosphor-icons/react';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { cn } from '@/lib/utils';
import { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import PurchaseOrderModal from '@/components/PurchaseOrderModal';
import { Link } from '@/i18n/routing';

interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  status: string;
  total_amount: number;
  notes?: string;
  ordered_at?: string;
  received_at?: string;
  created_at: string;
  supplier?: {
    id: string;
    name: string;
  };
  creator?: {
    id: string;
    full_name: string;
  };
}

function PurchaseOrderManagementInner() {
  const { goBack } = useBackNavigation();
  const searchParams = useSearchParams();
  const supplierIdFilter = searchParams.get('supplierId');
  
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | undefined>(undefined);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const url = supplierIdFilter 
        ? `/api/purchase-orders?supplierId=${supplierIdFilter}`
        : '/api/purchase-orders';
      const res = await fetch(url);
      const result = await res.json();
      if (result.success) {
        setOrders(result.data || []);
      }
    } catch (err) {
      console.error('Error fetching purchase orders:', err);
    } finally {
      setLoading(false);
    }
  }, [supplierIdFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleAddOrder = () => {
    setSelectedOrder(undefined);
    setIsModalOpen(true);
  };

  const handleEditOrder = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleDeleteOrder = async (id: string) => {
    if (!confirm('Are you sure you want to terminate this purchase order? This action cannot be reversed.')) return;
    
    try {
      const res = await fetch(`/api/purchase-orders/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        fetchOrders();
      }
    } catch (err) {
      console.error('Error deleting purchase order:', err);
    }
  };

  const filteredOrders = orders.filter(o => 
    o.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = useMemo(() => ({
    total: orders.length,
    received: orders.filter(o => o.status === 'received').length,
    pending: orders.filter(o => o.status === 'ordered' || o.status === 'draft').length,
    totalSpent: orders.filter(o => o.status === 'received').reduce((acc, o) => acc + Number(o.total_amount), 0)
  }), [orders]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-20 font-sans"
    >
      <Breadcrumb />

      <PurchaseOrderModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchOrders}
        purchaseOrder={selectedOrder}
      />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]"
          >
            <FileText weight="duotone" className="w-4 h-4" />
            Procurement Intelligence Node
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-foreground tracking-tight uppercase"
          >
            Purchase <span className="text-primary">Orders</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            Orchestrating clinical supply acquisition, inventory scaling, and fiscal procurement telemetry.
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
                    node.id === 'orders'
                      ? "bg-primary text-primary-foreground border-primary shadow-premium"
                      : "bg-transparent text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <node.icon weight={node.id === 'orders' ? "fill" : "bold"} className="w-3.5 h-3.5" />
                  {node.label}
                </button>
              </Link>
            ))}
          </div>
          <Button 
            variant="outline"
            onClick={fetchOrders}
            disabled={loading}
            className="gap-2 px-6 py-6 rounded-2xl text-xs font-black uppercase tracking-widest border-border/50 hover:bg-secondary group"
          >
            <ArrowsClockwise weight="bold" className={cn("w-4 h-4", loading && "animate-spin")} />
            Sync Registry
          </Button>
          <Button 
            onClick={handleAddOrder}
            className="gap-2 px-8 py-6 rounded-2xl text-xs font-black uppercase tracking-widest shadow-premium"
          >
            <Plus weight="bold" className="w-4 h-4" />
            Initialize Order
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-2">
        <StatCard
          title="Total PO Nodes"
          value={stats.total}
          icon={FileText}
          className="p-4"
        />
        <StatCard
          title="Received Assets"
          value={stats.received}
          icon={CheckCircle}
          iconColor="text-emerald-500"
          className="p-4"
        />
        <StatCard
          title="Active Flux"
          value={stats.pending}
          icon={Clock}
          iconColor="text-blue-500"
          className="p-4"
        />
        <StatCard
          title="Total Commitment"
          value={stats.totalSpent}
          prefix="฿"
          icon={Receipt}
          iconColor="text-primary"
          className="p-4"
        />
      </div>

      {/* Search & Intelligence Controls */}
      <div className="px-2">
        <Card className="p-6 rounded-[32px] border-border/50 shadow-card">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative flex-1 group">
              <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-xl" />
              <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Query PO number, supplier node name, or procurement directives..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-2xl py-3.5 pl-12 pr-4 text-sm text-foreground focus:outline-none focus:border-primary transition-all shadow-inner relative z-10"
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Orders Grid */}
      <div className="px-2">
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center gap-4">
            <SpinnerGap className="w-10 h-10 text-primary animate-spin" />
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Synchronizing Procurement Matrix...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card variant="ghost" className="py-32 border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-6 opacity-40 rounded-[40px]">
            <Truck weight="duotone" className="w-16 h-16 text-muted-foreground" />
            <p className="text-sm font-black uppercase tracking-widest text-center">Zero Procurement Cycles Detected In This Matrix</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredOrders.map((order, i) => (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="h-full border-border/50 hover:border-primary/30 transition-all group overflow-hidden flex flex-col rounded-[40px]">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                      <FileText className="w-32 h-32 text-primary" />
                    </div>

                    <CardHeader className="pb-4 bg-secondary/30 border-b border-border/50 p-8">
                      <div className="flex justify-between items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-card border border-border flex items-center justify-center text-primary group-hover:bg-primary/10 transition-all duration-500 shadow-inner">
                          <Truck weight="duotone" className="w-7 h-7" />
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEditOrder(order)}
                            className="h-10 w-10 p-0 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all"
                          >
                            <PencilSimple weight="bold" className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteOrder(order.id)}
                            className="h-10 w-10 p-0 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/5 border border-transparent hover:border-rose-500/20 transition-all"
                          >
                            <Trash weight="bold" className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-8 flex-1 flex flex-col justify-between space-y-8 relative z-10">
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="ghost" className="bg-primary/5 text-primary border-none font-mono text-[9px] tracking-widest uppercase px-3">#{order.po_number}</Badge>
                            <Badge variant={
                              order.status === 'received' ? 'success' : 
                              order.status === 'ordered' ? 'default' : 
                              order.status === 'cancelled' ? 'destructive' : 'secondary'
                            } size="sm" className="font-black uppercase text-[8px] tracking-widest px-3">
                              {order.status.toUpperCase()}
                            </Badge>
                          </div>
                          <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors uppercase tracking-tight truncate">{order.supplier?.name || 'Anonymous Supplier'}</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-6 pt-6 border-t border-border/30">
                          <div>
                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Fiscal Commitment</p>
                            <p className="text-xl font-black text-foreground tabular-nums tracking-tighter">฿{Number(order.total_amount).toLocaleString()}</p>
                          </div>
                          {order.received_at && (
                            <div className="text-right">
                              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Reception Node</p>
                              <Badge variant="success" size="sm" className="font-black text-[8px] tracking-widest uppercase px-2">SYNC_OK</Badge>
                            </div>
                          )}
                        </div>

                        {order.notes && (
                          <div className="p-4 bg-secondary/20 rounded-2xl border border-border/50">
                            <p className="text-[10px] text-muted-foreground font-medium italic leading-relaxed line-clamp-2">
                              &quot;{order.notes}&quot;
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="pt-6 border-t border-border/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CalendarDots weight="bold" className="w-3.5 h-3.5 text-primary/60" />
                          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">TS: {new Date(order.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User weight="bold" className="w-3.5 h-3.5 text-primary/60" />
                          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Op: {order.creator?.full_name?.split(' ')[0] || 'SYS'}</span>
                        </div>
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

export default function PurchaseOrderManagementContent() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
      <PurchaseOrderManagementInner />
    </Suspense>
  );
}
