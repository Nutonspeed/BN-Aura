'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import {
  Lightning,
  Warning,
  Brain,
  ArrowsClockwise,
  ChartBar,
  Clock,
  CheckCircle,
  XCircle,
  Sparkle,
  ShoppingCart,
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

interface MyQuotaData {
  clinicTotal: number;
  clinicUsed: number;
  clinicRemaining: number;
  clinicRate: number;
  myScans: number;
  mySuccessful: number;
  plan: string;
  resetDate: string;
}

interface ScanLog {
  id: string;
  usage_type: string;
  success: boolean;
  created_at: string;
  cost_usd: number;
}

export default function SalesQuotaPage() {
  const [loading, setLoading] = useState(true);
  const [quota, setQuota] = useState<MyQuotaData | null>(null);
  const [recentScans, setRecentScans] = useState<ScanLog[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: staff } = await supabase
        .from('clinic_staff')
        .select('clinic_id')
        .eq('user_id', user.id)
        .single();
      if (!staff?.clinic_id) return;

      // Fetch clinic-level quota
      const quotaRes = await fetch(`/api/quota/billing-test?action=quota-config&clinicId=${staff.clinic_id}`);
      const quotaResult = await quotaRes.json();

      // Fetch my personal usage from ai_usage_logs (single query, aggregate client-side)
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { data: allMyLogs } = await supabase
        .from('ai_usage_logs')
        .select('id, usage_type, success, created_at, cost_usd')
        .eq('clinic_id', staff.clinic_id)
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth)
        .order('created_at', { ascending: false });

      const myTotal = allMyLogs?.length ?? 0;
      const mySuccessful = allMyLogs?.filter(l => l.success).length ?? 0;

      if (quotaResult.success) {
        const q = quotaResult.data;
        const clinicUsed = q.currentUsage || 0;
        const clinicTotal = q.monthlyQuota || 200;
        setQuota({
          clinicTotal,
          clinicUsed,
          clinicRemaining: Math.max(0, clinicTotal - clinicUsed),
          clinicRate: clinicTotal > 0 ? Math.round((clinicUsed / clinicTotal) * 100) : 0,
          myScans: myTotal,
          mySuccessful,
          plan: q.plan || 'professional',
          resetDate: q.resetDate || '',
        });
      }

      setRecentScans((allMyLogs || []).slice(0, 20));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const getRemainingDays = () => {
    if (!quota?.resetDate) return 0;
    const reset = new Date(quota.resetDate);
    const now = new Date();
    return Math.max(0, Math.ceil((reset.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const getScanTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      quick: 'สแกนด่วน',
      detailed: 'สแกนละเอียด',
      premium: 'สแกน Premium',
      skin_analysis: 'วิเคราะห์ผิว',
      ai_chat: 'AI แชท',
    };
    return map[type] || type;
  };

  const clinicColor = quota
    ? quota.clinicRate >= 95 ? 'bg-red-500' : quota.clinicRate >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
    : 'bg-emerald-500';

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-32 rounded-2xl bg-secondary/50 animate-pulse" />)}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-6 max-w-2xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center">
            <Lightning weight="duotone" className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h1 className="text-xl font-black">โควต้า AI ของฉัน</h1>
            <p className="text-xs text-muted-foreground">การใช้งาน AI Scan เดือนนี้</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchData} className="gap-2">
          <ArrowsClockwise className="w-4 h-4" />
          รีเฟรช
        </Button>
      </div>

      {/* Clinic-wide Quota */}
      <Card className="rounded-2xl border-border/50 overflow-hidden">
        <CardHeader className="pb-3 bg-gradient-to-r from-purple-500/5 to-blue-500/5">
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChartBar weight="duotone" className="w-4 h-4 text-purple-500" />
              โควต้าคลินิกรวม
            </div>
            <Badge variant="outline" className="text-[9px]">{quota?.plan?.toUpperCase()}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-3xl font-black">{quota?.clinicRemaining ?? 0}</div>
              <div className="text-xs text-muted-foreground">การสแกนคงเหลือ</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-muted-foreground">
                {quota?.clinicUsed}/{quota?.clinicTotal}
              </div>
              <div className="text-xs text-muted-foreground">ใช้ไปแล้ว</div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(quota?.clinicRate ?? 0, 100)}%` }}
                transition={{ duration: 0.6 }}
                className={`h-full rounded-full ${clinicColor}`}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>ใช้ไป {quota?.clinicRate ?? 0}%</span>
              <span>รีเซ็ตใน {getRemainingDays()} วัน</span>
            </div>
          </div>

          {(quota?.clinicRate ?? 0) >= 80 && (
            <div className={`p-2 rounded-lg flex items-center gap-2 ${(quota?.clinicRate ?? 0) >= 95 ? 'bg-red-500/10 border border-red-500/30' : 'bg-amber-500/10 border border-amber-500/30'}`}>
              <Warning weight="fill" className={`w-4 h-4 ${(quota?.clinicRate ?? 0) >= 95 ? 'text-red-500' : 'text-amber-500'}`} />
              <span className={`text-xs ${(quota?.clinicRate ?? 0) >= 95 ? 'text-red-500' : 'text-amber-500'}`}>
                {(quota?.clinicRate ?? 0) >= 95
                  ? 'โควตาคลินิกใกล้หมด! แจ้งเจ้าของคลินิกซื้อเพิ่ม'
                  : 'โควตาคลินิกใช้ไปมากแล้ว'}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Personal Usage */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'สแกนของฉัน', value: quota?.myScans ?? 0, icon: Brain, color: 'text-blue-500', bg: 'from-blue-500/10 to-blue-500/5' },
          { label: 'สำเร็จ', value: quota?.mySuccessful ?? 0, icon: CheckCircle, color: 'text-emerald-500', bg: 'from-emerald-500/10 to-emerald-500/5' },
          { label: 'ล้มเหลว', value: (quota?.myScans ?? 0) - (quota?.mySuccessful ?? 0), icon: XCircle, color: 'text-red-400', bg: 'from-red-500/10 to-red-500/5' },
        ].map((item) => (
          <Card key={item.label} className={`rounded-2xl border-border/50 bg-gradient-to-br ${item.bg}`}>
            <CardContent className="p-4 flex flex-col gap-1">
              <item.icon weight="duotone" className={`w-5 h-5 ${item.color}`} />
              <div className="text-2xl font-black">{item.value}</div>
              <div className="text-[10px] text-muted-foreground">{item.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info box */}
      <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/40 border border-border/50">
        <Sparkle weight="duotone" className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          โควต้า AI เป็นของคลินิกรวม ไม่ใช่รายบุคคล — ทุกคนในทีมใช้จาก pool เดียวกัน
          หากโควต้าใกล้หมด แจ้งเจ้าของคลินิกเพื่อซื้อ Top-up
        </p>
      </div>

      {/* Recent Scans */}
      <Card className="rounded-2xl border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock weight="duotone" className="w-4 h-4 text-muted-foreground" />
            ประวัติการสแกนของฉัน (เดือนนี้)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentScans.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              ยังไม่มีประวัติการสแกนเดือนนี้
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {recentScans.map((scan) => (
                <div key={scan.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    {scan.success
                      ? <CheckCircle weight="fill" className="w-4 h-4 text-emerald-500" />
                      : <XCircle weight="fill" className="w-4 h-4 text-red-400" />
                    }
                    <div>
                      <p className="text-sm font-medium">{getScanTypeLabel(scan.usage_type)}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(scan.created_at).toLocaleDateString('th-TH', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <Badge variant={scan.success ? 'default' : 'destructive'} className="text-[9px]">
                    {scan.success ? 'สำเร็จ' : 'ล้มเหลว'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact owner CTA */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
        <ShoppingCart weight="duotone" className="w-6 h-6 text-purple-500 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-bold">ต้องการโควต้าเพิ่ม?</p>
          <p className="text-xs text-muted-foreground">แจ้งเจ้าของคลินิกเพื่อซื้อ Top-up หรืออัปเกรดแพ็กเกจ</p>
        </div>
      </div>
    </motion.div>
  );
}
