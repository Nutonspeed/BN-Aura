import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlass,
  Eye,
  PencilSimple,
  Clock,
  Buildings,
  Funnel,
  IdentificationBadge,
  Sparkle,
  ArrowRight,
  IdentificationCard,
  ShieldCheck
} from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { Subscription } from '../hooks/useBillingData';
import ResponsiveTable from '@/components/ui/ResponsiveTable';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';

interface SubscriptionsTabProps {
  subscriptions: Subscription[];
  formatCurrency: (amount: number) => string;
}

const planPricing = {
  starter: { price: 2900, name: 'Starter' },
  professional: { price: 4900, name: 'Professional' },
  premium: { price: 7900, name: 'Premium' },
  enterprise: { price: 12900, name: 'Enterprise' }
};

export default function SubscriptionsTab({ subscriptions, formatCurrency }: SubscriptionsTabProps) {
  const t = useTranslations('admin.billing');
  const tCommon = useTranslations('common');
  
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-emerald-400 bg-emerald-500/20';
      case 'past_due': return 'text-amber-400 bg-amber-500/20';
      case 'canceled': return 'text-red-400 bg-red-500/20';
      case 'expired': return 'text-gray-400 bg-gray-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'starter': return 'text-gray-400 bg-gray-500/20';
      case 'professional': return 'text-blue-400 bg-blue-500/20';
      case 'premium': return 'text-purple-400 bg-purple-500/20';
      case 'enterprise': return 'text-amber-400 bg-amber-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesFilter = filter === 'all' || sub.status === filter;
    const matchesSearch = sub.clinic_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const columns = [
    {
      header: 'Cluster Identity',
      accessor: (subscription: Subscription) => (
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-all duration-500 shadow-inner shrink-0">
            <Buildings weight="duotone" className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-foreground truncate tracking-tight uppercase">{subscription.clinic_name}</p>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-muted-foreground tracking-widest">NODE_ID:</span>
              <span className="text-[10px] font-mono text-primary/60 font-bold uppercase">{subscription.clinic_id.slice(0, 8)}</span>
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Protocol Tier',
      accessor: (subscription: Subscription) => (
        <Badge variant="ghost" className={cn("border-none font-black text-[9px] uppercase tracking-widest px-3 py-1", getPlanColor(subscription.plan))}>
          {planPricing[subscription.plan as keyof typeof planPricing]?.name || subscription.plan}
        </Badge>
      )
    },
    {
      header: 'Sync Status',
      accessor: (subscription: Subscription) => (
        <Badge variant={subscription.status === 'active' ? 'success' : 'warning'} size="sm" className="font-black uppercase text-[8px] tracking-widest px-3 py-1">
          {subscription.status.replace('_', ' ')}
        </Badge>
      )
    },
    {
      header: 'Monthly Yield',
      accessor: (subscription: Subscription) => (
        <div className="space-y-0.5">
          <p className="font-black text-foreground tabular-nums tracking-tight">{formatCurrency(subscription.amount)}</p>
          <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest opacity-60">Base Commitment</p>
        </div>
      )
    },
    {
      header: 'Next Settlement',
      accessor: (subscription: Subscription) => (
        <div className="flex items-center gap-2.5 text-muted-foreground">
          <Clock weight="bold" className="w-4 h-4 text-primary/60" />
          <span className="text-xs font-bold tabular-nums">
            {new Date(subscription.next_billing_date).toLocaleDateString()}
          </span>
        </div>
      )
    },
    {
      header: '',
      className: 'text-right',
      accessor: (subscription: Subscription) => (
        <div className="flex items-center justify-end gap-2">
          <Button 
            variant="outline"
            size="sm"
            className="h-10 w-10 p-0 border-border/50 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
          >
            <Eye weight="bold" className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline"
            size="sm"
            className="h-10 w-10 p-0 border-border/50 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
          >
            <PencilSimple weight="bold" className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8">
      {/* Search & Intelligence Controls */}
      <div className="px-2">
        <Card className="p-8 rounded-[40px] border-border/50 shadow-premium relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <ShieldCheck className="w-64 h-64 text-primary" />
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Active Subscriptions</h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-black">Managing cluster licensing nodes</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 flex-1 lg:max-w-2xl justify-end">
              <div className="relative w-full sm:w-64 group/input">
                <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity rounded-xl" />
                <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder="Query cluster node name..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-2xl py-3 pl-11 pr-4 text-sm text-foreground focus:outline-none focus:border-primary transition-all shadow-inner relative z-10 font-medium"
                />
              </div>
              
              <div className="relative w-full sm:w-48">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-2xl py-3 px-6 text-xs font-black uppercase tracking-widest text-foreground focus:border-primary outline-none transition-all appearance-none shadow-inner"
                >
                  <option value="all">ALL NODES</option>
                  <option value="active">ACTIVE</option>
                  <option value="past_due">PAST DUE</option>
                  <option value="canceled">CANCELED</option>
                  <option value="expired">EXPIRED</option>
                </select>
                <Funnel weight="bold" className="absolute right-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border/30 flex items-center justify-between">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Showing {filteredSubscriptions.length} of {subscriptions.length} connected clusters
            </p>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Real-time Sync Active</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Subscriptions Registry Table */}
      <div className="px-2">
        <Card className="rounded-[40px] border-border/50 overflow-hidden shadow-premium">
          <ResponsiveTable
            columns={columns}
            data={filteredSubscriptions}
            rowKey={(sub) => sub.id}
            emptyMessage="Zero subscription nodes detected in current matrix."
            mobileCard={(subscription) => (
              <div className="space-y-5">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-secondary border border-border flex items-center justify-center text-primary shadow-inner">
                      <Buildings weight="duotone" className="w-7 h-7" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-foreground truncate uppercase tracking-tight">{subscription.clinic_name}</p>
                      <Badge variant="ghost" size="sm" className={cn("border-none font-black text-[8px] tracking-widest uppercase px-2 py-0.5", getPlanColor(subscription.plan))}>
                        {planPricing[subscription.plan as keyof typeof planPricing]?.name || subscription.plan}
                      </Badge>
                    </div>
                  </div>
                  <Badge variant={subscription.status === 'active' ? 'success' : 'warning'} size="sm" className="font-black uppercase text-[8px] tracking-widest px-3">
                    {subscription.status.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-6 py-4 border-y border-border/50">
                  <div>
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Monthly Yield</p>
                    <p className="text-lg font-black text-foreground tabular-nums">{formatCurrency(subscription.amount)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Next Settlement</p>
                    <p className="text-xs font-bold text-foreground tabular-nums">{new Date(subscription.next_billing_date).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    <IdentificationCard weight="bold" className="w-3.5 h-3.5 opacity-60" />
                    Archive #ID-{subscription.clinic_id.slice(0, 6).toUpperCase()}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      size="sm"
                      className="px-6 py-2 h-auto rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 border-border/50"
                    >
                      <Eye weight="bold" className="w-3.5 h-3.5" />
                      Detail
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      className="px-6 py-2 h-auto rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 border-border/50"
                    >
                      <PencilSimple weight="bold" className="w-3.5 h-3.5" />
                      Sync
                    </Button>
                  </div>
                </div>
              </div>
            )}
          />
        </Card>
      </div>
    </div>
  );
}
