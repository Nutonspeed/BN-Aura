'use client';

import { 
  Warning, 
  Package, 
  Calendar, 
  ArrowLeft, 
  MagnifyingGlass, 
  ArrowsClockwise,
  CheckCircle,
  Clock,
  WarningCircle,
  Bell,
  Archive,
  Truck,
  Buildings,
  Stack,
  CaretRight,
  ShieldCheck,
  Funnel
} from '@phosphor-icons/react';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/i18n/routing';
import ResponsiveTable from '@/components/ui/ResponsiveTable';

interface InventoryAlert {
  id: string;
  product_id: string;
  product_name: string;
  type: 'low_stock' | 'out_of_stock' | 'expiring' | 'expired';
  current_value: number | string;
  threshold_value: number | string;
  status: 'pending' | 'resolved' | 'ignored';
  created_at: string;
}

export default function InventoryAlertsPage() {
  const { goBack } = useBackNavigation();
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    const timer = setTimeout(() => {
      setAlerts([
        {
          id: '1',
          product_id: 'p1',
          product_name: 'Botox Type A 100u',
          type: 'low_stock',
          current_value: 5,
          threshold_value: 10,
          status: 'pending',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          product_id: 'p2',
          product_name: 'Filler Juvederm Voluma',
          type: 'expiring',
          current_value: '2024-03-15',
          threshold_value: '30 days',
          status: 'pending',
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          product_id: 'p3',
          product_name: 'Alcohol Gel 500ml',
          type: 'out_of_stock',
          current_value: 0,
          threshold_value: 1,
          status: 'resolved',
          created_at: new Date().toISOString()
        }
      ]);
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'out_of_stock':
      case 'expired':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'low_stock':
      case 'expiring':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default:
        return 'bg-secondary text-muted-foreground border-border';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'low_stock': return 'สต็อกต่ำ';
      case 'out_of_stock': return 'สินค้าหมด';
      case 'expiring': return 'กำลังหมดอายุ';
      case 'expired': return 'หมดอายุแล้ว';
      default: return type;
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.product_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || alert.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const columns = [
    {
      header: 'ประเภท',
      accessor: (alert: InventoryAlert) => (
        <span className={cn(
          "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
          getTypeStyle(alert.type)
        )}>
          {getTypeLabel(alert.type)}
        </span>
      )
    },
    {
      header: 'สินค้า',
      accessor: (alert: InventoryAlert) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Package className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-foreground">{alert.product_name}</span>
        </div>
      )
    },
    {
      header: 'สถานะปัจจุบัน',
      accessor: (alert: InventoryAlert) => (
        <span className="text-sm font-medium text-foreground">
          {alert.current_value} / {alert.threshold_value}
        </span>
      )
    },
    {
      header: 'วันที่แจ้ง',
      accessor: (alert: InventoryAlert) => (
        <span className="text-sm text-muted-foreground">
          {new Date(alert.created_at).toLocaleDateString('th-TH')}
        </span>
      )
    },
    {
      header: 'จัดการ',
      className: 'text-right',
      accessor: (alert: InventoryAlert) => (
        alert.status === 'pending' ? (
          <button className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all border border-transparent hover:border-emerald-500/20">
            <CheckCircle className="w-5 h-5" />
          </button>
        ) : (
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Resolved</span>
        )
      )
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-20 font-sans"
    >
      <Breadcrumb />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-rose-500 text-[10px] font-black uppercase tracking-[0.3em]"
          >
            <WarningCircle weight="duotone" className="w-4 h-4" />
            Stock Depletion Alert Node
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-foreground tracking-tight uppercase"
          >
            Inventory <span className="text-rose-500">Alerts</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            Monitoring critical stock thresholds, expiration timelines, and supply chain anomalies.
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
                    node.id === 'alerts'
                      ? "bg-rose-500 text-white border-rose-500 shadow-premium"
                      : "bg-transparent text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <node.icon weight={node.id === 'alerts' ? "fill" : "bold"} className="w-3.5 h-3.5" />
                  {node.label}
                </button>
              </Link>
            ))}
          </div>
          <Button 
            variant="outline"
            onClick={() => window.location.reload()}
            className="gap-2 px-6 py-6 rounded-2xl text-xs font-black uppercase tracking-widest border-border/50 hover:bg-secondary group"
          >
            <ArrowsClockwise weight="bold" className={cn("w-4 h-4", loading && "animate-spin")} />
            Sync registry
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-2">
        <StatCard
          title="Total Alerts"
          value={alerts.length}
          icon={Warning}
          className="p-4"
        />
        <StatCard
          title="Low Stock Nodes"
          value={alerts.filter(a => a.type === 'low_stock').length}
          icon={Package}
          iconColor="text-amber-500"
          className="p-4"
        />
        <StatCard
          title="Expired Nodes"
          value={alerts.filter(a => a.type === 'expired').length}
          icon={Calendar}
          iconColor="text-rose-500"
          className="p-4"
        />
        <StatCard
          title="Awaiting Action"
          value={alerts.filter(a => a.status === 'pending').length}
          icon={Clock}
          iconColor="text-blue-500"
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
                placeholder="Query asset name or alert designation..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-2xl py-3.5 pl-12 pr-4 text-sm text-foreground focus:outline-none focus:border-primary transition-all shadow-inner relative z-10"
              />
            </div>
            
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full sm:w-64 bg-secondary/50 border border-border rounded-2xl py-3.5 px-6 text-xs font-black uppercase tracking-widest text-foreground focus:border-primary outline-none transition-all appearance-none font-bold"
              >
                <option value="all" className="bg-card">PROTOCOL: ALL ALERTS</option>
                <option value="low_stock" className="bg-card">NODE: LOW STOCK</option>
                <option value="out_of_stock" className="bg-card">NODE: DEPLETED</option>
                <option value="expiring" className="bg-card">NODE: EXPIRING</option>
                <option value="expired" className="bg-card">NODE: EXPIRED</option>
              </select>
              <Funnel weight="bold" className="absolute right-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40 pointer-events-none" />
            </div>
          </div>
        </Card>
      </div>

      {/* Alerts Registry Table */}
      <div className="px-2">
        <Card className="rounded-[40px] border-border/50 overflow-hidden shadow-premium">
          <ResponsiveTable
            columns={columns}
            data={filteredAlerts}
            loading={loading}
            rowKey={(alert) => alert.id}
            emptyMessage="Zero inventory anomalies detected in current matrix."
            mobileCard={(alert) => (
              <div className="space-y-5">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl border flex items-center justify-center transition-all duration-500 shadow-inner",
                      getTypeStyle(alert.type)
                    )}>
                      <Package weight="duotone" className="w-7 h-7" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-foreground truncate uppercase tracking-tight">{alert.product_name}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="ghost" className={cn("border-none font-black text-[8px] tracking-widest uppercase px-2 py-0.5", getTypeStyle(alert.type))}>
                          {getTypeLabel(alert.type)}
                        </Badge>
                        <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">ID-{alert.product_id.slice(0,4)}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={alert.status === 'pending' ? 'destructive' : 'secondary'} size="sm" className="font-black uppercase text-[8px] tracking-widest px-3">
                    {alert.status.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-6 py-4 border-y border-border/50">
                  <div>
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Telemetry Status</p>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-black text-foreground tabular-nums">{alert.current_value}</p>
                      <span className="text-[10px] font-medium text-muted-foreground">/ {alert.threshold_value} Target</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Timestamp</p>
                    <p className="text-sm font-bold text-foreground tabular-nums">{new Date(alert.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    <ShieldCheck weight="bold" className="w-3.5 h-3.5 opacity-60" />
                    Protocol: {alert.status === 'pending' ? 'Active Attention' : 'Anomaly Resolved'}
                  </div>
                  {alert.status === 'pending' && (
                    <Button 
                      variant="outline"
                      size="sm"
                      className="px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10 shadow-sm"
                    >
                      <CheckCircle weight="bold" className="w-4 h-4 mr-2" />
                      Resolve Node
                    </Button>
                  )}
                </div>
              </div>
            )}
          />
        </Card>
      </div>
    </motion.div>
  );
}
