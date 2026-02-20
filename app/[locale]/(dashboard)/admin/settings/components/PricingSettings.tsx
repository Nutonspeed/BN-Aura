'use client';

import { useState, useEffect } from 'react';
import { 
  FloppyDisk,
  Plus,
  Trash,
  PencilSimple,
  CurrencyDollar,
  Users,
  TrendUp,
  Package,
  Percent,
  Clock,
  WarningCircle,
  Sparkle,
  Info,
  CaretDown,
  Check,
  Buildings,
  X,
  CaretRight
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettingsContext } from '../context';
import { SystemSettings } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface Plan {
  name: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  limits: {
    max_users: number;
    max_branches: number;
    max_ai_requests: number;
    storage_gb: number;
  };
  is_active: boolean;
  trial_days: number;
  discount_yearly: number;
}

interface AddOn {
  id: string;
  name: string;
  price: number;
  billing_cycle: 'monthly' | 'yearly' | 'one_time';
  description: string;
  is_active: boolean;
}

interface PricingSettingsProps {
  onSettingsChange?: (updates: Partial<SystemSettings>) => void;
}

export default function PricingSettings({ onSettingsChange }: PricingSettingsProps) {
  const { settings, updateSettings, loading } = useSettingsContext();
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [showAddOn, setShowAddOn] = useState(false);

  const [plans, setPlans] = useState<Record<string, Plan>>((settings?.subscription_plans as unknown) as Record<string, Plan> || {});
  const [addOns, setAddOns] = useState<AddOn[]>([
    {
      id: 'extra_ai',
      name: 'Extra AI Requests',
      price: 1000,
      billing_cycle: 'monthly',
      description: 'Additional 100 AI analysis requests per month',
      is_active: true
    },
    {
      id: 'priority_support',
      name: 'Priority Support',
      price: 5000,
      billing_cycle: 'monthly',
      description: '24/7 priority support with dedicated account manager',
      is_active: true
    },
    {
      id: 'custom_integration',
      name: 'Custom Integration',
      price: 50000,
      billing_cycle: 'one_time',
      description: 'One-time setup for custom API integrations',
      is_active: false
    }
  ]);

  const [newPlan, setNewPlan] = useState<Plan>({
    name: '',
    price_monthly: 0,
    price_yearly: 0,
    features: [],
    limits: {
      max_users: 1,
      max_branches: 1,
      max_ai_requests: 100,
      storage_gb: 5
    },
    is_active: true,
    trial_days: 14,
    discount_yearly: 20
  });

  const [newAddOn, setNewAddOn] = useState<AddOn>({
    id: '',
    name: '',
    price: 0,
    billing_cycle: 'monthly',
    description: '',
    is_active: true
  });

  const handleSavePlans = async () => {
    try {
      await updateSettings({
        subscription_plans: (plans as unknown) as any
      });
    } catch (error) {
      console.error('Failed to save plans:', error);
    }
  };

  const handleUpdatePlan = (planKey: string, field: keyof Plan, value: any) => {
    setPlans(prev => ({
      ...prev,
      [planKey]: {
        ...prev[planKey],
        [field]: value
      }
    }));
  };

  const handleAddPlan = () => {
    if (newPlan.name) {
      const key = newPlan.name.toLowerCase().replace(/\s+/g, '_');
      setPlans(prev => ({
        ...prev,
        [key]: newPlan
      }));
      setNewPlan({
        name: '',
        price_monthly: 0,
        price_yearly: 0,
        features: [],
        limits: {
          max_users: 1,
          max_branches: 1,
          max_ai_requests: 100,
          storage_gb: 5
        },
        is_active: true,
        trial_days: 14,
        discount_yearly: 20
      });
      setShowAddPlan(false);
    }
  };

  const handleDeletePlan = (planKey: string) => {
    if (confirm(`Are you sure you want to delete the ${planKey} plan?`)) {
      setPlans(prev => {
        const newPlans = { ...prev };
        delete newPlans[planKey];
        return newPlans;
      });
    }
  };

  const handleAddAddOn = () => {
    if (newAddOn.name) {
      setAddOns(prev => [...prev, { ...newAddOn, id: newAddOn.name.toLowerCase().replace(/\s+/g, '_') }]);
      setNewAddOn({
        id: '',
        name: '',
        price: 0,
        billing_cycle: 'monthly',
        description: '',
        is_active: true
      });
      setShowAddOn(false);
    }
  };

  const handleDeleteAddOn = (id: string) => {
    setAddOns(prev => prev.filter(addon => addon.id !== id));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <Card className="rounded-[40px] border-border/50 shadow-premium overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
          <CurrencyDollar className="w-64 h-64 text-primary" />
        </div>

        <CardHeader className="p-8 border-b border-border/50 bg-secondary/30 flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
              <CurrencyDollar weight="duotone" className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-black uppercase tracking-tight">Pricing Architecture</CardTitle>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black mt-0.5">Subscription tiers and automated add-on logic</p>
            </div>
          </div>
          <Button
            onClick={handleSavePlans}
            disabled={loading}
            className="gap-2 px-8 py-6 rounded-2xl text-xs font-black uppercase tracking-widest shadow-premium"
          >
            <FloppyDisk weight="bold" className="w-4 h-4" />
            Sync Parameters
          </Button>
        </CardHeader>

        <CardContent className="p-8 md:p-10 space-y-12 relative z-10">
          {/* Subscription Plans Section */}
          <div className="space-y-8">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
                <h3 className="text-[11px] font-black text-foreground uppercase tracking-[0.3em]">Protocol Tiers</h3>
              </div>
              <Button 
                variant="outline"
                onClick={() => setShowAddPlan(true)}
                className="gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-border/50 hover:bg-secondary"
              >
                <Plus weight="bold" className="w-3 h-3" />
                Initialize Tier
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {Object.entries(plans).map(([key, plan]) => (
                <div key={key} className="group/plan relative">
                  <motion.div
                    layout
                    className={cn(
                      "p-8 rounded-[32px] border transition-all duration-500",
                      editingPlan === key 
                        ? "bg-primary/[0.02] border-primary/30 shadow-premium" 
                        : "bg-secondary/20 border-border/50 hover:border-primary/20"
                    )}
                  >
                    {editingPlan === key ? (
                      <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Tier Designation</label>
                            <input
                              type="text"
                              value={plan.name}
                              onChange={(e) => handleUpdatePlan(key, 'name', e.target.value)}
                              className="w-full bg-secondary/50 border border-border rounded-2xl py-4 px-6 text-sm text-foreground focus:border-primary outline-none transition-all font-bold shadow-inner"
                            />
                          </div>
                          <div className="flex items-center gap-6 pt-6">
                            <button
                              onClick={() => handleUpdatePlan(key, 'is_active', !plan.is_active)}
                              className={cn(
                                "relative w-12 h-6 rounded-full transition-all duration-500 shadow-inner",
                                plan.is_active ? "bg-emerald-500 shadow-glow-sm" : "bg-card border border-border/50"
                              )}
                            >
                              <motion.div
                                className="absolute top-0.5 w-5 h-5 rounded-full bg-white flex items-center justify-center transition-all duration-500"
                                animate={{ left: plan.is_active ? 24 : 2 }}
                              />
                            </button>
                            <span className="text-[10px] font-black text-foreground uppercase tracking-widest">Active Lifecycle</span>
                            
                            <div className="flex items-center gap-3 ml-auto px-4 py-2 bg-secondary/50 rounded-xl border border-border/50">
                              <Clock weight="bold" className="w-4 h-4 text-primary/60" />
                              <input
                                type="number"
                                value={plan.trial_days}
                                onChange={(e) => handleUpdatePlan(key, 'trial_days', parseInt(e.target.value))}
                                className="w-12 bg-transparent border-none text-center text-sm font-bold text-foreground focus:outline-none"
                              />
                              <span className="text-[9px] font-black text-muted-foreground uppercase">Trial Days</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Monthly Valuation (THB)</label>
                            <div className="relative group/input">
                              <CurrencyDollar weight="bold" className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors" />
                              <input
                                type="number"
                                value={plan.price_monthly}
                                onChange={(e) => handleUpdatePlan(key, 'price_monthly', parseInt(e.target.value))}
                                className="w-full bg-secondary/50 border border-border rounded-2xl py-4 pl-12 pr-6 text-sm text-foreground focus:border-primary outline-none transition-all font-bold shadow-inner tabular-nums"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Annual Valuation (THB)</label>
                            <div className="relative group/input">
                              <CurrencyDollar weight="bold" className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors" />
                              <input
                                type="number"
                                value={plan.price_yearly}
                                onChange={(e) => handleUpdatePlan(key, 'price_yearly', parseInt(e.target.value))}
                                className="w-full bg-secondary/50 border border-border rounded-2xl py-4 pl-12 pr-6 text-sm text-foreground focus:border-primary outline-none transition-all font-bold shadow-inner tabular-nums"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Feature Payload (New line delimited)</label>
                          <textarea
                            value={plan.features.join('\n')}
                            onChange={(e) => handleUpdatePlan(key, 'features', e.target.value.split('\n').filter(f => f.trim()))}
                            rows={4}
                            className="w-full bg-secondary/50 border border-border rounded-2xl py-4 px-6 text-sm text-foreground focus:border-primary outline-none transition-all font-medium shadow-inner resize-none italic"
                          />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          {[
                            { key: 'max_users', label: 'Max Identities', icon: Users },
                            { key: 'max_branches', label: 'Cluster Nodes', icon: Package },
                            { key: 'max_ai_requests', label: 'Neural Cycles', icon: TrendUp },
                            { key: 'storage_gb', label: 'Storage (GB)', icon: Package }
                          ].map((limit) => (
                            <div key={limit.key} className="space-y-2">
                              <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <limit.icon weight="bold" className="w-3 h-3" />
                                {limit.label}
                              </label>
                              <input
                                type="number"
                                value={plan.limits[limit.key as keyof typeof plan.limits]}
                                onChange={(e) => handleUpdatePlan(key, 'limits', { ...plan.limits, [limit.key]: parseInt(e.target.value) })}
                                className="w-full bg-secondary/50 border border-border rounded-xl py-3 px-4 text-xs text-foreground focus:border-primary outline-none transition-all font-bold tabular-nums"
                              />
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-end pt-4">
                          <Button
                            onClick={() => setEditingPlan(null)}
                            className="gap-2 px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-premium"
                          >
                            <Check weight="bold" className="w-4 h-4" />
                            Seal Protocol
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                          <div className={cn(
                            "w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-500 shadow-inner",
                            plan.is_active ? "bg-primary/10 border-primary/20 text-primary" : "bg-secondary border-border text-muted-foreground opacity-40"
                          )}>
                            <Package weight="duotone" className="w-8 h-8" />
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-3">
                              <h4 className="text-xl font-black text-foreground uppercase tracking-tight">{plan.name}</h4>
                              <Badge variant={plan.is_active ? 'success' : 'secondary'} size="sm" className="font-black text-[8px] tracking-widest px-2">
                                {plan.is_active ? 'OPERATIONAL' : 'OFFLINE'}
                              </Badge>
                            </div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                              {plan.trial_days} Day Evaluation Window • {plan.features.length} Payload Nodes
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-10">
                          <div>
                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Cycle Value</p>
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-black text-foreground tabular-nums tracking-tighter">{formatPrice(plan.price_monthly)}</span>
                              <span className="text-[9px] font-bold text-muted-foreground uppercase">/Mo</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setEditingPlan(key)}
                              className="h-11 w-11 p-0 rounded-2xl border-border/50 hover:bg-secondary"
                            >
                              <PencilSimple weight="bold" className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDeletePlan(key)}
                              className="h-11 w-11 p-0 rounded-2xl border-border/50 hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/20"
                            >
                              <Trash weight="bold" className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>
              ))}
            </div>
          </div>

          {/* Add-ons Architecture */}
          <div className="space-y-8 pt-10 border-t border-border/50">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                <h3 className="text-[11px] font-black text-foreground uppercase tracking-[0.3em]">Peripheral Nodes</h3>
              </div>
              <Button 
                variant="outline"
                onClick={() => setShowAddOn(true)}
                className="gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-border/50 hover:bg-secondary"
              >
                <Plus weight="bold" className="w-3 h-3" />
                Inject Add-on
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {addOns.map((addon) => (
                <Card key={addon.id} className="p-6 bg-secondary/20 border-border/50 hover:border-primary/20 transition-all group/addon overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover/addon:scale-110 transition-transform">
                    <Sparkle weight="fill" className="w-16 h-16 text-primary" />
                  </div>
                  <div className="space-y-5 relative z-10">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1.5">
                        <h4 className="text-sm font-bold text-foreground group-hover/addon:text-primary transition-colors uppercase tracking-tight">{addon.name}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant={addon.is_active ? 'success' : 'secondary'} size="sm" className="text-[7px] px-1.5 py-0.5">
                            {addon.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </Badge>
                          <span className="text-[8px] font-black text-muted-foreground uppercase tracking-tighter opacity-60">[{addon.billing_cycle}]</span>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteAddOn(addon.id)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/5 rounded-lg"
                      >
                        <Trash weight="bold" className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-medium italic leading-relaxed opacity-80 h-8 line-clamp-2">
                      {addon.description}
                    </p>
                    <div className="pt-4 border-t border-border/30 flex items-center justify-between">
                      <p className="text-lg font-black text-foreground tabular-nums tracking-tighter">{formatPrice(addon.price)}</p>
                      <Badge variant="ghost" className="bg-primary/5 text-primary border-none text-[8px] font-black tracking-widest uppercase">Cycle Node</Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Regulatory & Discount Parameters */}
          <div className="pt-10 border-t border-border/50">
            <h4 className="text-[10px] font-black text-foreground uppercase tracking-[0.3em] flex items-center gap-3 mb-8 px-2">
              <Percent weight="bold" className="w-5 h-5 text-primary" />
              Valuation Modifiers
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-2">
              {[
                { label: 'Annual Lifecycle Yield', value: '20', desc: 'Standardized sync discount factor.', icon: TrendUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { label: 'Multi-cluster Rebate', value: '15', desc: 'Active for 3+ clinical nodes.', icon: Buildings, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { label: 'Non-profit Protocol', value: '25', desc: 'Humanitarian sector initialization.', icon: Sparkle, color: 'text-purple-500', bg: 'bg-purple-500/10' }
              ].map((modifier, i) => (
                <div key={i} className="p-6 bg-secondary/20 rounded-[32px] border border-border/50 flex flex-col items-center text-center gap-4 group/mod hover:bg-secondary/40 transition-all overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover/mod:scale-110 transition-transform">
                    <modifier.icon weight="fill" className="w-16 h-16 text-primary" />
                  </div>
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner group-hover/mod:scale-110 transition-all", modifier.bg, modifier.color)}>
                    <modifier.icon weight="duotone" className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 relative z-10">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{modifier.label}</p>
                    <div className="flex items-center justify-center gap-1.5">
                      <span className={cn("text-2xl font-black tabular-nums tracking-tighter", modifier.color)}>{modifier.value}%</span>
                      <Badge variant="ghost" className="bg-white/5 border-none text-[8px] font-black text-muted-foreground uppercase">Factor</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium italic opacity-60 pt-2">{modifier.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Plan Modal - Premiumized */}
      <AnimatePresence>
        {showAddPlan && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowAddPlan(false)}
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-card border border-border rounded-[40px] overflow-hidden shadow-premium group p-10"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                <Plus className="w-64 h-64 text-primary" />
              </div>

              <div className="relative z-10 space-y-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                      <Package weight="duotone" className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground tracking-tight uppercase">Protocol Synthesis</h3>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Initialize new subscription tier node</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowAddPlan(false)} className="h-10 w-10 p-0 rounded-xl hover:bg-secondary">
                    <X weight="bold" className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Tier Identity *</label>
                      <input
                        type="text"
                        value={newPlan.name}
                        onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                        placeholder="e.g. Enterprise Alpha"
                        className="w-full bg-secondary/50 border border-border rounded-2xl py-4 px-6 text-sm text-foreground focus:border-primary outline-none transition-all font-bold shadow-inner"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Evaluation Window (Days)</label>
                      <div className="relative">
                        <Clock weight="bold" className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                        <input
                          type="number"
                          value={newPlan.trial_days}
                          onChange={(e) => setNewPlan({ ...newPlan, trial_days: parseInt(e.target.value) })}
                          className="w-full bg-secondary/50 border border-border rounded-2xl py-4 pl-12 pr-6 text-sm text-foreground focus:border-primary outline-none transition-all font-bold shadow-inner tabular-nums"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Monthly Valuation (THB) *</label>
                      <div className="relative group/input">
                        <CurrencyDollar weight="bold" className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors" />
                        <input
                          type="number"
                          value={newPlan.price_monthly}
                          onChange={(e) => setNewPlan({ ...newPlan, price_monthly: parseInt(e.target.value) })}
                          className="w-full bg-secondary/50 border border-border rounded-2xl py-4 pl-12 pr-6 text-sm text-foreground focus:border-primary outline-none transition-all font-bold shadow-inner tabular-nums"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Annual Valuation (THB) *</label>
                      <div className="relative group/input">
                        <CurrencyDollar weight="bold" className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors" />
                        <input
                          type="number"
                          value={newPlan.price_yearly}
                          onChange={(e) => setNewPlan({ ...newPlan, price_yearly: parseInt(e.target.value) })}
                          className="w-full bg-secondary/50 border border-border rounded-2xl py-4 pl-12 pr-6 text-sm text-foreground focus:border-primary outline-none transition-all font-bold shadow-inner tabular-nums"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddPlan(false)}
                    className="flex-1 py-6 rounded-[24px] text-[10px] font-black uppercase tracking-widest border-border/50 hover:bg-secondary"
                  >
                    Abort Synthesis
                  </Button>
                  <Button
                    onClick={handleAddPlan}
                    className="flex-[2] py-6 rounded-[24px] text-[10px] font-black uppercase tracking-widest shadow-premium gap-3"
                  >
                    <Plus weight="bold" className="w-4 h-4" />
                    Commit Tier
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Add-on Modal - Premiumized */}
      <AnimatePresence>
        {showAddOn && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowAddOn(false)}
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-card border border-border rounded-[40px] overflow-hidden shadow-premium group p-10"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                <Sparkle className="w-64 h-64 text-emerald-500" />
              </div>

              <div className="relative z-10 space-y-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-sm">
                      <Sparkle weight="duotone" className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground tracking-tight uppercase">เพิ่มบริการเสริม</h3>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">เพิ่มบริการเสริมใหม่</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowAddOn(false)} className="h-10 w-10 p-0 rounded-xl hover:bg-secondary">
                    <X weight="bold" className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Add-on Identity *</label>
                    <input
                      type="text"
                      value={newAddOn.name}
                      onChange={(e) => setNewAddOn({ ...newAddOn, name: e.target.value })}
                      placeholder="e.g. Extra Neural Capacity"
                      className="w-full bg-secondary/50 border border-border rounded-2xl py-4 px-6 text-sm text-foreground focus:border-primary outline-none transition-all font-bold shadow-inner"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Node Valuation (THB) *</label>
                      <div className="relative group/input">
                        <CurrencyDollar weight="bold" className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors" />
                        <input
                          type="number"
                          value={newAddOn.price}
                          onChange={(e) => setNewAddOn({ ...newAddOn, price: parseInt(e.target.value) })}
                          className="w-full bg-secondary/50 border border-border rounded-2xl py-4 pl-12 pr-6 text-sm text-foreground focus:border-primary outline-none transition-all font-bold shadow-inner tabular-nums"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Settlement Cycle *</label>
                      <div className="relative">
                        <select
                          value={newAddOn.billing_cycle}
                          onChange={(e) => setNewAddOn({ ...newAddOn, billing_cycle: e.target.value as any })}
                          className="w-full bg-secondary/50 border border-border rounded-2xl py-4 px-6 text-xs text-foreground focus:border-primary outline-none transition-all appearance-none font-black uppercase tracking-widest"
                        >
                          <option value="monthly" className="bg-card">MONTHLY_SYNC</option>
                          <option value="yearly" className="bg-card">ANNUAL_SYNC</option>
                          <option value="one_time" className="bg-card">INSTANT_CREDIT</option>
                        </select>
                        <CaretRight weight="bold" className="absolute right-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rotate-90 text-muted-foreground/40 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Protocol Description</label>
                    <input
                      type="text"
                      value={newAddOn.description}
                      onChange={(e) => setNewAddOn({ ...newAddOn, description: e.target.value })}
                      placeholder="Brief specification of the peripheral node..."
                      className="w-full bg-secondary/50 border border-border rounded-2xl py-4 px-6 text-sm text-foreground focus:border-primary outline-none transition-all font-medium shadow-inner italic"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddOn(false)}
                    className="flex-1 py-6 rounded-[24px] text-[10px] font-black uppercase tracking-widest border-border/50 hover:bg-secondary"
                  >
                    Abort Injection
                  </Button>
                  <Button
                    onClick={handleAddAddOn}
                    className="flex-[2] py-6 rounded-[24px] text-[10px] font-black uppercase tracking-widest shadow-premium gap-3"
                  >
                    <Plus weight="bold" className="w-4 h-4" />
                    Commit Add-on
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
