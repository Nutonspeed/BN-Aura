'use client';

import { 
  CreditCard,
  ArrowsClockwise,
  DownloadSimple,
  SpinnerGap,
  Package,
  FileText,
  ChartLineUp,
  Receipt,
  CalendarDots,
  CaretRight,
  Info,
  ShieldCheck,
  Pulse
} from '@phosphor-icons/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/StatCard';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBillingData } from './hooks/useBillingData';
import BillingStatsCards from './components/BillingStatsCards';
import SubscriptionsTab from './components/SubscriptionsTab';
import InvoicesTab from './components/InvoicesTab';
import InvoiceModal from './components/InvoiceModal';

export default function BillingManagementPage() {
  const { goBack } = useBackNavigation();
  const { subscriptions, stats, loading, refreshData } = useBillingData();
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'invoices'>('subscriptions');
  const [refreshing, setRefreshing] = useState(false);

  const tabs = [
    { id: 'subscriptions', label: 'แพ็กเกจ', icon: Package },
    { id: 'invoices', label: 'ใบแจ้งหนี้และใบเสร็จ', icon: FileText }
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleDownload = (id: string) => {
    alert(`กำลังดาวน์โหลดใบแจ้งหนี้ ${id}...`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <SpinnerGap className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10 pb-20 font-sans"
    >
      <Breadcrumb />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]"
          >
            <CreditCard weight="duotone" className="w-4 h-4" />
            สถาปัตยกรรมทางการเงิน
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-foreground tracking-tight uppercase"
          >
            แพ็กเกจและ<span className="text-primary">การเรียกเก็บเงิน</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            Orchestrating clinic subscriptions, revenue streams, and automated invoicing nodes.
          </motion.p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2 px-6 py-6 rounded-2xl text-xs font-black uppercase tracking-widest border-border/50"
          >
            <ArrowsClockwise weight="bold" className={cn("w-4 h-4", refreshing && "animate-spin")} />
            Sync Ledger
          </Button>
          <Button className="gap-2 px-8 py-6 rounded-2xl text-xs font-black uppercase tracking-widest shadow-premium">
            <DownloadSimple weight="bold" className="w-4 h-4" />
            Export Intelligence
          </Button>
        </div>
      </div>

      {/* Stats Cards - Using our unified StatCard internally if possible, but BillingStatsCards might have its own grid */}
      <div className="px-2">
        <BillingStatsCards stats={stats} formatCurrency={formatCurrency} />
      </div>

      {/* Navigation & Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-2 bg-secondary/50 p-1.5 rounded-[24px] border border-border/50 w-full sm:w-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest border whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground border-primary shadow-premium"
                  : "bg-transparent text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground"
              )}
            >
              <tab.icon weight={activeTab === tab.id ? "fill" : "bold"} className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <Badge variant="ghost" className="bg-primary/5 text-primary border-none font-black text-[10px] tracking-widest uppercase px-4 py-2">
          Secure Fiscal Node
        </Badge>
      </div>

      {/* Tab Content */}
      <div className="px-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {activeTab === 'subscriptions' ? (
              <SubscriptionsTab subscriptions={subscriptions} formatCurrency={formatCurrency} />
            ) : (
              <InvoicesTab 
                formatCurrency={formatCurrency}
                onDownload={handleDownload}
                onViewInvoice={setSelectedInvoice}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Invoice Detail Modal */}
      <InvoiceModal
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onDownload={handleDownload}
        formatCurrency={formatCurrency}
      />
    </motion.div>
  );
}
