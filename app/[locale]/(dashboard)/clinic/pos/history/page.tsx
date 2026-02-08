'use client';

import { 
  ClockCounterClockwise,
  MagnifyingGlass,
  CalendarDots,
  Funnel,
  CaretRight,
  SpinnerGap,
  ArrowLeft,
  CreditCard,
  ShoppingCart,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Printer,
  DownloadSimple,
  Receipt,
  Monitor,
  IdentificationBadge,
  Sparkle,
  ArrowsClockwise,
  Icon,
  DotsThreeVertical,
  IdentificationCard
} from '@phosphor-icons/react';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useRouter } from '@/i18n/routing';
import { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TransactionItem {
  id: string;
  item_name: string;
  item_type: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Transaction {
  id: string;
  transaction_number: string;
  total_amount: number;
  payment_status: string;
  created_at: string;
  customer: {
    full_name: string;
    phone?: string;
  };
  items: TransactionItem[];
}

function POSHistoryContent() {
  const { goBack } = useBackNavigation();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pos/transactions');
      const result = await res.json();
      if (result.success) {
        setTransactions(result.data || []);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const filteredTransactions = transactions.filter(txn => 
    txn.transaction_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    txn.customer?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = useMemo(() => ({
    total: transactions.length,
    volume: transactions.reduce((acc, t) => acc + Number(t.total_amount), 0),
    paid: transactions.filter(t => t.payment_status === 'paid').length,
    pending: transactions.filter(t => t.payment_status === 'pending').length
  }), [transactions]);

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
            className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]"
          >
            <ClockCounterClockwise weight="duotone" className="w-4 h-4" />
            Audit Log Registry
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-foreground tracking-tight uppercase"
          >
            Sales <span className="text-primary">History</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            Reviewing historical fiscal nodes, transaction telemetry, and settled protocol records.
          </motion.p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button 
            variant="outline"
            onClick={fetchTransactions}
            disabled={loading}
            className="gap-2 px-6 py-6 rounded-2xl text-xs font-black uppercase tracking-widest border-border/50 hover:bg-secondary group"
          >
            <ArrowsClockwise weight="bold" className={cn("w-4 h-4", loading && "animate-spin")} />
            Sync Ledger
          </Button>
          <Button className="gap-2 px-8 py-6 rounded-2xl text-xs font-black uppercase tracking-widest shadow-premium">
            <DownloadSimple weight="bold" className="w-4 h-4" />
            Export Archive
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-2">
        <StatCard
          title="Consolidated Yield"
          value={stats.volume}
          prefix="฿"
          icon={Receipt as Icon}
          className="p-4"
        />
        <StatCard
          title="Settled Nodes"
          value={stats.paid}
          icon={CheckCircle as Icon}
          iconColor="text-emerald-500"
          className="p-4"
        />
        <StatCard
          title="Pending Flux"
          value={stats.pending}
          icon={Clock as Icon}
          iconColor="text-amber-500"
          className="p-4"
        />
        <StatCard
          title="Total Transactions"
          value={stats.total}
          icon={ShoppingCart as Icon}
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
                placeholder="Query transaction ID, patient identity, or ledger metadata..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-2xl py-3.5 pl-12 pr-4 text-sm text-foreground focus:outline-none focus:border-primary transition-all shadow-inner relative z-10 font-bold"
              />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 px-2">
        {/* Transaction List Node */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="py-32 flex flex-col items-center justify-center gap-4 bg-card border border-border/50 rounded-[40px] shadow-inner">
              <SpinnerGap className="w-10 h-10 text-primary animate-spin" />
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">กำลังประมวลผลข้อมูลการตรวจสอบ...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <Card variant="ghost" className="py-32 border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-6 opacity-40 rounded-[40px]">
              <ShoppingCart weight="duotone" className="w-16 h-16 text-muted-foreground" />
              <p className="text-sm font-black uppercase tracking-widest text-center">Zero Transaction Nodes Detected</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredTransactions.map((txn, i) => (
                  <motion.button
                    key={txn.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setSelectedTransaction(txn)}
                    className={cn(
                      "w-full flex items-center justify-between p-6 rounded-[28px] border transition-all text-left group relative overflow-hidden",
                      selectedTransaction?.id === txn.id 
                        ? "bg-primary text-primary-foreground border-primary shadow-premium" 
                        : "bg-card border-border/50 hover:border-primary/30 shadow-card hover:shadow-card-hover"
                    )}
                  >
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                      <Receipt weight="fill" className="w-24 h-24" />
                    </div>

                    <div className="flex items-center gap-6 relative z-10">
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner",
                        selectedTransaction?.id === txn.id ? "bg-white/20" : "bg-secondary border border-border group-hover:bg-primary/10 transition-all"
                      )}>
                        <CreditCard weight="duotone" className="w-7 h-7" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <span className={cn(
                            "text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 rounded-md border uppercase",
                            selectedTransaction?.id === txn.id ? "bg-white/10 border-white/20 text-white" : "bg-primary/5 border-primary/20 text-primary"
                          )}>{txn.transaction_number}</span>
                          <Badge variant={txn.payment_status === 'paid' ? 'success' : 'warning'} size="sm" className="font-black uppercase text-[8px] tracking-widest px-2">
                            {txn.payment_status.toUpperCase()}
                          </Badge>
                        </div>
                        <h4 className="text-lg font-black uppercase tracking-tight truncate">{txn.customer?.full_name || 'ANONYMOUS_NODE'}</h4>
                        <p className={cn(
                          "text-[10px] font-black uppercase tracking-widest mt-1 opacity-60",
                          selectedTransaction?.id === txn.id ? "text-white" : "text-muted-foreground"
                        )}>
                          {new Date(txn.created_at).toLocaleString()} • SYNC_OK
                        </p>
                      </div>
                    </div>

                    <div className="text-right relative z-10 shrink-0">
                      <p className="text-2xl font-black tabular-nums tracking-tighter">฿{Number(txn.total_amount).toLocaleString()}</p>
                      <p className={cn(
                        "text-[9px] font-black uppercase tracking-widest",
                        selectedTransaction?.id === txn.id ? "text-white/60" : "text-muted-foreground"
                      )}>{txn.items.length} Protocol Nodes</p>
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Transaction Detail Panel Node */}
        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            {selectedTransaction ? (
              <motion.div
                key={selectedTransaction.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="sticky top-24"
              >
                <Card className="rounded-[40px] border-border/50 shadow-premium overflow-hidden bg-card/50 backdrop-blur-xl group">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                    <IdentificationCard weight="fill" className="w-48 h-48 text-primary" />
                  </div>

                  <CardHeader className="p-8 border-b border-border/50 bg-secondary/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                          <Receipt weight="duotone" className="w-6 h-6" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-black uppercase tracking-tight">Receipt Data</CardTitle>
                          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Protocol Transcript</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-xl hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all">
                          <Printer weight="bold" className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-xl hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all">
                          <DownloadSimple weight="bold" className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-8 space-y-10 relative z-10">
                    <div className="flex items-center gap-5 p-5 bg-secondary/30 rounded-[28px] border border-border/50 shadow-inner group/patient">
                      <div className="w-14 h-14 rounded-3xl bg-card border border-border/50 flex items-center justify-center text-primary font-black text-2xl group-hover/patient:scale-110 transition-transform">
                        {selectedTransaction.customer?.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Identity Node</p>
                        <p className="text-lg font-bold text-foreground truncate uppercase tracking-tight leading-tight">{selectedTransaction.customer?.full_name}</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between px-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Protocol Payload</p>
                        <Badge variant="ghost" className="bg-primary/5 text-primary border-none font-black text-[8px] uppercase tracking-widest px-2">{selectedTransaction.items.length} Units</Badge>
                      </div>
                      <div className="space-y-4">
                        {selectedTransaction.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center group/item">
                            <div className="space-y-1 min-w-0">
                              <p className="text-sm font-bold text-foreground group-hover/item:text-primary transition-colors uppercase tracking-tight truncate leading-tight">{item.item_name}</p>
                              <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest opacity-60">
                                {item.quantity} x ฿{Number(item.unit_price).toLocaleString()}
                              </p>
                            </div>
                            <p className="text-sm font-black text-foreground tabular-nums ml-4">฿{Number(item.total).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-8 border-t border-border/30 space-y-4">
                      <div className="flex justify-between items-center px-1">
                        <div className="space-y-0.5">
                          <span className="text-sm font-black text-foreground uppercase tracking-widest">Consolidated Total</span>
                          <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest opacity-60">Fiscal yield delta</p>
                        </div>
                        <span className="text-3xl font-black text-primary tabular-nums tracking-tighter text-glow">฿{Number(selectedTransaction.total_amount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Settlement Status</span>
                        <Badge variant={selectedTransaction.payment_status === 'paid' ? 'success' : 'warning'} className="font-black uppercase tracking-[0.2em] px-4 py-1.5 text-[9px] rounded-full shadow-sm">
                          <div className="flex items-center gap-2">
                            <div className={cn("w-1.5 h-1.5 rounded-full", selectedTransaction.payment_status === 'paid' ? "bg-emerald-500 animate-pulse" : "bg-amber-500")} />
                            {selectedTransaction.payment_status.toUpperCase()}
                          </div>
                        </Badge>
                      </div>
                    </div>

                    <div className="pt-6">
                      <Button className="w-full py-7 rounded-[24px] text-[11px] font-black uppercase tracking-[0.3em] shadow-premium group">
                        Re-Verify Node
                        <Sparkle weight="bold" className="w-4 h-4 ml-3 group-hover:scale-125 transition-transform" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <Card variant="ghost" className="h-[500px] flex flex-col items-center justify-center bg-secondary/10 border-2 border-dashed border-border/50 rounded-[40px] opacity-40 text-center p-12">
                <div className="w-20 h-20 rounded-[40px] bg-card border border-border/50 flex items-center justify-center mb-8 shadow-inner">
                  <ClockCounterClockwise weight="duotone" className="w-10 h-10 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-black text-foreground uppercase tracking-widest">Awaiting Node Selection</h4>
                  <p className="text-sm text-muted-foreground font-medium italic max-w-[240px] mx-auto">
                    Initialize inspection by selecting a specific transaction node from the audit log stream.
                  </p>
                </div>
              </Card>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export default function POSHistoryPage() {
  return (
    <Suspense fallback={
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-6">
        <SpinnerGap className="w-12 h-12 text-primary animate-spin" />
        <p className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Accessing Audit Cluster...</p>
      </div>
    }>
      <POSHistoryContent />
    </Suspense>
  );
}
