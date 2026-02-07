'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { 
  Crown,
  Star,
  Gift,
  TrendUp,
  CalendarDots,
  Users,
  Medal,
  Sparkle,
  CaretRight,
  Trophy,
  Lightning,
  Copy,
  Check,
  ArrowsClockwise,
  IdentificationBadge,
  ShieldCheck,
  ClockCounterClockwise,
  Coins,
  TrendDown,
  Icon,
  CheckCircle,
  X,
  SpinnerGap
} from '@phosphor-icons/react';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { LoyaltyProfile, LoyaltyTier, Achievement, PointTransaction } from '@/lib/customer/loyaltySystem';

interface LoyaltyDashboardProps {
  customerId: string;
  clinicId: string;
}

export default function LoyaltyDashboard({ customerId, clinicId }: LoyaltyDashboardProps) {
  const [profile, setProfile] = useState<LoyaltyProfile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchLoyaltyData();
  }, [customerId, clinicId]);

  const fetchLoyaltyData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/customer/loyalty?customerId=${customerId}&clinicId=${clinicId}`);
      const data = await response.json();
      if (data.success) {
        setProfile(data.profile);
        setAchievements(data.achievements);
        setTransactions(data.transactions.map((t: any) => ({
          ...t,
          createdAt: new Date(t.created_at)
        })));
      }
    } catch (error) {
      console.error('Loyalty data sync error:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyRefCode = () => {
    if (profile?.referralCode) {
      navigator.clipboard.writeText(profile.referralCode);
      setCopied(true);
      toast.success('Referral code synchronized to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="py-48 flex flex-col items-center justify-center gap-6 bg-card border border-border/50 rounded-[40px] shadow-inner opacity-60">
        <SpinnerGap weight="bold" className="w-12 h-12 text-primary animate-spin" />
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] text-center">Synchronizing Loyalty Matrix...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Tier Status Node */}
      <Card className="rounded-[48px] border-border/50 shadow-premium overflow-hidden group">
        <CardHeader className="p-8 md:p-12 border-b border-border/50 bg-secondary/30 relative">
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <Crown weight="fill" className="w-64 h-64 text-primary" />
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 relative z-10">
            <div className="flex items-center gap-8">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner group-hover:bg-primary/20 transition-all duration-500">
                <Crown weight="duotone" className="w-10 h-10 shadow-glow-sm" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-black text-foreground uppercase tracking-tight">{profile?.currentTier || 'Aura Basic'} Protocol</h2>
                  <Badge variant="success" className="font-black text-[10px] tracking-widest px-4 py-1.5 shadow-sm">ACTIVE_NODE</Badge>
                </div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Identity Tier Status & Evolution Progress</p>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="text-right">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Accumulated Flux</p>
                <div className="flex items-center justify-end gap-2">
                  <Coins weight="fill" className="w-5 h-5 text-amber-500" />
                  <span className="text-4xl font-black text-foreground tabular-nums tracking-tighter">{profile?.totalPoints || 0}</span>
                </div>
              </div>
              <div className="h-12 w-px bg-border/50" />
              <div className="text-right">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Next Evolution</p>
                <span className="text-xl font-bold text-foreground/60 uppercase tracking-tighter italic">Elite Tier</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-10 md:p-12 space-y-10 relative z-10">
          <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Evolution Trajectory</span>
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">750 / 1000 Flux Units</span>
            </div>
            <div className="h-3 w-full bg-secondary/50 rounded-full overflow-hidden p-0.5 border border-border shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '75%' }}
                transition={{ duration: 2, ease: "circOut" }}
                className="h-full bg-primary rounded-full shadow-glow-sm"
              />
            </div>
            <p className="text-[11px] text-muted-foreground font-medium italic text-center opacity-60">
              Increase engagement delta by 250 units to establish high-fidelity status node.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Achievements Matrix */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(var(--primary),0.6)]" />
              <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Privilege <span className="text-primary text-glow">Matrix</span></h3>
            </div>
            <Badge variant="ghost" className="bg-primary/5 text-primary border-none font-black text-[10px] tracking-widest uppercase px-4 py-1.5 shadow-sm">
              {achievements.length} Nodes Unlocked
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {achievements.map((achievement, idx) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className={cn(
                  "p-6 rounded-[32px] border transition-all duration-500 relative overflow-hidden group/achieve",
                  achievement.isActive ? "border-primary/30 bg-primary/5 shadow-card" : "border-border/50 bg-secondary/20 opacity-60 grayscale"
                )}>
                  <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover/achieve:scale-110 transition-transform">
                    <Trophy weight="fill" className="w-20 h-20 text-primary" />
                  </div>
                  
                  <div className="flex items-center gap-5 relative z-10">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl border flex items-center justify-center shadow-inner transition-all duration-500",
                      achievement.isActive ? "bg-primary/10 border-primary/20 text-primary" : "bg-secondary border-border text-muted-foreground"
                    )}>
                      {achievement.isActive ? <Medal weight="duotone" className="w-7 h-7" /> : <ShieldCheck weight="duotone" className="w-7 h-7" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-black text-foreground uppercase tracking-tight truncate leading-tight">{achievement.name}</h4>
                      <p className="text-[10px] text-muted-foreground font-medium italic mt-1 leading-relaxed opacity-80">{achievement.description}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Transaction Ledger Hub */}
        <div className="space-y-8">
          <Card className="rounded-[40px] border-border/50 shadow-premium overflow-hidden group">
            <CardHeader className="p-8 border-b border-border/50 bg-secondary/30 relative">
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                    <ClockCounterClockwise weight="duotone" className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-sm font-black uppercase tracking-widest">Protocol Ledger</CardTitle>
                </div>
                <Badge variant="ghost" className="bg-primary/5 text-primary border-none font-black text-[8px] uppercase tracking-widest px-3 py-1">LATEST_SYNC</Badge>
              </div>
            </CardHeader>

            <CardContent className="p-8 space-y-8 relative z-10">
              {transactions.length === 0 ? (
                <div className="py-20 text-center opacity-40">
                  <div className="w-16 h-16 rounded-[32px] bg-secondary flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <ClockCounterClockwise weight="duotone" className="w-8 h-8" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest">No Protocol Logs</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {transactions.slice(0, 8).map((txn, i) => (
                    <motion.div
                      key={txn.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * i }}
                      className="flex gap-4 group/log"
                    >
                      <div className="flex flex-col items-center gap-2 pt-1">
                        <div className={cn(
                          "w-2.5 h-2.5 rounded-full shadow-sm",
                          txn.type === 'earned' ? "bg-emerald-500 shadow-glow-sm" : "bg-rose-500 shadow-glow-sm"
                        )} />
                        {i !== (Math.min(transactions.length, 8) - 1) && <div className="w-px h-full bg-border/50 group-hover/log:bg-primary/20 transition-colors" />}
                      </div>
                      <div className="flex-1 pb-6 group-last/log:pb-0">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-xs font-bold text-foreground group-hover/log:text-primary transition-colors tracking-tight uppercase">{txn.description}</p>
                          <span className={cn(
                            "text-[10px] font-black tabular-nums",
                            txn.type === 'earned' ? "text-emerald-500" : "text-rose-500"
                          )}>
                            {txn.type === 'earned' ? '+' : '-'}{txn.amount}
                          </span>
                        </div>
                        <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-tighter opacity-60">NODE_TS: {txn.createdAt.toLocaleDateString()}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              <Button variant="ghost" className="w-full mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-primary border border-dashed border-border/50 py-5 rounded-[24px] shadow-sm transition-all hover:bg-primary/5">
                Access Full Archives
              </Button>
            </CardContent>
          </Card>

          {/* Referral Protocol Node */}
          <Card className="rounded-[40px] border-border/50 shadow-premium overflow-hidden group">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-secondary border border-border/50 flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500 shadow-inner">
                  <Users weight="duotone" className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-foreground uppercase tracking-[0.2em]">Identity Propagation</h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Referral Protocol</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 bg-secondary/30 border border-border/50 p-4 rounded-2xl shadow-inner group/code relative overflow-hidden">
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-focus-within/code:opacity-100 transition-opacity" />
                  <code className="text-sm font-black text-primary flex-1 truncate relative z-10 tracking-[0.2em]">
                    {profile?.referralCode || 'NODE_PENDING'}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyRefCode}
                    className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all relative z-10"
                  >
                    {copied ? <Check weight="bold" className="w-4.5 h-4.5 text-emerald-500" /> : <Copy weight="bold" className="w-4.5 h-4.5" />}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground font-medium italic opacity-60 px-1 leading-relaxed">
                  Propagate your identity node to earn 50 flux units for every clinical synchronization established.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Integrity Note */}
          <Card className="p-8 rounded-[40px] border-emerald-500/10 bg-emerald-500/[0.02] space-y-4 group shadow-inner">
            <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] flex items-center gap-3">
              <ShieldCheck weight="duotone" className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Protocol Integrity
            </h4>
            <p className="text-[11px] text-muted-foreground italic font-medium leading-relaxed opacity-80">
              All loyalty nodes are synchronized with clinical ERP cluster alpha. Privilege points carry zero fiscal valuation outside the BN-Aura ecosystem.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}