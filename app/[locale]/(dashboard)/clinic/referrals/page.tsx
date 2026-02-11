'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { motion } from 'framer-motion';
import {
  Handshake,
  SpinnerGap,
  Copy,
  Check,
  Users,
  TrendUp,
  Gift,
  ArrowRight,
  Plus
} from '@phosphor-icons/react';
import { toast } from 'sonner';

interface ReferralStats {
  total: number;
  completed: number;
  pending: number;
  conversionRate: number;
  totalRewardsGiven: number;
}

interface Referral {
  id: string;
  referral_code: string;
  status: string;
  referrer_reward_value: number;
  referred_reward_value: number;
  created_at: string;
  completed_at: string | null;
  referrer?: { id: string; full_name: string };
  referred?: { id: string; full_name: string };
}

export default function ReferralsPage() {
  const [stats, setStats] = useState<ReferralStats>({ total: 0, completed: 0, pending: 0, conversionRate: 0, totalRewardsGiven: 0 });
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [customerId, setCustomerId] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, listRes] = await Promise.all([
        fetch('/api/referrals?action=stats'),
        fetch('/api/referrals?action=list'),
      ]);
      const statsData = await statsRes.json();
      const listData = await listRes.json();
      if (statsData.success) setStats(statsData.data);
      if (listData.success) setReferrals(listData.data);
    } catch (e) {
      console.error('Failed to fetch referrals:', e);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = async () => {
    if (!customerId.trim()) return toast.error('กรุณาระบุ Customer ID');
    setGenerating(true);
    try {
      const res = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', referrerCustomerId: customerId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`สร้างโค้ด ${data.data.referral_code} สำเร็จ`);
        setCustomerId('');
        fetchData();
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch { toast.error('เกิดข้อผิดพลาด'); }
    finally { setGenerating(false); }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`คัดลอกโค้ด ${code} แล้ว`);
  };

  const completeReferral = async (id: string) => {
    try {
      const res = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reward', id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('ให้รางวัลสำเร็จ');
        fetchData();
      }
    } catch { toast.error('เกิดข้อผิดพลาด'); }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });

  const statusMap: Record<string, { label: string; variant: 'default' | 'ghost' | 'destructive' }> = {
    pending: { label: 'รอดำเนินการ', variant: 'ghost' },
    completed: { label: 'สำเร็จ', variant: 'default' },
    rewarded: { label: 'ให้รางวัลแล้ว', variant: 'default' },
    expired: { label: 'หมดอายุ', variant: 'destructive' },
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <SpinnerGap className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-12">
      <Breadcrumb />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest">
            <Handshake weight="duotone" className="w-4 h-4" />
            ระบบแนะนำเพื่อน
          </div>
          <h1 className="text-2xl font-black tracking-tight">Referral Program</h1>
          <p className="text-sm text-muted-foreground">จัดการโค้ดแนะนำเพื่อนและติดตามรางวัล</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-2">
        {[
          { label: 'ทั้งหมด', value: stats.total, icon: Users, color: 'text-blue-500' },
          { label: 'สำเร็จ', value: stats.completed, icon: Check, color: 'text-emerald-500' },
          { label: 'อัตราแปลง', value: `${stats.conversionRate}%`, icon: TrendUp, color: 'text-primary' },
          { label: 'รางวัลที่ให้', value: `฿${stats.totalRewardsGiven.toLocaleString()}`, icon: Gift, color: 'text-amber-500' },
        ].map((stat, idx) => (
          <Card key={idx} className="p-5 rounded-2xl border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black mt-1">{stat.value}</p>
              </div>
              <stat.icon weight="duotone" className={`w-8 h-8 ${stat.color}`} />
            </div>
          </Card>
        ))}
      </div>

      {/* Generate Code */}
      <Card className="mx-2 p-5 rounded-2xl border-border/50 bg-gradient-to-r from-primary/5 to-emerald-500/5">
        <div className="flex flex-col md:flex-row items-end gap-4">
          <div className="flex-1 w-full">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">สร้างโค้ดแนะนำเพื่อน</label>
            <input
              value={customerId}
              onChange={e => setCustomerId(e.target.value)}
              className="w-full mt-1 px-4 py-3 bg-secondary border border-border rounded-xl text-sm"
              placeholder="Customer ID ของผู้แนะนำ"
            />
          </div>
          <Button onClick={generateCode} disabled={generating} className="gap-2 flex-shrink-0">
            {generating ? <SpinnerGap className="w-4 h-4 animate-spin" /> : <Plus weight="bold" className="w-4 h-4" />}
            สร้างโค้ด
          </Button>
        </div>
      </Card>

      {/* Referral List */}
      <div className="space-y-3 px-2">
        {referrals.length === 0 ? (
          <Card className="p-12 rounded-2xl border-border/50 text-center">
            <Handshake weight="duotone" className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">ยังไม่มีการแนะนำเพื่อน</p>
          </Card>
        ) : (
          referrals.map((ref, i) => (
            <motion.div key={ref.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="p-5 rounded-2xl border-border/50 hover:border-primary/20 transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <Handshake weight="bold" className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{ref.referrer?.full_name || 'ผู้แนะนำ'}</span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm font-bold">{ref.referred?.full_name || 'รอผู้ถูกแนะนำ'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{formatDate(ref.created_at)}</span>
                        <span>รางวัลผู้แนะนำ: ฿{ref.referrer_reward_value}</span>
                        <span>ส่วนลดผู้ถูกแนะนำ: {ref.referred_reward_value}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => copyCode(ref.referral_code)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-secondary rounded-xl text-xs font-bold font-mono hover:bg-secondary/80 transition-colors"
                    >
                      <Copy weight="bold" className="w-3.5 h-3.5" />
                      {ref.referral_code}
                    </button>
                    <Badge variant={statusMap[ref.status]?.variant || 'ghost'} size="sm">
                      {statusMap[ref.status]?.label || ref.status}
                    </Badge>
                    {ref.status === 'completed' && (
                      <Button size="sm" variant="outline" onClick={() => completeReferral(ref.id)} className="text-xs">
                        <Gift weight="bold" className="w-3.5 h-3.5 mr-1" />
                        ให้รางวัล
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
