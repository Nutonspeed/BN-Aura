'use client';

import { motion } from 'framer-motion';
import { 
  Users,
  MagnifyingGlass,
  Funnel,
  DotsThreeVertical,
  EnvelopeSimple,
  Phone,
  UserPlus,
  Sparkle,
  SpinnerGap,
  Plus
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { Link, useRouter } from '@/i18n/routing';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import Breadcrumb from '@/components/ui/Breadcrumb';
import ResponsiveTable from '@/components/ui/ResponsiveTable';
import CustomerModal from '@/components/CustomerModal';

interface Customer {
  id: string;
  full_name: string;
  nickname?: string;
  email?: string;
  phone?: string;
  status: string;
  customer_type: string;
  created_at: string;
  metadata?: {
    skinScore?: number;
    lastScan?: string;
  };
}

function CustomerManagementContent() {
  const { goBack } = useBackNavigation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(undefined);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const q = searchParams.get('q') || '';
      const page = searchParams.get('page') || '1';
      const res = await fetch(`/api/customers?q=${encodeURIComponent(q)}&page=${page}`);
      const result = await res.json();
      
      if (result.success) {
        setCustomers(result.data);
        setTotalCount(result.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchTerm) {
      params.set('q', searchTerm);
    } else {
      params.delete('q');
    }
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleAddCustomer = () => {
    setSelectedCustomer(undefined);
    setIsModalOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const columns = [
    {
      header: 'Patient Identity',
      accessor: (customer: Customer) => (
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shadow-sm shrink-0">
            {customer.full_name.charAt(0)}
          </div>
          <div className="min-w-0">
            <Link href={`/clinic/customers/${customer.id}`} className="font-bold text-foreground hover:text-primary transition-colors truncate block">
              {customer.full_name} {customer.nickname ? `(${customer.nickname})` : ''}
            </Link>
            <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1"><EnvelopeSimple className="w-3 h-3" /> {customer.email || 'No Email'}</span>
              <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {customer.phone || 'No Phone'}</span>
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Cutaneous Health',
      accessor: (customer: Customer) => {
        const skinScore = customer.metadata?.skinScore || 0;
        return (
          <div className="space-y-1.5 w-32">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Score</span>
              <span className="text-[10px] font-bold text-foreground">{skinScore}%</span>
            </div>
            <div className="h-1 w-full bg-secondary rounded-full overflow-hidden border border-border">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${skinScore}%` }}
                className={cn(
                  "h-full rounded-full",
                  skinScore > 80 ? "bg-emerald-500" : skinScore > 70 ? "bg-primary" : "bg-rose-500"
                )} 
              />
            </div>
          </div>
        );
      }
    },
    {
      header: 'Security Tier',
      accessor: (customer: Customer) => (
        <span className={cn(
          "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border",
          customer.customer_type === 'premium' 
            ? "bg-primary/10 border-primary/20 text-primary" 
            : "bg-secondary border-border text-muted-foreground"
        )}>
          {customer.customer_type}
        </span>
      )
    },
    {
      header: 'Last Diagnostic',
      accessor: (customer: Customer) => {
        const lastScan = customer.metadata?.lastScan || customer.created_at;
        return (
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Sparkle className="w-3 h-3 animate-pulse" /> AI Validated
            </span>
            <span className="text-xs text-muted-foreground mt-0.5">
              {new Date(lastScan).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        );
      }
    },
    {
      header: '',
      className: 'text-right',
      accessor: (customer: Customer) => (
        <button 
          onClick={() => handleEditCustomer(customer)}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-all"
        >
          <DotsThreeVertical className="w-5 h-5" />
        </button>
      )
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-20 font-sans"
    >
      <Breadcrumb />

      <CustomerModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchCustomers}
        customer={selectedCustomer}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-[0.3em]"
          >
            <Users className="w-4 h-4" />
            Patient Identity Management
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-foreground uppercase tracking-tight"
          >
            Customer <span className="text-primary">Database</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            Managing patient profiles, cutaneous history, and aesthetic progress nodes.
          </motion.p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAddCustomer}
          className="flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold uppercase tracking-[0.1em] shadow-premium hover:brightness-110 transition-all active:scale-95 text-xs"
        >
          <UserPlus className="w-4 h-4 stroke-[3px]" />
          <span>Register New Patient</span>
        </motion.button>
      </div>

      {/* Search & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 flex flex-col sm:flex-row gap-6">
          <motion.form 
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative flex-1 group"
          >
            <div className="absolute inset-0 bg-primary/10 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-3xl" />
            <MagnifyingGlass className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Filter by identity, digital mail, or neural ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl py-4 pl-14 pr-6 text-sm text-foreground focus:outline-none focus:border-primary transition-all shadow-inner backdrop-blur-md relative z-10"
            />
          </motion.form>
          <motion.button 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-3 px-6 py-4 bg-secondary border border-border rounded-xl text-xs font-bold uppercase tracking-widest text-foreground hover:bg-accent transition-all backdrop-blur-md"
          >
            <Funnel className="w-4 h-4 text-primary" />
            <span>Advanced Filters</span>
          </motion.button>
        </div>
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ y: -5 }}
          className="bg-card p-6 rounded-2xl border border-border shadow-card flex items-center justify-between group overflow-hidden relative"
        >
          <div className="absolute -top-2 -right-2 opacity-5 group-hover:opacity-10 transition-opacity">
            <Users className="w-16 h-16 text-foreground" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">Active Population</p>
            <p className="text-3xl font-bold text-foreground tracking-tighter">{totalCount.toLocaleString()}</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-premium group-hover:scale-110 transition-transform">
            <Users className="w-7 h-7" />
          </div>
        </motion.div>
      </div>

      {/* Customer List Table */}
      <ResponsiveTable
        columns={columns}
        data={customers}
        loading={loading}
        rowKey={(c) => c.id}
        emptyMessage="No patients found in the neural database"
        onRowClick={(c) => router.push(`/clinic/customers/${c.id}`)}
        mobileCard={(c) => (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                {c.full_name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-foreground truncate">{c.full_name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={cn(
                    "px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider border",
                    c.customer_type === 'premium' ? "bg-primary/10 border-primary/20 text-primary" : "bg-secondary border-border text-muted-foreground"
                  )}>
                    {c.customer_type}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{c.phone}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Skin Score</p>
                <p className="text-sm font-bold text-primary">{c.metadata?.skinScore || 0}%</p>
              </div>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-border">
              <span className="text-[10px] text-muted-foreground italic">
                Last Diagnostic: {new Date(c.metadata?.lastScan || c.created_at).toLocaleDateString()}
              </span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditCustomer(c);
                }}
                className="p-2 bg-secondary border border-border rounded-xl text-muted-foreground"
              >
                <DotsThreeVertical className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      />
    </motion.div>
  );
}

export default function CustomerManagement() {
  return (
    <Suspense fallback={
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-6">
        <SpinnerGap className="w-12 h-12 text-primary animate-spin" />
        <p className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Initializing Customer Interface...</p>
      </div>
    }>
      <CustomerManagementContent />
    </Suspense>
  );
}
