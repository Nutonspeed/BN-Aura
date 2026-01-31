'use client';

import { motion } from 'framer-motion';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  Phone,
  UserPlus,
  Sparkles,
  Loader2,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Link } from '@/i18n/routing';
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

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10 pb-20 font-sans"
    >
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
            className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-[0.3em]"
          >
            <Users className="w-4 h-4" />
            Patient Identity Management
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-white uppercase tracking-tight"
          >
            Customer <span className="text-primary text-glow">Database</span>
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
          className="flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-[0.1em] shadow-premium hover:brightness-110 transition-all active:scale-95 text-xs"
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
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Filter by identity, digital mail, or neural ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-3xl py-4 pl-14 pr-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all shadow-inner backdrop-blur-md relative z-10"
            />
          </motion.form>
          <motion.button 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-3 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all backdrop-blur-md"
          >
            <Filter className="w-4 h-4 text-primary" />
            <span>Advanced Filters</span>
          </motion.button>
        </div>
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ y: -5 }}
          className="glass-premium p-6 rounded-3xl border border-white/5 flex items-center justify-between group overflow-hidden relative"
        >
          <div className="absolute -top-2 -right-2 opacity-5 group-hover:opacity-10 transition-opacity">
            <Users className="w-16 h-16 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Active Population</p>
            <p className="text-3xl font-black text-white tracking-tighter">{totalCount.toLocaleString()}</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-premium group-hover:scale-110 transition-transform">
            <Users className="w-7 h-7" />
          </div>
        </motion.div>
      </div>

      {/* Customer List Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass-premium rounded-[40px] overflow-hidden border border-white/5 shadow-2xl relative"
      >
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.03]">
                <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Patient Identity</th>
                <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Cutaneous Health</th>
                <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Security Tier</th>
                <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Last Diagnostic</th>
                <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="w-10 h-10 text-primary animate-spin" />
                      <p className="text-sm text-muted-foreground animate-pulse font-black uppercase tracking-widest">Accessing Neural Database...</p>
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-40">
                      <Users className="w-12 h-12" />
                      <p className="text-sm font-black uppercase tracking-widest">No Patients Found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map((customer, i) => {
                  const skinScore = customer.metadata?.skinScore || 0;
                  const lastScan = customer.metadata?.lastScan || customer.created_at;
                  
                  return (
                    <motion.tr 
                      key={customer.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="group hover:bg-white/[0.05] transition-all relative overflow-hidden"
                    >
                      <td className="px-8 py-6 relative">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary/0 group-hover:bg-primary transition-all" />
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary text-sm font-black border border-primary/20 shadow-premium group-hover:scale-110 transition-transform duration-500">
                            {customer.full_name.charAt(0)}
                          </div>
                          <div className="flex flex-col space-y-1 pr-6">
                            <Link href={`/clinic/customers/${customer.id}`} className="hover:underline">
                              <span className="text-base font-black text-white group-hover:text-primary transition-colors tracking-tight">
                                {customer.full_name} {customer.nickname ? `(${customer.nickname})` : ''}
                              </span>
                            </Link>
                            <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground font-medium italic">
                              <span className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-primary/60" /> {customer.email || 'No Email'}</span>
                              <div className="w-1 h-1 rounded-full bg-white/10" />
                              <span className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-primary/60" /> {customer.phone || 'No Phone'}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-2 w-48">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Neural Score</span>
                            <span className="text-xs font-black text-white">{skinScore}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${skinScore}%` }}
                              transition={{ duration: 1.5, ease: "easeOut" }}
                              className={cn(
                                "h-full rounded-full shadow-sm",
                                skinScore > 80 ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" : 
                                skinScore > 70 ? "bg-primary shadow-[0_0_10px_rgba(var(--primary),0.4)]" : 
                                skinScore > 0 ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]" : "bg-white/10"
                              )} 
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={cn(
                          "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm transition-all duration-500",
                          customer.customer_type === 'premium' 
                            ? "bg-primary/20 border-primary/30 text-primary group-hover:bg-primary group-hover:text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.1)]" 
                            : "bg-white/5 border-white/10 text-muted-foreground"
                        )}>
                          {customer.customer_type}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col space-y-1.5">
                          <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                            <Sparkles className="w-3 h-3 animate-pulse" /> AI Validated
                          </span>
                          <span className="text-xs text-white/60 font-medium tabular-nums">
                            {new Date(lastScan).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEditCustomer(customer)}
                          className="p-3 text-white/30 hover:text-white transition-all rounded-xl hover:bg-white/10 border border-transparent hover:border-white/5 shadow-sm group/btn"
                        >
                          <MoreVertical className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                        </motion.button>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function CustomerManagement() {
  return (
    <Suspense fallback={
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-6">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Initializing Customer Interface...</p>
      </div>
    }>
      <CustomerManagementContent />
    </Suspense>
  );
}
