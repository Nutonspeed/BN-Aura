'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, RefreshCw, Download, Loader2, Package, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBillingData } from './hooks/useBillingData';
import BillingStatsCards from './components/BillingStatsCards';
import SubscriptionsTab from './components/SubscriptionsTab';
import InvoicesTab from './components/InvoicesTab';
import InvoiceModal from './components/InvoiceModal';

export default function BillingManagementPage() {
  const { subscriptions, stats, loading, refreshData } = useBillingData();
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'invoices'>('subscriptions');
  const [refreshing, setRefreshing] = useState(false);

  const tabs = [
    { id: 'subscriptions', label: 'Subscriptions', icon: Package },
    { id: 'invoices', label: 'Invoices & Receipts', icon: FileText }
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleDownload = (id: string) => {
    alert(`Downloading invoice ${id}...`);
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
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-primary" />
            Subscription & Billing
          </h1>
          <p className="text-white/60 mt-1">
            Manage subscriptions, billing, and revenue
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:brightness-110 transition-all flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <BillingStatsCards stats={stats} formatCurrency={formatCurrency} />

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-premium"
                : "text-white/60 hover:text-white hover:bg-white/5"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
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
