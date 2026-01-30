'use client';

import { motion } from 'framer-motion';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  Phone, 
  Sparkles, 
  UserPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CustomerManagement() {
  const customers = [
    {
      id: 1,
      name: 'Thanaporn S.',
      email: 'thanaporn.s@example.com',
      phone: '081-234-5678',
      lastScan: '2026-01-28',
      skinScore: 84,
      status: 'Member',
      avatar: 'TS'
    },
    {
      id: 2,
      name: 'Kitti P.',
      email: 'kitti.p@example.com',
      phone: '089-876-5432',
      lastScan: '2026-01-25',
      skinScore: 72,
      status: 'Premium',
      avatar: 'KP'
    },
    {
      id: 3,
      name: 'Nattaya R.',
      email: 'nattaya.r@example.com',
      phone: '085-555-0192',
      lastScan: '2026-01-30',
      skinScore: 91,
      status: 'Member',
      avatar: 'NR'
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white text-glow">Customer Database</h1>
          <p className="text-muted-foreground font-light text-sm">Track patient profiles, skin history and treatment progress.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold shadow-premium hover:brightness-110 transition-all active:scale-95">
          <UserPlus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Search & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input 
              type="text" 
              placeholder="Search by name, email or phone..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-white hover:bg-white/10 transition-all">
            <Filter className="w-4 h-4" />
            <span>Advanced Filters</span>
          </button>
        </div>
        <div className="glass-card p-4 rounded-2xl border border-white/5 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Total Customers</p>
            <p className="text-2xl font-bold text-white">1,284</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Customer List */}
      <div className="glass-card rounded-3xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">Skin Health</th>
                <th className="px-6 py-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">Last Activity</th>
                <th className="px-6 py-4 text-sm font-medium text-muted-foreground uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {customers.map((customer, i) => (
                <motion.tr 
                  key={customer.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                        {customer.avatar}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white font-medium group-hover:text-primary transition-colors">{customer.name}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {customer.email}</span>
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {customer.phone}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full",
                            customer.skinScore > 80 ? "bg-emerald-500" : customer.skinScore > 70 ? "bg-amber-500" : "bg-rose-500"
                          )} 
                          style={{ width: `${customer.skinScore}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-white">{customer.skinScore}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                      customer.status === 'Premium' 
                        ? "bg-purple-500/10 border-purple-500/20 text-purple-400" 
                        : "bg-white/5 border-white/10 text-muted-foreground"
                    )}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-white/80 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-primary" /> Last Scan
                      </span>
                      <span className="text-xs text-muted-foreground font-light">{customer.lastScan}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-muted-foreground hover:text-white transition-colors rounded-lg hover:bg-white/5">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
