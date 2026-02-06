'use client';

import { 
  CurrencyCircleDollar, 
  TrendUp, 
  TrendDown, 
  Clock, 
  CheckCircle, 
  XCircle, 
  MagnifyingGlass, 
  Funnel,
  DownloadSimple, 
  ArrowLeft, 
  Calendar,
  ArrowsClockwise,
  Coins,
  Receipt,
  IdentificationBadge,
  Sparkle,
  Monitor,
  Briefcase,
  Icon
} from '@phosphor-icons/react';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ResponsiveTable from '@/components/ui/ResponsiveTable';

interface CommissionRecord {
  id: string;
  date: string;
  customer_name: string;
  service_name: string;
  amount: number;
  commission_rate: number;
  commission_amount: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  payment_date?: string;
}

export default function CommissionsPage() {
  const { goBack } = useBackNavigation();
  const t = useTranslations('clinic.commissions');
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<CommissionRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [period, setPeriod] = useState('this_month');

  // Mock data for initial implementation
  useEffect(() => {
    const timer = setTimeout(() => {
      setRecords([
        {
          id: '1',
          date: '2024-02-01',
          customer_name: 'คุณสมชาย ใจดี',
          service_name: 'Ultra Lift Premium',
          amount: 15000,
          commission_rate: 5,
          commission_amount: 750,
          status: 'paid',
          payment_date: '2024-02-03'
        },
        {
          id: '2',
          date: '2024-02-02',
          customer_name: 'คุณสมหญิง รักดี',
          service_name: 'V-Shape Botox',
          amount: 8000,
          commission_rate: 5,
          commission_amount: 400,
          status: 'approved'
        },
        {
          id: '3',
          date: '2024-02-03',
          customer_name: 'คุณวิชัย รุ่งเรือง',
          service_name: 'Skin Rejuvenation',
          amount: 12000,
          commission_rate: 5,
          commission_amount: 600,
          status: 'pending'
        }
      ]);
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.service_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'approved': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'rejected': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'bg-secondary text-muted-foreground border-border';
    }
  };

  const columns = [
    {
      header: 'วันที่',
      accessor: (record: CommissionRecord) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {new Date(record.date).toLocaleDateString('th-TH')}
        </span>
      )
    },
    {
      header: 'ลูกค้า / บริการ',
      accessor: (record: CommissionRecord) => (
        <div>
          <p className="font-bold text-foreground">{record.customer_name}</p>
          <p className="text-[10px] text-muted-foreground font-medium">{record.service_name}</p>
        </div>
      )
    },
    {
      header: 'ยอดขาย',
      accessor: (record: CommissionRecord) => (
        <span className="text-sm font-bold text-foreground">
          ฿{record.amount.toLocaleString()}
        </span>
      )
    },
    {
      header: 'ค่าคอมมิชชั่น',
      accessor: (record: CommissionRecord) => (
        <div>
          <p className="text-sm font-bold text-primary">฿{record.commission_amount.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground font-medium">{record.commission_rate}% Rate</p>
        </div>
      )
    },
    {
      header: 'สถานะ',
      accessor: (record: CommissionRecord) => (
        <span className={cn(
          "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
          getStatusStyle(record.status)
        )}>
          {record.status === 'paid' ? 'จ่ายแล้ว' : 
           record.status === 'approved' ? 'อนุมัติแล้ว' : 
           record.status === 'pending' ? 'รออนุมัติ' : 'ปฏิเสธ'}
        </span>
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
            className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]"
          >
            <CurrencyCircleDollar weight="duotone" className="w-4 h-4" />
            Fiscal Incentive Registry
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-foreground tracking-tight uppercase"
          >
            Commission <span className="text-primary">Ledger</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            Orchestrating practitioner incentives, payout cycles, and clinical yield distributions.
          </motion.p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-secondary/50 border border-border/50 p-1.5 rounded-[24px] shadow-inner">
            {['this_month', 'last_month', 'all'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap",
                  period === p
                    ? "bg-primary text-primary-foreground border-primary shadow-premium"
                    : "bg-transparent text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground"
                )}
              >
                {p === 'this_month' ? 'This Cycle' : p === 'last_month' ? 'Prev Cycle' : 'Global'}
              </button>
            ))}
          </div>
          <Button 
            variant="outline"
            className="gap-2 px-6 py-6 rounded-2xl text-xs font-black uppercase tracking-widest border-border/50 hover:bg-secondary group"
          >
            <DownloadSimple weight="bold" className="w-4 h-4" />
            Export Vault
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-2">
        <StatCard
          title="Consolidated Earn"
          value={1750}
          prefix="฿"
          icon={Coins as Icon}
          trend="up"
          change={12.5}
          className="p-4"
        />
        <StatCard
          title="Settled Nodes"
          value={750}
          prefix="฿"
          icon={CheckCircle as Icon}
          iconColor="text-emerald-500"
          className="p-4"
        />
        <StatCard
          title="Pending Payouts"
          value={1000}
          prefix="฿"
          icon={Clock as Icon}
          iconColor="text-amber-500"
          className="p-4"
        />
        <StatCard
          title="Node Population"
          value={filteredRecords.length}
          icon={Receipt as Icon}
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
                placeholder="Query identity node name or protocol registry..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-2xl py-3.5 pl-12 pr-4 text-sm text-foreground focus:outline-none focus:border-primary transition-all shadow-inner relative z-10"
              />
            </div>
            
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-48 bg-secondary/50 border border-border rounded-2xl py-3.5 px-6 text-xs font-black uppercase tracking-widest text-foreground focus:border-primary outline-none transition-all appearance-none"
              >
                <option value="all">Protocol: ALL</option>
                <option value="pending">PENDING</option>
                <option value="approved">APPROVED</option>
                <option value="paid">SETTLED</option>
                <option value="rejected">VOID</option>
              </select>
              <Funnel weight="bold" className="absolute right-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40 pointer-events-none" />
            </div>
          </div>
        </Card>
      </div>

      {/* Ledger Table */}
      <div className="px-2">
        <Card className="rounded-[40px] border-border/50 overflow-hidden shadow-premium">
          <ResponsiveTable
            columns={columns}
            data={filteredRecords}
            loading={loading}
            rowKey={(record) => record.id}
            emptyMessage="Zero commission telemetry detected in current cycle."
            mobileCard={(record) => (
              <div className="space-y-5">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-secondary border border-border flex items-center justify-center text-primary shadow-inner">
                      <IdentificationBadge weight="duotone" className="w-7 h-7" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-foreground truncate uppercase tracking-tight">{record.customer_name}</p>
                      <p className="text-[10px] font-black text-muted-foreground truncate uppercase tracking-widest">{record.service_name}</p>
                    </div>
                  </div>
                  <Badge variant={
                    record.status === 'paid' ? 'success' : 
                    record.status === 'approved' ? 'default' : 
                    record.status === 'pending' ? 'warning' : 'destructive'
                  } size="sm" className="font-black uppercase text-[8px] tracking-widest px-3">
                    {record.status === 'paid' ? 'SETTLED' : 
                     record.status === 'approved' ? 'APPROVED' : 
                     record.status === 'pending' ? 'QUEUED' : 'VOID'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-6 py-4 border-y border-border/50">
                  <div>
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Fiscal Yield</p>
                    <p className="text-xs font-bold text-foreground tabular-nums">฿{record.amount.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Incentive Delta</p>
                    <p className="text-sm font-black text-primary tabular-nums">฿{record.commission_amount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    <Calendar weight="bold" className="w-3.5 h-3.5 opacity-60" />
                    Sync: {new Date(record.date).toLocaleDateString()}
                  </div>
                  {record.status === 'paid' && record.payment_date && (
                    <Badge variant="ghost" className="bg-emerald-500/5 text-emerald-500 border-none font-black text-[8px] uppercase tracking-widest px-3">
                      Settled node confirmed
                    </Badge>
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
