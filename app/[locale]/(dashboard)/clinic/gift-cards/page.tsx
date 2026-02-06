'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gift, 
  Plus, 
  MagnifyingGlass, 
  Copy, 
  EnvelopeSimple, 
  DownloadSimple, 
  Eye, 
  DotsThree,
  ArrowLeft,
  ArrowsClockwise,
  CheckCircle,
  Clock,
  CurrencyCircleDollar,
  Ticket
} from '@phosphor-icons/react';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface GiftCard {
  id: string;
  code: string;
  type: 'value' | 'service' | 'percentage';
  initial_value: number;
  current_balance: number;
  valid_until: string;
  is_active: boolean;
  recipient_name?: string;
  recipient_email?: string;
  purchased_by?: { full_name: string };
  created_at: string;
}

export default function GiftCardsPage() {
  const { goBack } = useBackNavigation();
  const t = useTranslations('clinic.gift-cards' as any);
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired' | 'depleted'>('all');

  useEffect(() => {
    fetchGiftCards();
  }, [filter]);

  const fetchGiftCards = async () => {
    try {
      setLoading(true);
      const supabase = (await import('@/lib/supabase/client')).createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: staffData } = await supabase.from('clinic_staff').select('clinic_id').eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle();
      if (!staffData?.clinic_id) return;
      let query = supabase.from('gift_cards').select('*, purchased_by:customers!gift_cards_purchased_by_customer_id_fkey(full_name)').eq('clinic_id', staffData.clinic_id).order('created_at', { ascending: false });
      if (filter === 'active') query = query.eq('is_active', true).gte('valid_until', new Date().toISOString());
      else if (filter === 'expired') query = query.lt('valid_until', new Date().toISOString());
      else if (filter === 'depleted') query = query.eq('current_balance', 0);
      const { data } = await query;
      setGiftCards(data || []);
    } catch (error) { console.error('Failed to fetch gift cards:', error); }
    finally { setLoading(false); }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const filteredCards = giftCards.filter(card =>
    card.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-20 font-sans"
    >
      <Breadcrumb />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em]"
          >
            <Gift weight="duotone" className="w-4 h-4" />
            Voucher Management Node
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-heading font-bold text-foreground tracking-tight"
          >
            Gift <span className="text-primary">Cards</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-light text-sm italic"
          >
            Orchestrating prepaid value nodes, clinical vouchers, and promotional credit cycles.
          </motion.p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={fetchGiftCards}
            disabled={loading}
            className="gap-2"
          >
            <ArrowsClockwise weight="bold" className={cn("w-4 h-4", loading && "animate-spin")} />
            Sync Vault
          </Button>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="gap-2 shadow-premium px-8"
          >
            <Plus weight="bold" className="w-4 h-4" />
            Issue Gift Card
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Units Issued"
          value={giftCards.length}
          icon={Gift}
          trend="neutral"
          iconColor="text-primary"
        />
        <StatCard
          title="Active Liquidity"
          value={giftCards.filter(c => c.is_active && c.current_balance > 0).length}
          icon={CheckCircle}
          trend="up"
          change={12}
          iconColor="text-emerald-500"
        />
        <StatCard
          title="Consolidated Balance"
          value={giftCards.reduce((sum, c) => sum + c.current_balance, 0)}
          prefix="฿"
          icon={CurrencyCircleDollar}
          trend="neutral"
          iconColor="text-indigo-500"
        />
        <StatCard
          title="Absorbed Value"
          value={giftCards.reduce((sum, c) => sum + (c.initial_value - c.current_balance), 0)}
          prefix="฿"
          icon={DownloadSimple}
          trend="up"
          change={8}
          iconColor="text-blue-500"
        />
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="relative flex-1 group">
          <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-xl" />
          <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search identity node or transmission code..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-secondary/50 border border-border rounded-2xl text-sm text-foreground focus:outline-none focus:border-primary transition-all shadow-inner relative z-10"
          />
        </div>
        <div className="flex bg-secondary/50 border border-border p-1 rounded-2xl w-fit shadow-inner">
          {(['all', 'active', 'expired', 'depleted'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                filter === f
                  ? "bg-card text-primary border-border/50 shadow-sm"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              )}
            >
              {f === 'all' ? 'All Units' : f === 'active' ? 'Operational' : f === 'expired' ? 'Expired' : 'Depleted'}
            </button>
          ))}
        </div>
      </div>

      {/* Gift Cards Grid */}
      <div className="space-y-6">
        {loading ? (
          <div className="py-32 flex flex-col items-center gap-4">
            <SpinnerGap className="w-10 h-10 text-primary animate-spin" />
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Accessing Vault Nodes...</p>
          </div>
        ) : filteredCards.length === 0 ? (
          <Card variant="ghost" className="py-32 border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-4 opacity-40">
            <Gift weight="duotone" className="w-16 h-16" />
            <p className="text-xs font-black uppercase tracking-widest">Zero Gift Assets Detected</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCards.map((card, i) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className={cn(
                  "h-full border-border/50 hover:border-primary/30 transition-all group overflow-hidden flex flex-col",
                  (!card.is_active || card.current_balance === 0) && "opacity-60 grayscale-[0.5]"
                )}>
                  <CardHeader className="pb-4 bg-secondary/30 border-b border-border/50 px-6">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-lg text-foreground tracking-tighter">{card.code}</span>
                          <button
                            onClick={() => copyCode(card.code)}
                            className="p-1.5 hover:bg-primary/10 rounded-lg text-muted-foreground hover:text-primary transition-all"
                          >
                            <Copy weight="bold" className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <Badge variant={
                          card.type === 'value' ? 'success' :
                          card.type === 'service' ? 'default' :
                          'warning'
                        } size="sm" className="font-black uppercase tracking-widest px-3 border-none">
                          {card.type === 'value' ? 'Fiscal Value' : card.type === 'service' ? 'Clinical Node' : 'Percentage Delta'}
                        </Badge>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-2 rounded-xl text-muted-foreground hover:text-primary"
                      >
                        <DotsThree weight="bold" className="w-5 h-5" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 flex-1 space-y-6 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Operational Balance</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-primary tracking-tighter tabular-nums">฿{card.current_balance.toLocaleString()}</span>
                          <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest opacity-60">/ ฿{card.initial_value.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden p-0.5 border border-border shadow-inner">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(card.current_balance / card.initial_value) * 100}%` }}
                          transition={{ duration: 1, delay: 0.2 }}
                          className={cn(
                            "h-full rounded-full shadow-glow-sm",
                            card.current_balance / card.initial_value > 0.5 ? "bg-emerald-500" : card.current_balance > 0 ? "bg-amber-500" : "bg-rose-500"
                          )}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      {card.recipient_name && (
                        <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-2xl border border-border/50 group-hover:border-primary/20 transition-all">
                          <div className="w-8 h-8 rounded-xl bg-card border border-border flex items-center justify-center text-primary shadow-sm">
                            <User weight="duotone" className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Target Identity</p>
                            <p className="text-sm font-bold text-foreground truncate">{card.recipient_name}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t border-border/50">
                        <div className="flex items-center gap-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                          <Clock weight="bold" className="w-3.5 h-3.5 text-primary/60" />
                          EXP: {formatDate(card.valid_until)}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="p-2 text-muted-foreground hover:text-primary">
                            <Eye weight="bold" className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="p-2 text-muted-foreground hover:text-primary">
                            <EnvelopeSimple weight="bold" className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="p-2 text-muted-foreground hover:text-primary">
                            <DownloadSimple weight="bold" className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card p-8 rounded-[32px] border border-border shadow-premium w-full max-w-lg relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <Plus weight="bold" className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">Issue Gift Asset</h2>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Configure prepaid node</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all"
                >
                  <X weight="bold" className="w-6 h-6" />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const res = await fetch('/api/gift-cards', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      type: formData.get('type'),
                      value: Number(formData.get('value')),
                      recipientName: formData.get('recipientName'),
                      recipientEmail: formData.get('recipientEmail'),
                      validDays: Number(formData.get('validDays')) || 365
                    })
                  });
                  if (res.ok) {
                    setShowCreateModal(false);
                    fetchGiftCards();
                  }
                }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Asset Identity Tier</label>
                  <select name="type" className="w-full bg-secondary/30 border border-border rounded-2xl py-4 px-5 text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-medium appearance-none">
                    <option value="value" className="bg-card">Fiscal Credit (THB)</option>
                    <option value="percentage" className="bg-card">Percentage Delta (%)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Initialization Value</label>
                  <input
                    type="number"
                    name="value"
                    required
                    className="w-full bg-secondary/30 border border-border rounded-2xl py-4 px-5 text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold tabular-nums"
                    placeholder="0"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Target Name</label>
                    <input
                      type="text"
                      name="recipientName"
                      className="w-full bg-secondary/30 border border-border rounded-2xl py-4 px-5 text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-medium placeholder:text-muted-foreground/40"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Target Email</label>
                    <input
                      type="email"
                      name="recipientEmail"
                      className="w-full bg-secondary/30 border border-border rounded-2xl py-4 px-5 text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-medium placeholder:text-muted-foreground/40"
                      placeholder="identity@node.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Lifecycle Horizon (Days)</label>
                  <input
                    type="number"
                    name="validDays"
                    defaultValue={365}
                    className="w-full bg-secondary/30 border border-border rounded-2xl py-4 px-5 text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold tabular-nums"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 mt-10">
                  <Button type="submit" className="w-full sm:w-auto px-10 py-4 shadow-premium">
                    Authorize Node
                  </Button>
                  <Button 
                    type="button"
                    variant="ghost" 
                    onClick={() => setShowCreateModal(false)}
                    className="w-full sm:w-auto text-xs font-black uppercase tracking-widest text-muted-foreground"
                  >
                    Abort
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
