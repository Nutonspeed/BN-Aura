'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Rocket,
  Check,
  Spinner,
  ArrowLeft,
  Lightning,
  Crown,
  Star,
  Buildings,
  ChartBar,
  Users,
  Headset,
  Palette
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/routing';

interface SubscriptionData {
  tier: string;
  isActive: boolean;
  maxStaff: number;
  createdAt: string;
  quota: {
    limit: number;
    used: number;
    resetDate: string;
    overage: number;
  } | null;
  planDetails: {
    id: string;
    name: string;
    monthlyQuota: number;
    monthlyPrice: number;
    scanPrice: number;
    features: Record<string, boolean>;
    description: string;
  } | null;
}

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 2990,
    quota: 50,
    scanPrice: 75,
    icon: Star,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    features: ['50 AI scans/month', '3 staff accounts', 'Basic reports', 'Proposal generation'],
    missing: ['Advanced analysis', 'Lead scoring', 'Realtime support', 'Custom branding']
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 8990,
    quota: 200,
    scanPrice: 60,
    icon: Rocket,
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
    recommended: true,
    features: ['200 AI scans/month', '10 staff accounts', 'Advanced reports', 'Advanced analysis', 'Lead scoring', 'Proposal generation'],
    missing: ['Realtime support', 'Custom branding']
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 19990,
    quota: 500,
    scanPrice: 45,
    icon: Crown,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    features: ['500 AI scans/month', '25 staff accounts', 'All features', 'Realtime support', 'Priority support'],
    missing: ['Unlimited scans', 'White-label']
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 39990,
    quota: 1000,
    scanPrice: 35,
    icon: Buildings,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    features: ['1,000 AI scans/month', 'Unlimited staff', 'All features', 'White-label', 'Dedicated support', 'Custom integrations'],
    missing: []
  }
];

export default function BillingPage() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/clinic/subscription', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSubscription(data.data);
      }
    } catch (e) {
      console.error('Failed to fetch subscription:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSubscription(); }, [fetchSubscription]);

  const handleUpgrade = async (planId: string) => {
    setUpgrading(planId);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/clinic/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ planId })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`อัปเกรดเป็น ${data.data.plan.name} สำเร็จ`);
        fetchSubscription();
      } else {
        toast.error(data.error?.message || 'เกิดข้อผิดพลาด');
      }
    } catch (e) {
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setUpgrading(null);
    }
  };

  const formatTHB = (n: number) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(n);
  const currentTier = subscription?.tier || 'starter';
  const quotaUsed = subscription?.quota?.used || 0;
  const quotaLimit = subscription?.quota?.limit || 50;
  const usagePercent = Math.min(Math.round((quotaUsed / quotaLimit) * 100), 100);

  return (
    <div className="space-y-8 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/clinic/settings')} className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <CreditCard weight="duotone" className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold">แพ็กเกจและการเรียกเก็บเงิน</h1>
            <p className="text-sm text-muted-foreground">จัดการแพ็กเกจ AI Scan และ quota ของคลินิก</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Current Plan & Usage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">แพ็กเกจปัจจุบัน</h2>
                <Badge variant="default" size="sm" className="bg-primary/10 text-primary border-primary/20">
                  {subscription?.planDetails?.name || currentTier}
                </Badge>
              </div>
              <div>
                <p className="text-3xl font-bold">{formatTHB(subscription?.planDetails?.monthlyPrice || 2990)}<span className="text-sm font-normal text-muted-foreground">/เดือน</span></p>
                <p className="text-xs text-muted-foreground mt-1">{subscription?.planDetails?.description || ''}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Lightning className="w-4 h-4 text-primary" />
                  <span>{quotaLimit} scans/เดือน</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span>{subscription?.maxStaff || 3} staff</span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">การใช้งานเดือนนี้</h2>
              <div>
                <div className="flex items-end justify-between mb-2">
                  <p className="text-3xl font-bold">{quotaUsed}<span className="text-sm font-normal text-muted-foreground">/{quotaLimit}</span></p>
                  <span className={cn("text-sm font-bold", usagePercent > 90 ? "text-red-500" : usagePercent > 70 ? "text-amber-500" : "text-emerald-500")}>
                    {usagePercent}%
                  </span>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", usagePercent > 90 ? "bg-red-500" : usagePercent > 70 ? "bg-amber-500" : "bg-emerald-500")}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  เหลือ {quotaLimit - quotaUsed} scans | รีเซ็ต: {subscription?.quota?.resetDate ? new Date(subscription.quota.resetDate).toLocaleDateString('th-TH') : '-'}
                </p>
                {(subscription?.quota?.overage || 0) > 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    ค่าใช้จ่ายเกิน quota: {formatTHB(subscription!.quota!.overage)} ({formatTHB(subscription?.planDetails?.scanPrice || 75)}/scan)
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Plans */}
          <div>
            <h2 className="text-lg font-bold mb-4">เลือกแพ็กเกจ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {PLANS.map(plan => {
                const Icon = plan.icon;
                const isCurrent = currentTier === plan.id;
                const planIndex = PLANS.findIndex(p => p.id === plan.id);
                const currentIndex = PLANS.findIndex(p => p.id === currentTier);
                const isDowngrade = planIndex < currentIndex;

                return (
                  <div key={plan.id} className={cn(
                    "bg-card border rounded-2xl p-5 space-y-4 relative transition-all",
                    isCurrent ? "border-primary shadow-lg ring-1 ring-primary/20" : "border-border hover:border-primary/30",
                    plan.recommended && !isCurrent ? "ring-1 ring-primary/10" : ""
                  )}>
                    {plan.recommended && !isCurrent && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge variant="default" size="sm" className="text-[9px] font-black uppercase tracking-widest">แนะนำ</Badge>
                      </div>
                    )}
                    {isCurrent && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge variant="default" size="sm" className="bg-emerald-500 text-[9px] font-black uppercase tracking-widest">ใช้งานอยู่</Badge>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", plan.bg, plan.border)}>
                        <Icon weight="duotone" className={cn("w-5 h-5", plan.color)} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold">{plan.name}</h3>
                        <p className="text-lg font-bold">{formatTHB(plan.price)}<span className="text-[10px] font-normal text-muted-foreground">/เดือน</span></p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {plan.features.map(f => (
                        <div key={f} className="flex items-center gap-2 text-[11px]">
                          <Check weight="bold" className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>

                    <Button
                      variant={isCurrent ? "outline" : "default"}
                      onClick={() => !isCurrent && !isDowngrade && handleUpgrade(plan.id)}
                      disabled={isCurrent || isDowngrade || upgrading === plan.id}
                      className="w-full rounded-xl text-xs font-bold"
                    >
                      {upgrading === plan.id ? (
                        <Spinner className="w-4 h-4 animate-spin" />
                      ) : isCurrent ? (
                        'แพ็กเกจปัจจุบัน'
                      ) : isDowngrade ? (
                        'ติดต่อฝ่ายขาย'
                      ) : (
                        'อัปเกรด'
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
