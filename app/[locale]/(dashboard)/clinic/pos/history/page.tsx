'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  DownloadSimple
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
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

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10 pb-20 font-sans"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.back()}
            className="p-4 bg-white/5 border border-white/10 rounded-2xl text-muted-foreground hover:text-white transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]">
              <ClockCounterClockwise className="w-4 h-4" />
              Audit Log Node
            </div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tight">Sales <span className="text-primary text-glow">History</span></h1>
          </div>
        </div>

        <div className="flex bg-white/5 border border-white/10 p-1 rounded-2xl">
          <div className="relative group">
            <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Filter by TXN or Patient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none py-3 pl-11 pr-4 text-xs font-bold text-white focus:outline-none w-64"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Transaction List */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <SpinnerGap className="w-10 h-10 text-primary animate-spin" />
              <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em]">Syncing Audit Stream...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-4 opacity-40">
              <ShoppingCart className="w-12 h-12" />
              <p className="text-xs font-black uppercase tracking-widest">Zero Sales Nodes Detected</p>
            </div>
          ) : (
            filteredTransactions.map((txn) => (
              <motion.button
                key={txn.id}
                onClick={() => setSelectedTransaction(txn)}
                className={cn(
                  "w-full flex items-center justify-between p-6 rounded-[32px] border transition-all text-left group relative overflow-hidden",
                  selectedTransaction?.id === txn.id 
                    ? "bg-primary/10 border-primary/40 shadow-glow-sm" 
                    : "bg-white/5 border-white/5 hover:border-white/10"
                )}
              >
                <div className="flex items-center gap-6 relative z-10">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500",
                    selectedTransaction?.id === txn.id ? "bg-primary text-primary-foreground" : "bg-white/5 text-muted-foreground"
                  )}>
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[10px] font-mono text-primary/60 font-bold tracking-widest">{txn.transaction_number}</span>
                      <span className={cn(
                        "text-[8px] font-black uppercase px-2 py-0.5 rounded-md border",
                        txn.payment_status === 'paid' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                      )}>
                        {txn.payment_status}
                      </span>
                    </div>
                    <h4 className="text-base font-black text-white group-hover:text-primary transition-colors">{txn.customer?.full_name || 'Anonymous Node'}</h4>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1 font-medium italic">
                      {new Date(txn.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="text-right relative z-10">
                  <p className="text-xl font-black text-white tracking-tighter tabular-nums">฿{Number(txn.total_amount).toLocaleString()}</p>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{txn.items.length} Items</p>
                </div>
              </motion.button>
            ))
          )}
        </div>

        {/* Transaction Detail Panel */}
        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            {selectedTransaction ? (
              <motion.div
                key={selectedTransaction.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="glass-premium p-8 rounded-[40px] border border-white/10 space-y-8 sticky top-24"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">Receipt Data</h3>
                  <div className="flex gap-2">
                    <button className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-muted-foreground hover:text-white transition-all"><Printer className="w-4 h-4" /></button>
                    <button className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-muted-foreground hover:text-white transition-all"><DownloadSimple className="w-4 h-4" /></button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black">
                      {selectedTransaction.customer?.full_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Patient Identity</p>
                      <p className="text-sm font-bold text-white">{selectedTransaction.customer?.full_name}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Protocol Payload</p>
                    <div className="space-y-3">
                      {selectedTransaction.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <div className="space-y-0.5">
                            <p className="font-bold text-white line-clamp-1">{item.item_name}</p>
                            <p className="text-[9px] text-muted-foreground uppercase tracking-widest">{item.quantity} x ฿{Number(item.unit_price).toLocaleString()}</p>
                          </div>
                          <p className="font-black text-white tabular-nums">฿{Number(item.total).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/5 space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      <span>Operational Total</span>
                      <span className="text-white text-base tracking-tighter">฿{Number(selectedTransaction.total_amount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      <span>Status</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-md border",
                        selectedTransaction.payment_status === 'paid' ? "border-emerald-500/30 text-emerald-400" : "border-amber-500/30 text-amber-400"
                      )}>
                        {selectedTransaction.payment_status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <button className="w-full py-4 bg-primary/10 border border-primary/30 text-primary text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-primary/20 transition-all shadow-glow-sm">
                    Re-Verify Transaction
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-[400px] flex flex-col items-center justify-center glass-card rounded-[40px] border border-white/5 opacity-20 text-center p-10"
              >
                <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center mb-6 animate-float">
                  <ClockCounterClockwise className="w-8 h-8" />
                </div>
                <p className="text-xs font-black uppercase tracking-widest">Select Node to Inspect Payload</p>
              </motion.div>
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
